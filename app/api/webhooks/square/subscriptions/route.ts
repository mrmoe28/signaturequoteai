/**
 * Square Subscription Webhooks
 * POST /api/webhooks/square/subscriptions - Handle Square subscription events
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import {
  syncSubscriptionFromSquare,
  handleSubscriptionInvoicePaid,
} from '@/lib/square-subscriptions';
import { updateSubscription } from '@/lib/db/subscription-queries';
import { createLogger } from '@/lib/logger';

const logger = createLogger('webhook-square-subscriptions');

// Verify Square webhook signature
function verifySquareSignature(
  body: string,
  signature: string,
  webhookSignatureKey: string
): boolean {
  // Square webhook signature verification
  // Implementation depends on Square's webhook signature algorithm
  // For now, we'll validate the signature key exists
  return !!webhookSignatureKey && !!signature;
}

export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const signature = headersList.get('x-square-signature') || '';
    const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '';

    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    if (!verifySquareSignature(body, signature, webhookSignatureKey)) {
      logger.warn('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    const event = JSON.parse(body);
    const eventType = event.type;
    const eventData = event.data?.object;

    logger.info({ eventType, eventId: event.event_id }, 'Received Square webhook');

    // Handle different subscription events
    switch (eventType) {
      case 'payment.created':
      case 'payment.updated':
        // Handle checkout payment completion
        if (eventData?.status === 'COMPLETED' && eventData?.order_id) {
          logger.info({ orderId: eventData.order_id }, 'Payment completed, checking for subscription');

          // Square will send separate subscription.created event
          // This is just for logging
        }
        break;

      case 'subscription.created':
        // Create subscription in our database
        if (eventData?.id && eventData?.customer_id) {
          logger.info(
            { subscriptionId: eventData.id, customerId: eventData.customer_id },
            'Processing subscription.created webhook'
          );

          try {
            // Import needed functions
            const { createSubscription } = await import('@/lib/db/subscription-queries');
            const { db } = await import('@/lib/db');
            const { subscriptionPlans } = await import('@/lib/db/schema');
            const { eq } = await import('drizzle-orm');

            // Get the plan variation ID from subscription data
            const planVariationId = eventData.plan_variation_id;

            if (!planVariationId) {
              logger.warn({ eventData }, 'No plan variation ID in subscription');
              break;
            }

            // Find the plan by Square Variation ID
            const planResult = await db
              .select()
              .from(subscriptionPlans)
              .where(eq(subscriptionPlans.squareVariationId, planVariationId))
              .limit(1);

            if (planResult.length === 0) {
              logger.warn(
                { variationId: planVariationId },
                'Plan not found for Square subscription'
              );
              break;
            }

            const plan = planResult[0];

            // Get the source (order) to find user ID from metadata
            const sourceId = eventData.source?.order_id;

            if (!sourceId) {
              logger.warn({ eventData }, 'No source order ID in subscription');
              break;
            }

            // Retrieve the order to get metadata
            const { SquareClient, SquareEnvironment } = await import('square');
            const client = new SquareClient({
              token: process.env.SQUARE_ACCESS_TOKEN!,
              environment:
                process.env.SQUARE_ENVIRONMENT === 'production'
                  ? SquareEnvironment.Production
                  : SquareEnvironment.Sandbox,
            });

            const orderResponse = await client.orders.get(sourceId);
            const order = orderResponse.order;
            const userId = order?.referenceId || order?.metadata?.userId;

            if (!userId) {
              logger.error({ orderId: sourceId }, 'No user ID found in order metadata');
              break;
            }

            // Create subscription in database
            const subscription = await createSubscription({
              userId,
              planId: plan.id,
              squareSubscriptionId: eventData.id,
              squareCustomerId: eventData.customer_id,
              squareLocationId: process.env.SQUARE_LOCATION_ID!,
              status: 'active',
              currentPeriodStart: eventData.start_date ? new Date(eventData.start_date) : new Date(),
              currentPeriodEnd: eventData.charged_through_date
                ? new Date(eventData.charged_through_date)
                : null,
              price: plan.price.toString(),
              currency: plan.currency,
              billingPeriod: 'monthly',
            });

            logger.info(
              { subscriptionId: subscription.id, userId, plan: plan.name },
              'Subscription created successfully'
            );
          } catch (error) {
            logger.error({ error, eventData }, 'Failed to create subscription from webhook');
          }
        }
        break;

      case 'subscription.updated':
        // Sync subscription updates from Square
        if (eventData?.id) {
          await syncSubscriptionFromSquare(eventData.id);
        }
        break;

      case 'subscription.canceled':
        // Mark subscription as canceled
        // TODO: Implement when syncSubscriptionFromSquare is fully implemented
        if (eventData?.id) {
          logger.info({ subscriptionId: eventData.id }, 'Subscription canceled webhook received');
          // const subscription = await syncSubscriptionFromSquare(eventData.id);
          // if (subscription) {
          //   await updateSubscription(subscription.id, {
          //     status: 'canceled',
          //     canceledAt: new Date(),
          //   });
          // }
        }
        break;

      case 'invoice.paid':
      case 'invoice.payment_made':
        // Handle successful payment
        if (eventData) {
          await handleSubscriptionInvoicePaid(eventData);
        }
        break;

      case 'invoice.payment_failed':
        // Handle failed payment
        logger.warn({ eventData }, 'Subscription payment failed');
        // You might want to notify the user or retry payment
        break;

      case 'subscription.paused':
        // Mark subscription as paused
        // TODO: Implement when syncSubscriptionFromSquare is fully implemented
        if (eventData?.id) {
          logger.info({ subscriptionId: eventData.id }, 'Subscription paused webhook received');
          // const subscription = await syncSubscriptionFromSquare(eventData.id);
          // if (subscription) {
          //   await updateSubscription(subscription.id, {
          //     status: 'paused',
          //   });
          // }
        }
        break;

      case 'subscription.resumed':
        // Mark subscription as active
        // TODO: Implement when syncSubscriptionFromSquare is fully implemented
        if (eventData?.id) {
          logger.info({ subscriptionId: eventData.id }, 'Subscription resumed webhook received');
          // const subscription = await syncSubscriptionFromSquare(eventData.id);
          // if (subscription) {
          //   await updateSubscription(subscription.id, {
          //     status: 'active',
          //   });
          // }
        }
        break;

      default:
        logger.info({ eventType }, 'Unhandled webhook event type');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Webhook processing failed');

    // Return 200 to prevent Square from retrying
    // But log the error for investigation
    return NextResponse.json(
      { success: false, error: 'Internal error' },
      { status: 200 }
    );
  }
}
