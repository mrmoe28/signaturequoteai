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
import { getUser } from '@/lib/auth';

const logger = createLogger('square-disconnect');

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    const user = await getUser();

    if (!user) {
      logger.warn('Disconnect attempt with no authenticated user');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    logger.info({ userId: user.id }, 'Starting Square disconnect for user');

    // Check if user exists in database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      logger.error({ userId: user.id }, 'User not found in database');
      return NextResponse.json(
        { error: 'User account not found in database' },
        { status: 404 }
      );
    }

    // Remove Square credentials from database
    const result = await db
      .update(users)
      .set({
        squareMerchantId: null,
        squareAccessToken: null,
        squareRefreshToken: null,
        squareTokenExpiresAt: null,
        squareLocationId: null,
        squareEnvironment: null,
        squareConnectedAt: null,
        squareScopes: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ id: users.id });

    if (!result || result.length === 0) {
      logger.error({ userId: user.id }, 'Database update failed - no rows affected');
      return NextResponse.json(
        { error: 'Failed to update user record' },
        { status: 500 }
      );
    }

    logger.info({ userId: user.id }, 'Square account disconnected successfully');

    return NextResponse.json({
      success: true,
      message: 'Square account disconnected successfully'
    });

  } catch (error) {
    logger.error({ error, errorMessage: error instanceof Error ? error.message : String(error) }, 'Error disconnecting Square account');
    return NextResponse.json(
      { error: 'Failed to disconnect Square account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
