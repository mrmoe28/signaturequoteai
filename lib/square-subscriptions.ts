/**
 * Square Subscriptions API Integration
 *
 * Handles subscription creation, management, and synchronization with Square
 */

import { createLogger } from './logger';
import {
  createSubscription,
  updateSubscription,
  cancelSubscription as dbCancelSubscription,
  createInvoice,
  updateInvoice,
  getPlanBySlug,
} from './db/subscription-queries';

const logger = createLogger('square-subscriptions');

// Dynamic Square SDK import
async function getSquareClient() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('SQUARE_ACCESS_TOKEN environment variable is required');
  }

  try {
    const { SquareClient, SquareEnvironment } = await import('square');

    const environment =
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox;

    logger.info({ environment: process.env.SQUARE_ENVIRONMENT || 'sandbox' }, 'Initializing Square client for subscriptions');

    return new SquareClient({
      token: accessToken,
      environment,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to initialize Square client');
    throw error;
  }
}

export interface CreateSubscriptionParams {
  userId: string;
  planSlug: string;
  customerEmail: string;
  customerName: string;
  paymentMethodId?: string; // Square card ID
  billingPeriod?: 'monthly' | 'yearly';
}

/**
 * Create a subscription in Square and sync to database
 */
export async function createSquareSubscription(params: CreateSubscriptionParams) {
  try {
    const {
      userId,
      planSlug,
      customerEmail,
      customerName,
      paymentMethodId,
      billingPeriod = 'monthly',
    } = params;

    logger.info({ userId, planSlug, billingPeriod }, 'Creating Square subscription');

    // Get plan from database
    const plan = await getPlanBySlug(planSlug);
    if (!plan) {
      throw new Error(`Plan not found: ${planSlug}`);
    }

    if (!plan.squareCatalogId) {
      throw new Error(`Plan ${planSlug} is not configured with Square catalog ID`);
    }

    const client = await getSquareClient();
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Create Square customer (simplified - always create new)
    let squareCustomerId: string;
    try {
      const createResponse = await client.customers.create({
        givenName: customerName.split(' ')[0],
        familyName: customerName.split(' ').slice(1).join(' ') || undefined,
        emailAddress: customerEmail,
        idempotencyKey: `customer-${userId}-${Date.now()}`,
      });

      squareCustomerId = createResponse.customer?.id!;
      logger.info({ squareCustomerId, email: customerEmail }, 'Created Square customer for subscription');
    } catch (error) {
      logger.error({ error }, 'Failed to create Square customer');
      throw error;
    }

    // Create subscription in Square
    const subscriptionResponse = await client.subscriptions.create({
      locationId,
      planVariationId: plan.squareVariationId || plan.squareCatalogId,
      customerId: squareCustomerId,
      startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
      cardId: paymentMethodId,
      timezone: 'America/Los_Angeles', // Adjust as needed
    });

    const squareSubscription = subscriptionResponse.subscription;

    if (!squareSubscription) {
      throw new Error('Square API did not return subscription data');
    }

    logger.info(
      {
        squareSubscriptionId: squareSubscription.id,
        status: squareSubscription.status,
      },
      'Square subscription created successfully'
    );

    // Save subscription to database
    const dbSubscription = await createSubscription({
      userId,
      planId: plan.id,
      squareSubscriptionId: squareSubscription.id,
      squareCustomerId,
      squareLocationId: locationId,
      status: mapSquareStatus(squareSubscription.status || 'ACTIVE'),
      currentPeriodStart: squareSubscription.startDate ? new Date(squareSubscription.startDate) : new Date(),
      currentPeriodEnd: squareSubscription.chargedThroughDate
        ? new Date(squareSubscription.chargedThroughDate)
        : null,
      price: plan.price.toString(),
      currency: plan.currency,
      billingPeriod,
    });

    logger.info(
      { subscriptionId: dbSubscription.id, squareSubscriptionId: squareSubscription.id },
      'Subscription saved to database'
    );

    return {
      subscription: dbSubscription,
      squareSubscription,
    };
  } catch (error: any) {
    logger.error({ error, params }, 'Failed to create Square subscription');

    // Handle Square API errors
    if (error?.errors) {
      const errorMessages = error.errors.map((e: any) => e.detail || e.code).join(', ');
      throw new Error(`Square API error: ${errorMessages}`);
    }

    throw error;
  }
}

/**
 * Cancel a subscription in Square and update database
 */
export async function cancelSquareSubscription(
  subscriptionId: string,
  reason?: string,
  feedback?: string
) {
  try {
    logger.info({ subscriptionId, reason }, 'Canceling Square subscription');

    // Get subscription from database
    const { getSubscriptionById } = await import('./db/subscription-queries');
    const subscription = await getSubscriptionById(subscriptionId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (!subscription.squareSubscriptionId) {
      throw new Error('Subscription has no Square ID');
    }

    // Cancel in Square
    const client = await getSquareClient();
    const cancelResponse = await client.subscriptions.cancel({
      subscriptionId: subscription.squareSubscriptionId,
    });

    logger.info(
      { squareSubscriptionId: subscription.squareSubscriptionId },
      'Square subscription canceled'
    );

    // Update database
    await dbCancelSubscription(subscriptionId, reason, feedback);

    return {
      success: true,
      subscription: cancelResponse.subscription,
    };
  } catch (error) {
    logger.error({ error, subscriptionId }, 'Failed to cancel Square subscription');
    throw error;
  }
}

/**
 * Pause a subscription in Square
 */
export async function pauseSquareSubscription(subscriptionId: string) {
  try {
    logger.info({ subscriptionId }, 'Pausing Square subscription');

    const { getSubscriptionById } = await import('./db/subscription-queries');
    const subscription = await getSubscriptionById(subscriptionId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (!subscription.squareSubscriptionId) {
      throw new Error('Subscription has no Square ID');
    }

    const client = await getSquareClient();
    const pauseResponse = await client.subscriptions.pause({
      subscriptionId: subscription.squareSubscriptionId,
      pauseCycleDuration: BigInt(1), // Pause for 1 billing cycle
    });

    // Update database
    await updateSubscription(subscriptionId, {
      status: 'paused',
    });

    logger.info({ subscriptionId }, 'Subscription paused');

    return pauseResponse.subscription;
  } catch (error) {
    logger.error({ error, subscriptionId }, 'Failed to pause subscription');
    throw error;
  }
}

/**
 * Resume a paused subscription
 */
export async function resumeSquareSubscription(subscriptionId: string) {
  try {
    logger.info({ subscriptionId }, 'Resuming Square subscription');

    const { getSubscriptionById } = await import('./db/subscription-queries');
    const subscription = await getSubscriptionById(subscriptionId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (!subscription.squareSubscriptionId) {
      throw new Error('Subscription has no Square ID');
    }

    const client = await getSquareClient();
    const resumeResponse = await client.subscriptions.resume({
      subscriptionId: subscription.squareSubscriptionId,
    });

    // Update database
    await updateSubscription(subscriptionId, {
      status: 'active',
    });

    logger.info({ subscriptionId }, 'Subscription resumed');

    return resumeResponse.subscription;
  } catch (error) {
    logger.error({ error, subscriptionId }, 'Failed to resume subscription');
    throw error;
  }
}

/**
 * Sync subscription from Square to database
 */
export async function syncSubscriptionFromSquare(squareSubscriptionId: string) {
  try {
    logger.info({ squareSubscriptionId }, 'Syncing subscription from Square');

    // TODO: Implement when Square SDK method is available
    // Currently returns early as Square subscription retrieval is not yet implemented
    logger.warn({ squareSubscriptionId }, 'Square subscription sync not yet implemented');
    return null;

    // The code below will be used when Square SDK integration is complete
    /*
    const client = await getSquareClient();
    const retrieveResponse = await client.subscriptions.retrieveSubscription({ subscriptionId: squareSubscriptionId });
    const squareSubscription = retrieveResponse.subscription;

    if (!squareSubscription) {
      logger.warn({ squareSubscriptionId }, 'Square subscription not found');
      return null;
    }

    // Get subscription from database
    const { getSubscriptionBySquareId } = await import('./db/subscription-queries');
    const dbSubscription = await getSubscriptionBySquareId(squareSubscriptionId);

    if (!dbSubscription) {
      logger.warn({ squareSubscriptionId }, 'Subscription not found in database');
      return null;
    }

    // Update database with Square data
    await updateSubscription(dbSubscription.id, {
      status: mapSquareStatus(squareSubscription.status || 'ACTIVE'),
      currentPeriodStart: squareSubscription.startDate ? new Date(squareSubscription.startDate) : undefined,
      currentPeriodEnd: squareSubscription.chargedThroughDate
        ? new Date(squareSubscription.chargedThroughDate)
        : undefined,
      canceledAt: squareSubscription.canceledDate ? new Date(squareSubscription.canceledDate) : undefined,
    });

    logger.info({ subscriptionId: dbSubscription.id }, 'Subscription synced successfully');

    return dbSubscription;
    */
  } catch (error) {
    logger.error({ error, squareSubscriptionId }, 'Failed to sync subscription');
    throw error;
  }
}

/**
 * Map Square subscription status to our internal status
 */
function mapSquareStatus(squareStatus: string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: 'active',
    CANCELED: 'canceled',
    PAUSED: 'paused',
    PENDING: 'pending',
    DEACTIVATED: 'canceled',
  };

  return statusMap[squareStatus] || 'active';
}

/**
 * Handle subscription invoice paid event (from webhook)
 */
export async function handleSubscriptionInvoicePaid(invoiceData: any) {
  try {
    logger.info({ invoiceId: invoiceData.id }, 'Processing subscription invoice paid event');

    const subscriptionId = invoiceData.subscription_id;

    if (!subscriptionId) {
      logger.warn({ invoiceData }, 'Invoice has no subscription ID');
      return;
    }

    // Get subscription
    const { getSubscriptionBySquareId } = await import('./db/subscription-queries');
    const subscription = await getSubscriptionBySquareId(subscriptionId);

    if (!subscription) {
      logger.warn({ subscriptionId }, 'Subscription not found for invoice');
      return;
    }

    // Create invoice record
    const amountInDollars = ((invoiceData.amount_money?.amount || 0) / 100).toFixed(2);
    await createInvoice({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      squareInvoiceId: invoiceData.id,
      squareOrderId: invoiceData.order_id,
      squarePaymentId: invoiceData.payment_id,
      amount: amountInDollars, // Convert cents to dollars and format as string
      currency: invoiceData.amount_money?.currency || 'USD',
      total: amountInDollars,
      status: 'paid',
      paidAt: new Date(),
    });

    logger.info({ invoiceId: invoiceData.id, subscriptionId: subscription.id }, 'Invoice recorded');
  } catch (error) {
    logger.error({ error, invoiceData }, 'Failed to handle invoice paid event');
    throw error;
  }
}

/**
 * Check if Square subscriptions are configured
 */
export function isSquareSubscriptionsConfigured(): boolean {
  return !!(
    process.env.SQUARE_ACCESS_TOKEN &&
    process.env.SQUARE_LOCATION_ID &&
    process.env.SQUARE_ACCESS_TOKEN !== 'your_square_access_token'
  );
}
