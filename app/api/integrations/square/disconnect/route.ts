/**
 * Square Account Disconnect Handler
 *
 * This endpoint disconnects a user's Square account by removing stored credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '@/lib/logger';
import { stackServerApp } from '@/stack/server';

const logger = createLogger('square-disconnect');

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove Square credentials from database
    await db
      .update(users)
      .set({
        squareMerchantId: null,
        squareAccessToken: null,
        squareRefreshToken: null,
        squareTokenExpiresAt: null,
        squareLocationId: null,
        squareEnvironment: 'sandbox',
        squareConnectedAt: null,
        squareScopes: null,
      })
      .where(eq(users.id, user.id));

    logger.info({ userId: user.id }, 'Square account disconnected');

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error({ error }, 'Error disconnecting Square account');
    return NextResponse.json(
      { error: 'Failed to disconnect Square account' },
      { status: 500 }
    );
  }
}
