/**
 * Stripe Status Endpoint
 *
 * Returns the Stripe connection status for a specific user
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('stripe-status');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const currentUser = await getUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user can only access their own data
    if (currentUser.id !== params.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get user's Stripe connection status from database
    const result = await db
      .select({
        stripeAccountId: users.stripeAccountId,
        stripeConnectedAt: users.stripeConnectedAt,
      })
      .from(users)
      .where(eq(users.id, params.id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = result[0];

    return NextResponse.json({
      stripeConnected: !!userData.stripeAccountId,
      stripeAccountId: userData.stripeAccountId,
      stripeConnectedAt: userData.stripeConnectedAt?.toISOString() || null,
    });

  } catch (error) {
    logger.error({ error, userId: params.id }, 'Error fetching Stripe status');
    return NextResponse.json(
      { error: 'Failed to fetch Stripe status' },
      { status: 500 }
    );
  }
}
