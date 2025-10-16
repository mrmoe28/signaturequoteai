/**
 * Subscription Middleware and Access Control
 *
 * Protect routes and features based on subscription level
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from './auth';
import {
  getUserSubscription,
  getCurrentUsage,
  incrementUsage,
  hasExceededLimit,
} from './db/subscription-queries';
import { getPlanBySlug, getPlanLimit, isPlanFeatureIncluded } from './subscription-plans';
import { createLogger } from './logger';

const logger = createLogger('subscription-middleware');

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

/**
 * Require minimum subscription level for API route
 */
export async function requireSubscription(minTier: SubscriptionTier = 'free') {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await getUserSubscription(user.id);

    // Determine user's current tier
    const currentTier: SubscriptionTier = subscription
      ? await getPlanTier(subscription.planId)
      : 'free';

    // Check if user meets minimum tier requirement
    const tierLevels = { free: 0, pro: 1, enterprise: 2 };

    if (tierLevels[currentTier] < tierLevels[minTier]) {
      return NextResponse.json(
        {
          error: 'Subscription required',
          message: `This feature requires ${minTier} plan or higher`,
          currentPlan: currentTier,
          requiredPlan: minTier,
          upgradeUrl: '/pricing',
        },
        { status: 403 }
      );
    }

    return null; // Authorized
  } catch (error) {
    logger.error({ error }, 'Subscription check failed');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(featureName: string): Promise<boolean> {
  try {
    const user = await getUser();
    if (!user) return false;

    const subscription = await getUserSubscription(user.id);

    if (!subscription) {
      // Free tier - check if feature is in free plan
      return isPlanFeatureIncluded('free', featureName);
    }

    // Get plan slug from subscription
    const plan = await getPlanBySlug(subscription.planId);
    if (!plan) return false;

    return isPlanFeatureIncluded(plan.slug, featureName);
  } catch (error) {
    logger.error({ error, featureName }, 'Feature access check failed');
    return false;
  }
}

/**
 * Check usage limit and optionally increment
 */
export async function checkUsageLimit(
  metric: 'quotes' | 'products' | 'emails' | 'storage' | 'users' | 'apiCalls',
  incrementBy: number = 1,
  autoIncrement: boolean = false
): Promise<{
  allowed: boolean;
  current: number;
  limit: number | null;
  remaining: number | null;
  upgradeUrl?: string;
  message?: string;
}> {
  try {
    const user = await getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const subscription = await getUserSubscription(user.id);

    // Get the limit for this metric from the plan
    let limit: number | null;

    if (!subscription) {
      // Free tier
      limit = getPlanLimit('free', metric);
    } else {
      const plan = await getPlanBySlug(subscription.planId);
      if (!plan) throw new Error('Plan not found');

      // Parse limits if it's a string, otherwise use as-is
      const limits = typeof plan.limits === 'string'
        ? JSON.parse(plan.limits || '{}')
        : (plan.limits || {});
      limit = limits[metric] !== undefined ? limits[metric] : null;
    }

    // If no limit (unlimited), allow immediately
    if (limit === null) {
      if (autoIncrement && subscription) {
        await incrementUsage(subscription.id, user.id, metric, incrementBy);
      }

      return {
        allowed: true,
        current: 0,
        limit: null,
        remaining: null,
      };
    }

    // Check current usage
    let current = 0;

    if (subscription) {
      const usage = await getCurrentUsage(subscription.id, metric);
      current = usage?.quantity || 0;

      // Check if would exceed limit
      const newTotal = current + (autoIncrement ? incrementBy : 0);

      if (newTotal > limit) {
        return {
          allowed: false,
          current,
          limit,
          remaining: Math.max(0, limit - current),
          upgradeUrl: '/pricing',
          message: `You've reached your ${metric} limit. Upgrade to continue.`,
        };
      }

      // Increment if requested
      if (autoIncrement) {
        await incrementUsage(subscription.id, user.id, metric, incrementBy);
        current = newTotal;
      }
    } else {
      // Free tier without subscription record
      // Would need to track usage differently or assume 0
      if (incrementBy > limit) {
        return {
          allowed: false,
          current: 0,
          limit,
          remaining: limit,
          upgradeUrl: '/pricing',
          message: `You've reached your ${metric} limit. Upgrade to continue.`,
        };
      }
    }

    return {
      allowed: true,
      current,
      limit,
      remaining: limit - current,
    };
  } catch (error) {
    logger.error({ error, metric }, 'Usage limit check failed');
    throw error;
  }
}

/**
 * Middleware to protect quote creation
 */
export async function checkQuoteLimit() {
  return checkUsageLimit('quotes', 1, true);
}

/**
 * Middleware to protect product creation
 */
export async function checkProductLimit() {
  return checkUsageLimit('products', 1, true);
}

/**
 * Middleware to protect email sending
 */
export async function checkEmailLimit() {
  return checkUsageLimit('emails', 1, true);
}

/**
 * Get plan tier from plan ID
 */
async function getPlanTier(planId: string): Promise<SubscriptionTier> {
  const { getPlanById } = await import('./db/subscription-queries');
  const plan = await getPlanById(planId);

  if (!plan) return 'free';

  const slug = plan.slug;

  if (slug === 'enterprise') return 'enterprise';
  if (slug === 'pro') return 'pro';
  return 'free';
}

/**
 * Get user's current subscription info
 */
export async function getUserSubscriptionInfo() {
  try {
    const user = await getUser();

    if (!user) {
      return {
        isAuthenticated: false,
        tier: 'free' as SubscriptionTier,
        features: [],
        limits: {},
      };
    }

    const subscription = await getUserSubscription(user.id);

    if (!subscription) {
      const freePlan = getPlanBySlug('free');

      return {
        isAuthenticated: true,
        userId: user.id,
        tier: 'free' as SubscriptionTier,
        subscription: null,
        features: freePlan
          ? (typeof freePlan.features === 'string' ? JSON.parse(freePlan.features || '[]') : (freePlan.features || []))
          : [],
        limits: freePlan
          ? (typeof freePlan.limits === 'string' ? JSON.parse(freePlan.limits || '{}') : (freePlan.limits || {}))
          : {},
      };
    }

    const plan = await getPlanBySlug(subscription.planId);

    if (!plan) {
      throw new Error('Plan not found for subscription');
    }

    return {
      isAuthenticated: true,
      userId: user.id,
      tier: await getPlanTier(subscription.planId),
      subscription,
      plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : (plan.features || []),
      limits: typeof plan.limits === 'string' ? JSON.parse(plan.limits || '{}') : (plan.limits || {}),
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get subscription info');
    throw error;
  }
}

/**
 * Check if user can access team features
 */
export async function canAccessTeamFeatures(): Promise<boolean> {
  return checkFeatureAccess('Team collaboration');
}

/**
 * Check if user can access API
 */
export async function canAccessAPI(): Promise<boolean> {
  return checkFeatureAccess('API access');
}

/**
 * Check if user has priority support
 */
export async function hasPrioritySupport(): Promise<boolean> {
  return checkFeatureAccess('Priority support');
}
