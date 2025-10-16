/**
 * Square Token Refresh Handler
 *
 * This endpoint refreshes an expired Square access token using the refresh token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '@/lib/logger';
import { getUser } from '@/lib/auth';

const logger = createLogger('square-refresh');

export async function POST(request: NextRequest) {
  try {
    // Get current user from session
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Square credentials
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userRecord?.squareRefreshToken) {
      return NextResponse.json(
        { error: 'Square account not connected' },
        { status: 400 }
      );
    }

    // Refresh the access token
    const squareEnvironment = userRecord.squareEnvironment || 'sandbox';
    const tokenUrl = `https://${squareEnvironment === 'production' ? 'connect' : 'connect.squareupsandbox'}.squareup.com/oauth2/token`;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2024-12-18',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
        client_secret: process.env.SQUARE_CLIENT_SECRET,
        refresh_token: userRecord.squareRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      logger.error({ error: errorData }, 'Failed to refresh Square token');
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_at,
    } = tokenData;

    // Update stored credentials
    await db
      .update(users)
      .set({
        squareAccessToken: access_token, // TODO: Encrypt this in production
        squareRefreshToken: refresh_token || userRecord.squareRefreshToken,
        squareTokenExpiresAt: new Date(expires_at),
      })
      .where(eq(users.id, user.id));

    logger.info({ userId: user.id }, 'Square token refreshed successfully');

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error({ error }, 'Error refreshing Square token');
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
