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
import { stackServerApp } from '@/stack/server';
import { createLogger } from '@/lib/logger';

const logger = createLogger('square-connect');

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await stackServerApp.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { accessToken, locationId } = await request.json();

    if (!accessToken || !locationId) {
      return NextResponse.json(
        { error: 'Access token and location ID are required' },
        { status: 400 }
      );
    }

    // Determine environment based on access token prefix
    // Production tokens start with 'EAAA', sandbox tokens start with 'EAAAl' or other prefixes
    const environment = accessToken.startsWith('EAAAl') ? 'sandbox' :
                       accessToken.startsWith('EAAA') ? 'production' : 'sandbox';

    // Store Square credentials in database
    await db
      .update(users)
      .set({
        squareAccessToken: accessToken,
        squareLocationId: locationId,
        squareEnvironment: environment,
        squareConnectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

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
    logger.error({ error }, 'Error connecting Square account');
    return NextResponse.json(
      { error: 'Failed to connect Square account' },
      { status: 500 }
    );
  }
}
