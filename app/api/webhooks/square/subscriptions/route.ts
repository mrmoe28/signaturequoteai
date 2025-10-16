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
      case 'subscription.created':
      case 'subscription.updated':
        // Sync subscription from Square
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
