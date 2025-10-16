/**
 * Current User Subscription API
 * GET /api/subscriptions/me - Get current user's subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getUserSubscriptionInfo } from '@/lib/subscription-middleware';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-subscription-me');

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to view subscription' },
        { status: 401 }
      );
    }

    // Get user's subscription info
    const subscriptionInfo = await getUserSubscriptionInfo();

    return NextResponse.json({
      success: true,
      ...subscriptionInfo,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch user subscription info');

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch subscription information',
      },
      { status: 500 }
    );
  }
}
