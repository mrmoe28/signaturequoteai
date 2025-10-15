/**
 * Stripe OAuth Callback Handler
 *
 * This endpoint handles the OAuth callback from Stripe after user authorization.
 * It exchanges the authorization code for access and refresh tokens.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '@/lib/logger';

const logger = createLogger('stripe-oauth');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the userId
    const error = searchParams.get('error');

    if (error) {
      logger.error({ error }, 'Stripe OAuth error');
      return NextResponse.redirect(
        new URL(`/settings?error=stripe_auth_failed&message=${error}`, request.url)
      );
    }

    if (!code || !state) {
      logger.error('Missing code or state in Stripe OAuth callback');
      return NextResponse.redirect(
        new URL('/settings?error=invalid_callback', request.url)
      );
    }

    const userId = state;

    // Exchange authorization code for access token
    const tokenUrl = 'https://connect.stripe.com/oauth/token';

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_secret: process.env.STRIPE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      logger.error({ error: errorData }, 'Failed to exchange Stripe authorization code');
      return NextResponse.redirect(
        new URL('/settings?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      stripe_user_id,
      scope,
    } = tokenData;

    // Store Stripe credentials in database (upsert: insert if not exists, update if exists)
    await db
      .insert(users)
      .values({
        id: userId,
        email: `user-${userId.substring(0, 8)}@stack-auth.temp`, // Temporary email, will be synced from Stack Auth
        stripeAccountId: stripe_user_id,
        stripeAccessToken: access_token, // TODO: Encrypt this in production
        stripeRefreshToken: refresh_token, // TODO: Encrypt this in production
        stripeConnectedAt: new Date(),
        stripeScopes: JSON.stringify(scope ? scope.split(' ') : []),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          stripeAccountId: stripe_user_id,
          stripeAccessToken: access_token,
          stripeRefreshToken: refresh_token,
          stripeConnectedAt: new Date(),
          stripeScopes: JSON.stringify(scope ? scope.split(' ') : []),
        },
      });

    logger.info(
      { userId, accountId: stripe_user_id },
      'Stripe account connected successfully'
    );

    return NextResponse.redirect(
      new URL('/settings?success=stripe_connected', request.url)
    );

  } catch (error) {
    logger.error({ error }, 'Error in Stripe OAuth callback');
    return NextResponse.redirect(
      new URL('/settings?error=unknown_error', request.url)
    );
  }
}
