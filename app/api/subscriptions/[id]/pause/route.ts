/**
 * Pause Subscription API
 * POST /api/subscriptions/[id]/pause - Pause a subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSubscriptionById, updateSubscription } from '@/lib/db/subscription-queries';
import { pauseSquareSubscription } from '@/lib/square-subscriptions';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-pause-subscription');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to pause subscription' },
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

    // Check if subscription can be paused
    if (subscription.status !== 'active') {
      return NextResponse.json(
        {
          error: 'Invalid status',
          message: 'Only active subscriptions can be paused',
        },
        { status: 400 }
      );
    }

    // Pause in Square if it has a Square subscription ID
    if (subscription.squareSubscriptionId) {
      await pauseSquareSubscription(subscription.squareSubscriptionId);
    }

    // Update in database
    const pausedSubscription = await updateSubscription(subscriptionId, {
      status: 'paused',
    });

    return NextResponse.json({
      success: true,
      subscription: pausedSubscription,
      message: 'Subscription paused successfully',
    });
  } catch (error) {
    logger.error({ error, subscriptionId: params.id }, 'Failed to pause subscription');

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to pause subscription. Please try again.',
      },
      { status: 500 }
    );
  }
}
