/**
 * Cancel Subscription API
 * POST /api/subscriptions/[id]/cancel - Cancel a subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth';
import { getSubscriptionById, cancelSubscription } from '@/lib/db/subscription-queries';
import { cancelSquareSubscription } from '@/lib/square-subscriptions';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-cancel-subscription');

const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  feedback: z.string().optional(),
  cancelImmediately: z.boolean().default(false),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to cancel subscription' },
        { status: 401 }
      );
    }

    const subscriptionId = params.id;

    // Get subscription
    const subscription = await getSubscriptionById(subscriptionId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'Not found', message: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Verify subscription belongs to user
    if (subscription.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have access to this subscription' },
        { status: 403 }
      );
    }

    // Check if already canceled
    if (subscription.status === 'canceled') {
      return NextResponse.json(
        { error: 'Already canceled', message: 'This subscription is already canceled' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reason, feedback, cancelImmediately } = cancelSubscriptionSchema.parse(body);

    // Cancel in Square if it has a Square subscription ID
    if (subscription.squareSubscriptionId) {
      await cancelSquareSubscription(
        subscription.squareSubscriptionId,
        reason,
        feedback
      );
    }

    // Update in database
    const canceledSubscription = await cancelSubscription(
      subscriptionId,
      reason,
      feedback
    );

    return NextResponse.json({
      success: true,
      subscription: canceledSubscription,
      message: 'Subscription canceled successfully. You will retain access until the end of your billing period.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error({ error, subscriptionId: params.id }, 'Failed to cancel subscription');

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to cancel subscription. Please try again.',
      },
      { status: 500 }
    );
  }
}
