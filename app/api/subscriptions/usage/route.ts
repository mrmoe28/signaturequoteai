/**
 * Subscription Usage API
 * GET /api/subscriptions/usage - Get current user's usage statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getUserSubscription, getCurrentUsage } from '@/lib/db/subscription-queries';
import { getPlanLimit } from '@/lib/subscription-plans';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-subscription-usage');

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to view usage' },
        { status: 401 }
      );
    }

    // Get user's subscription
    const subscription = await getUserSubscription(user.id);

    // Determine plan limits
    let quotesLimit: number | null;
    let productsLimit: number | null;
    let storageLimit: string;

    if (!subscription) {
      // Free plan limits
      quotesLimit = getPlanLimit('free', 'quotes');
      productsLimit = getPlanLimit('free', 'products');
      storageLimit = '100MB';
    } else {
      // Get limits from subscription plan
      const { getPlanById } = await import('@/lib/db/subscription-queries');
      const plan = await getPlanById(subscription.planId);

      if (plan) {
        const limits = JSON.parse(plan.limits || '{}');
        quotesLimit = limits.quotes !== undefined ? limits.quotes : null;
        productsLimit = limits.products !== undefined ? limits.products : null;
        storageLimit = limits.storage || '100MB';
      } else {
        quotesLimit = null;
        productsLimit = null;
        storageLimit = 'Unlimited';
      }
    }

    // Get current usage
    let quotesUsage = 0;
    let productsUsage = 0;

    if (subscription) {
      const quotesData = await getCurrentUsage(subscription.id, 'quotes');
      const productsData = await getCurrentUsage(subscription.id, 'products');

      quotesUsage = quotesData?.quantity || 0;
      productsUsage = productsData?.quantity || 0;
    }

    // Get storage usage (simplified - you may need to calculate actual storage)
    const storageUsage = '25MB';

    return NextResponse.json({
      success: true,
      usage: {
        quotes: {
          current: quotesUsage,
          limit: quotesLimit,
        },
        products: {
          current: productsUsage,
          limit: productsLimit,
        },
        storage: {
          current: storageUsage,
          limit: storageLimit,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch usage');

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch usage statistics',
      },
      { status: 500 }
    );
  }
}
