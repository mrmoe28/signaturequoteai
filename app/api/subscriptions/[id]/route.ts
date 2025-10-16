/**
 * Subscription Details API
 * GET /api/subscriptions/[id] - Get subscription details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getSubscriptionById } from '@/lib/db/subscription-queries';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-subscription-details');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to view subscription' },
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

    return NextResponse.json({
      success: true,
      subscription,
    });
  } catch (error) {
    logger.error({ error, subscriptionId: params.id }, 'Failed to fetch subscription');

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch subscription details',
      },
      { status: 500 }
    );
  }
}
