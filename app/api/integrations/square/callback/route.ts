/**
 * Square OAuth Callback Handler
 *
 * This endpoint handles the OAuth callback from Square after user authorization.
 * It exchanges the authorization code for access and refresh tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '@/lib/logger';

const logger = createLogger('square-oauth');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the userId
    const error = searchParams.get('error');

    if (error) {
      logger.error({ error }, 'Square OAuth error');
      return NextResponse.redirect(
        new URL(`/settings?error=square_auth_failed&message=${error}`, request.url)
      );
    }

    if (!code || !state) {
      logger.error('Missing code or state in Square OAuth callback');
      return NextResponse.redirect(
        new URL('/settings?error=invalid_callback', request.url)
      );
    }

    const userId = state;

    // Exchange authorization code for access token
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';
    const tokenUrl = `https://${squareEnvironment === 'production' ? 'connect' : 'connect.squareupsandbox'}.squareup.com/oauth2/token`;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2024-12-18', // Use latest Square API version
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID,
        client_secret: process.env.SQUARE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      logger.error({ error: errorData }, 'Failed to exchange Square authorization code');
      return NextResponse.redirect(
        new URL('/settings?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_at,
      merchant_id,
      scope,
    } = tokenData;

    // Get merchant's locations to set default location
    const locationsResponse = await fetch(
      `https://${squareEnvironment === 'production' ? 'connect' : 'connect.squareupsandbox'}.squareup.com/v2/locations`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Square-Version': '2024-12-18',
        },
      }
    );

    let defaultLocationId = null;
    if (locationsResponse.ok) {
      const locationsData = await locationsResponse.json();
      const mainLocation = locationsData.locations?.find((loc: any) => loc.status === 'ACTIVE');
      defaultLocationId = mainLocation?.id || locationsData.locations?.[0]?.id;
    }

    // Store Square credentials in database
    await db
      .update(users)
      .set({
        squareMerchantId: merchant_id,
        squareAccessToken: access_token, // TODO: Encrypt this in production
        squareRefreshToken: refresh_token, // TODO: Encrypt this in production
        squareTokenExpiresAt: new Date(expires_at),
        squareLocationId: defaultLocationId,
        squareEnvironment,
        squareConnectedAt: new Date(),
        squareScopes: JSON.stringify(scope ? scope.split(' ') : []),
      })
      .where(eq(users.id, userId));

    logger.info(
      { userId, merchantId: merchant_id },
      'Square account connected successfully'
    );

    return NextResponse.redirect(
      new URL('/settings?success=square_connected', request.url)
    );

  } catch (error) {
    logger.error({ error }, 'Error in Square OAuth callback');
    return NextResponse.redirect(
      new URL('/settings?error=unknown_error', request.url)
    );
  }
}
