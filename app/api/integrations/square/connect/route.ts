/**
 * Square Manual Connection Handler
 *
 * This endpoint accepts Square Access Token and Location ID manually entered by users
 * No OAuth flow needed - simpler and more reliable
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth';
import { createLogger } from '@/lib/logger';

const logger = createLogger('square-connect');

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUser();

    if (!user) {
      logger.warn('Connect attempt with no authenticated user');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    logger.info({ userId: user.id }, 'Starting Square connect for user');

    const { accessToken, locationId } = await request.json();

    if (!accessToken || !locationId) {
      return NextResponse.json(
        { error: 'Access token and location ID are required' },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!existingUser || existingUser.length === 0) {
      logger.error({ userId: user.id }, 'User not found in database');
      return NextResponse.json(
        { error: 'User account not found in database. Please try logging out and back in.' },
        { status: 404 }
      );
    }

    // Use SQUARE_ENVIRONMENT from environment variables
    // This is set in Vercel dashboard and should match the credentials being used
    const environment = process.env.SQUARE_ENVIRONMENT || 'production';

    logger.info({ userId: user.id, environment }, 'Updating user with Square credentials');

    // Store Square credentials in database
    const result = await db
      .update(users)
      .set({
        squareAccessToken: accessToken,
        squareLocationId: locationId,
        squareEnvironment: environment,
        squareConnectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ id: users.id });

    if (!result || result.length === 0) {
      logger.error({ userId: user.id }, 'Database update failed - no rows affected');
      return NextResponse.json(
        { error: 'Failed to save Square credentials. Please try again.' },
        { status: 500 }
      );
    }

    logger.info(
      { userId: user.id, locationId, environment },
      'Square account connected successfully via manual setup'
    );

    return NextResponse.json({
      success: true,
      message: 'Square account connected successfully',
      environment,
      locationId,
    });

  } catch (error) {
    logger.error({ error, errorMessage: error instanceof Error ? error.message : String(error) }, 'Error connecting Square account');
    return NextResponse.json(
      { error: 'Failed to connect Square account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
