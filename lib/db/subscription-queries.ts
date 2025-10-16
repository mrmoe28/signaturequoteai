/**
 * Database Queries for Subscriptions
 *
 * All subscription-related database operations
 */

import { db } from './index';
import { subscriptionPlans, subscriptions, subscriptionInvoices, subscriptionUsage } from './schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import { createLogger } from '../logger';

const logger = createLogger('subscription-queries');

// ============================================================================
// SUBSCRIPTION PLANS
// ============================================================================

/**
 * Get all active subscription plans
 */
export async function getActivePlans() {
  try {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, 'true'))
      .orderBy(asc(subscriptionPlans.displayOrder));

    return plans;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch active plans');
    throw error;
  }
}

/**
 * Get plan by slug
 */
export async function getPlanBySlug(slug: string) {
  try {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.slug, slug))
      .limit(1);

    return plan || null;
  } catch (error) {
    logger.error({ error, slug }, 'Failed to fetch plan by slug');
    throw error;
  }
}

/**
 * Get plan by ID
 */
export async function getPlanById(id: string) {
  try {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id))
      .limit(1);

    return plan || null;
  } catch (error) {
    logger.error({ error, id }, 'Failed to fetch plan by ID');
    throw error;
  }
}

/**
 * Create or update a subscription plan
 */
export async function upsertPlan(planData: typeof subscriptionPlans.$inferInsert) {
  try {
    // Check if plan exists
    const existing = await getPlanBySlug(planData.slug);

    if (existing) {
      // Update existing plan
      const [updated] = await db
        .update(subscriptionPlans)
        .set({ ...planData, updatedAt: new Date() })
        .where(eq(subscriptionPlans.id, existing.id))
        .returning();

      logger.info({ planId: updated.id, slug: planData.slug }, 'Plan updated');
      return updated;
    } else {
      // Create new plan
      const [created] = await db
        .insert(subscriptionPlans)
        .values(planData)
        .returning();

      logger.info({ planId: created.id, slug: planData.slug }, 'Plan created');
      return created;
    }
  } catch (error) {
    logger.error({ error, planData }, 'Failed to upsert plan');
    throw error;
  }
}

// ============================================================================
// USER SUBSCRIPTIONS
// ============================================================================

/**
 * Get active subscription for a user
 */
export async function getUserSubscription(userId: string) {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return subscription || null;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch user subscription');
    throw error;
  }
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(id: string) {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id))
      .limit(1);

    return subscription || null;
  } catch (error) {
    logger.error({ error, id }, 'Failed to fetch subscription by ID');
    throw error;
  }
}

/**
 * Get subscription by Square ID
 */
export async function getSubscriptionBySquareId(squareSubscriptionId: string) {
  try {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.squareSubscriptionId, squareSubscriptionId))
      .limit(1);

    return subscription || null;
  } catch (error) {
    logger.error({ error, squareSubscriptionId }, 'Failed to fetch subscription by Square ID');
    throw error;
  }
}

/**
 * Create a new subscription
 */
export async function createSubscription(data: typeof subscriptions.$inferInsert) {
  try {
    const [subscription] = await db
      .insert(subscriptions)
      .values(data)
      .returning();

    logger.info({ subscriptionId: subscription.id, userId: data.userId }, 'Subscription created');
    return subscription;
  } catch (error) {
    logger.error({ error, data }, 'Failed to create subscription');
    throw error;
  }
}

/**
 * Update subscription
 */
export async function updateSubscription(id: string, data: Partial<typeof subscriptions.$inferInsert>) {
  try {
    const [updated] = await db
      .update(subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();

    logger.info({ subscriptionId: id }, 'Subscription updated');
    return updated;
  } catch (error) {
    logger.error({ error, id, data }, 'Failed to update subscription');
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  id: string,
  reason?: string,
  feedback?: string,
  cancelAt?: Date
) {
  try {
    const [canceled] = await db
      .update(subscriptions)
      .set({
        status: cancelAt ? 'active' : 'canceled', // Keep active if scheduled cancellation
        canceledAt: new Date(),
        cancelAt: cancelAt || null,
        cancelReason: reason || null,
        cancelFeedback: feedback || null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, id))
      .returning();

    logger.info(
      { subscriptionId: id, cancelAt: cancelAt || 'immediate' },
      'Subscription canceled'
    );
    return canceled;
  } catch (error) {
    logger.error({ error, id }, 'Failed to cancel subscription');
    throw error;
  }
}

// ============================================================================
// SUBSCRIPTION INVOICES
// ============================================================================

/**
 * Get invoices for a subscription
 */
export async function getSubscriptionInvoices(subscriptionId: string) {
  try {
    const invoices = await db
      .select()
      .from(subscriptionInvoices)
      .where(eq(subscriptionInvoices.subscriptionId, subscriptionId))
      .orderBy(desc(subscriptionInvoices.createdAt));

    return invoices;
  } catch (error) {
    logger.error({ error, subscriptionId }, 'Failed to fetch subscription invoices');
    throw error;
  }
}

/**
 * Get invoices for a user
 */
export async function getUserInvoices(userId: string) {
  try {
    const invoices = await db
      .select()
      .from(subscriptionInvoices)
      .where(eq(subscriptionInvoices.userId, userId))
      .orderBy(desc(subscriptionInvoices.createdAt));

    return invoices;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch user invoices');
    throw error;
  }
}

/**
 * Create an invoice
 */
export async function createInvoice(data: typeof subscriptionInvoices.$inferInsert) {
  try {
    const [invoice] = await db
      .insert(subscriptionInvoices)
      .values(data)
      .returning();

    logger.info({ invoiceId: invoice.id, userId: data.userId }, 'Invoice created');
    return invoice;
  } catch (error) {
    logger.error({ error, data }, 'Failed to create invoice');
    throw error;
  }
}

/**
 * Update invoice
 */
export async function updateInvoice(id: string, data: Partial<typeof subscriptionInvoices.$inferInsert>) {
  try {
    const [updated] = await db
      .update(subscriptionInvoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(subscriptionInvoices.id, id))
      .returning();

    logger.info({ invoiceId: id }, 'Invoice updated');
    return updated;
  } catch (error) {
    logger.error({ error, id, data }, 'Failed to update invoice');
    throw error;
  }
}

// ============================================================================
// SUBSCRIPTION USAGE
// ============================================================================

/**
 * Get current usage for a subscription
 */
export async function getCurrentUsage(subscriptionId: string, metric: string) {
  try {
    const now = new Date();

    const [usage] = await db
      .select()
      .from(subscriptionUsage)
      .where(
        and(
          eq(subscriptionUsage.subscriptionId, subscriptionId),
          eq(subscriptionUsage.metric, metric),
          lte(subscriptionUsage.periodStart, now),
          gte(subscriptionUsage.periodEnd, now)
        )
      )
      .limit(1);

    return usage || null;
  } catch (error) {
    logger.error({ error, subscriptionId, metric }, 'Failed to fetch current usage');
    throw error;
  }
}

/**
 * Increment usage for a metric
 */
export async function incrementUsage(
  subscriptionId: string,
  userId: string,
  metric: string,
  amount: number = 1
) {
  try {
    const now = new Date();
    const currentUsage = await getCurrentUsage(subscriptionId, metric);

    if (currentUsage) {
      // Update existing usage
      const [updated] = await db
        .update(subscriptionUsage)
        .set({
          quantity: currentUsage.quantity + amount,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionUsage.id, currentUsage.id))
        .returning();

      logger.info(
        { subscriptionId, metric, newQuantity: updated.quantity },
        'Usage incremented'
      );
      return updated;
    } else {
      // Create new usage record for current period
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const [created] = await db
        .insert(subscriptionUsage)
        .values({
          subscriptionId,
          userId,
          metric,
          quantity: amount,
          periodStart,
          periodEnd,
        })
        .returning();

      logger.info({ subscriptionId, metric, quantity: amount }, 'Usage tracking started');
      return created;
    }
  } catch (error) {
    logger.error({ error, subscriptionId, metric }, 'Failed to increment usage');
    throw error;
  }
}

/**
 * Check if user has exceeded limit for a metric
 */
export async function hasExceededLimit(
  subscriptionId: string,
  metric: string
): Promise<{ exceeded: boolean; current: number; limit: number | null }> {
  try {
    const usage = await getCurrentUsage(subscriptionId, metric);

    if (!usage) {
      return { exceeded: false, current: 0, limit: null };
    }

    if (usage.limit === null) {
      // Unlimited
      return { exceeded: false, current: usage.quantity, limit: null };
    }

    return {
      exceeded: usage.quantity >= usage.limit,
      current: usage.quantity,
      limit: usage.limit,
    };
  } catch (error) {
    logger.error({ error, subscriptionId, metric }, 'Failed to check usage limit');
    throw error;
  }
}
