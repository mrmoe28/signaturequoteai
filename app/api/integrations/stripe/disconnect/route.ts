/**
 * Stripe Disconnect Endpoint
 *
 * Removes Stripe credentials from the user's account
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('stripe-disconnect');

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear Stripe credentials from database
    await db
      .update(users)
      .set({
        stripeAccountId: null,
        stripeAccessToken: null,
        stripeRefreshToken: null,
        stripeTokenExpiresAt: null,
        stripeConnectedAt: null,
        stripeScopes: null,
      })
      .where(eq(users.id, user.id));

    logger.info({ userId: user.id }, 'Stripe account disconnected successfully');

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error({ error }, 'Error disconnecting Stripe account');
    return NextResponse.json(
      { error: 'Failed to disconnect Stripe account' },
      { status: 500 }
    );
  }
}
