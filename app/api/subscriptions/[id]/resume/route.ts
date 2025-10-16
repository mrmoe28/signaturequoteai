/**
 * Resume Subscription API
 * POST /api/subscriptions/[id]/resume - Resume a paused subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSubscriptionById, updateSubscription } from '@/lib/db/subscription-queries';
import { resumeSquareSubscription } from '@/lib/square-subscriptions';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-resume-subscription');

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to resume subscription' },
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

    // Check if subscription can be resumed
    if (subscription.status !== 'paused') {
      return NextResponse.json(
        {
          error: 'Invalid status',
          message: 'Only paused subscriptions can be resumed',
        },
        { status: 400 }
      );
    }

    // Resume in Square if it has a Square subscription ID
    if (subscription.squareSubscriptionId) {
      await resumeSquareSubscription(subscription.squareSubscriptionId);
    }

    // Update in database
    const resumedSubscription = await updateSubscription(subscriptionId, {
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      subscription: resumedSubscription,
      message: 'Subscription resumed successfully',
    });
  } catch (error) {
    logger.error({ error, subscriptionId: params.id }, 'Failed to resume subscription');

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to resume subscription. Please try again.',
      },
      { status: 500 }
    );
  }
}
