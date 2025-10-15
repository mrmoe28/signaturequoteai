/**
 * Square User-Specific Client
 *
 * This module provides functions to create payment links using a user's own Square account.
 * It automatically handles token refresh when needed.
 */

import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from './logger';

const logger = createLogger('square-user-client');

export interface UserSquareCredentials {
  accessToken: string;
  merchantId: string;
  locationId: string;
  environment: string;
}

/**
 * Gets a user's Square credentials from the database
 * Automatically refreshes the token if it's expired
 */
export async function getUserSquareCredentials(userId: string): Promise<UserSquareCredentials | null> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.squareAccessToken || !user.squareMerchantId) {
      logger.warn({ userId }, 'User has no Square credentials');
      return null;
    }

    // Check if token is expired or about to expire (within 1 hour)
    const now = new Date();
    const expiresAt = user.squareTokenExpiresAt;
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    if (expiresAt && expiresAt < oneHourFromNow) {
      logger.info({ userId }, 'Square token expired or expiring soon, refreshing...');

      if (!user.squareRefreshToken) {
        logger.error({ userId }, 'Cannot refresh token - no refresh token available');
        return null;
      }

      // Refresh the token
      const refreshed = await refreshSquareToken(userId, user.squareRefreshToken, user.squareEnvironment || 'sandbox');
      if (!refreshed) {
        logger.error({ userId }, 'Failed to refresh Square token');
        return null;
      }

      // Get updated credentials
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!updatedUser || !updatedUser.squareAccessToken) {
        return null;
      }

      return {
        accessToken: updatedUser.squareAccessToken,
        merchantId: updatedUser.squareMerchantId!,
        locationId: updatedUser.squareLocationId || '',
        environment: updatedUser.squareEnvironment || 'sandbox',
      };
    }

    return {
      accessToken: user.squareAccessToken,
      merchantId: user.squareMerchantId,
      locationId: user.squareLocationId || '',
      environment: user.squareEnvironment || 'sandbox',
    };

  } catch (error) {
    logger.error({ error, userId }, 'Error getting user Square credentials');
    return null;
  }
}

/**
 * Refreshes a user's Square access token
 */
async function refreshSquareToken(
  userId: string,
  refreshToken: string,
  environment: string
): Promise<boolean> {
  try {
    const tokenUrl = `https://${environment.trim().toLowerCase() === 'production' ? 'connect' : 'connect.squareupsandbox'}.squareup.com/oauth2/token`;

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Square-Version': '2024-12-18',
      },
      body: JSON.stringify({
        client_id: process.env.SQUARE_APPLICATION_ID,
        client_secret: process.env.SQUARE_ACCESS_TOKEN,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      logger.error({ error: errorData }, 'Failed to refresh Square token');
      return false;
    }

    const tokenData = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_at,
    } = tokenData;

    // Update database with new tokens
    await db
      .update(users)
      .set({
        squareAccessToken: access_token,
        squareRefreshToken: refresh_token || refreshToken,
        squareTokenExpiresAt: new Date(expires_at),
      })
      .where(eq(users.id, userId));

    logger.info({ userId }, 'Square token refreshed successfully');
    return true;

  } catch (error) {
    logger.error({ error, userId }, 'Error refreshing Square token');
    return false;
  }
}

/**
 * Creates a Square payment link using the user's credentials
 */
export async function createUserSquarePaymentLink(
  userId: string,
  data: {
    quoteId: string;
    quoteNumber?: string;
    customerName: string;
    customerEmail: string;
    amount: number;
    description?: string;
    redirectUrl?: string;
  }
): Promise<string | null> {
  try {
    const credentials = await getUserSquareCredentials(userId);

    if (!credentials) {
      logger.warn({ userId }, 'Cannot create payment link - user Square not connected');
      return null;
    }

    // Dynamic import of Square SDK
    const { SquareClient, SquareEnvironment } = await import('square');

    const environment = credentials.environment.trim().toLowerCase() === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

    const client = new SquareClient({
      token: credentials.accessToken,
      environment,
    });

    // Convert dollars to cents
    const amountInCents = Math.round(data.amount * 100);

    logger.info(
      {
        userId,
        quoteId: data.quoteId,
        amount: data.amount,
        amountInCents
      },
      'Creating user Square payment link'
    );

    // Create payment link
    // @ts-ignore - Square SDK types may not be fully accurate
    const response = await client.checkoutApi.createPaymentLink({
      idempotencyKey: `quote-${data.quoteId}-${Date.now()}`,
      order: {
        locationId: credentials.locationId,
        lineItems: [
          {
            name: data.description || `Quote ${data.quoteNumber || data.quoteId}`,
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(amountInCents),
              currency: 'USD',
            },
            note: `Customer: ${data.customerName} (${data.customerEmail})`,
          },
        ],
        referenceId: data.quoteNumber || data.quoteId,
      },
      checkoutOptions: {
        redirectUrl: data.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${data.quoteId}/payment-success`,
        askForShippingAddress: false,
        merchantSupportEmail: process.env.SUPPORT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL,
      },
      prePopulatedData: {
        buyerEmail: data.customerEmail,
      },
    });

    if (!response.result.paymentLink?.url) {
      throw new Error('Square API did not return a payment link URL');
    }

    logger.info(
      {
        userId,
        quoteId: data.quoteId,
        paymentLinkId: response.result.paymentLink.id
      },
      'User Square payment link created successfully'
    );

    return response.result.paymentLink.url;

  } catch (error: any) {
    if (error?.statusCode && error?.errors) {
      logger.error(
        {
          userId,
          quoteId: data.quoteId,
          statusCode: error.statusCode,
          errors: error.errors
        },
        'Square API error creating payment link'
      );
    } else {
      logger.error({ error, userId, quoteId: data.quoteId }, 'Failed to create user Square payment link');
    }
    return null;
  }
}

/**
 * Checks if a user has Square connected
 */
export async function isUserSquareConnected(userId: string): Promise<boolean> {
  try {
    const [user] = await db
      .select({
        squareAccessToken: users.squareAccessToken,
        squareMerchantId: users.squareMerchantId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return !!(user?.squareAccessToken && user?.squareMerchantId);
  } catch (error) {
    logger.error({ error, userId }, 'Error checking user Square connection');
    return false;
  }
}
