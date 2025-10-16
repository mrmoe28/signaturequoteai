/**
 * Square Payment Integration
 *
 * This module provides functions to create payment links using Square's Checkout API.
 * Requires Square SDK: npm install square
 */

import { createLogger } from './logger';

const logger = createLogger('square-client');

// Dynamic import to avoid build-time dependency
type SquareClient = any;
type SquareEnvironment = any;
type SquareApiError = any;

// Initialize Square client with dynamic import
async function getSquareClient(): Promise<SquareClient> {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('SQUARE_ACCESS_TOKEN environment variable is required');
  }

  try {
    // Dynamic import - Square SDK exports SquareClient and SquareEnvironment
    const { SquareClient, SquareEnvironment } = await import('square');

    const environment = process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

    logger.info({
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
      accessTokenPrefix: accessToken.substring(0, 10) + '...'
    }, 'Initializing Square client');

    const client = new SquareClient({
      token: accessToken,
      environment,
    });

    logger.info('Square client initialized successfully');

    return client;
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error
    }, 'Failed to load Square SDK - make sure to run: npm install square');
    throw error;
  }
}

export interface PaymentLinkData {
  quoteId: string;
  quoteNumber?: string;
  customerName: string;
  customerEmail: string;
  amount: number; // in dollars
  description?: string;
  redirectUrl?: string;
}

/**
 * Creates a Square payment link for a quote
 *
 * @param data Payment link data including quote details and amount
 * @returns The checkout page URL
 */
export async function createSquarePaymentLink(data: PaymentLinkData): Promise<string> {
  try {
    const client = await getSquareClient();
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Convert dollars to cents (Square uses cents)
    const amountInCents = Math.round(data.amount * 100);

    logger.info(
      {
        quoteId: data.quoteId,
        amount: data.amount,
        amountInCents
      },
      'Creating Square payment link'
    );

    // Create a checkout using Square's Checkout API
    const response = await client.checkout.paymentLinks.create({
      idempotencyKey: `quote-${data.quoteId}-${Date.now()}`,
      order: {
        locationId,
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

    if (!response.paymentLink?.url) {
      throw new Error('Square API did not return a payment link URL');
    }

    logger.info(
      {
        quoteId: data.quoteId,
        paymentLinkId: response.paymentLink.id
      },
      'Square payment link created successfully'
    );

    return response.paymentLink.url;

  } catch (error: any) {
    // Check if it's a Square ApiError
    if (error?.statusCode && error?.errors) {
      logger.error(
        {
          quoteId: data.quoteId,
          statusCode: error.statusCode,
          errors: error.errors
        },
        'Square API error creating payment link'
      );
      throw new Error(`Square API error: ${error.errors?.[0]?.detail || error.message}`);
    }

    // Log detailed error information
    logger.error({
      quoteId: data.quoteId,
      errorMessage: error?.message || 'Unknown error',
      errorName: error?.name || 'Unknown',
      errorStack: error?.stack,
      errorString: String(error),
      errorKeys: Object.keys(error || {})
    }, 'Failed to create Square payment link');

    throw error;
  }
}

/**
 * Creates a placeholder payment link when Square is not configured
 * This redirects to an error page explaining the configuration issue
 */
export function createPlaceholderPaymentLink(data: PaymentLinkData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  const params = new URLSearchParams({
    quoteId: data.quoteId,
    error: 'not_configured',
    amount: data.amount.toFixed(2),
  });

  logger.warn(
    { quoteId: data.quoteId },
    'Square not configured - redirecting to error page'
  );

  return `${baseUrl}/payment-error?${params.toString()}`;
}

/**
 * Checks if Square is properly configured
 */
export function isSquareConfigured(): boolean {
  return !!(
    process.env.SQUARE_ACCESS_TOKEN &&
    process.env.SQUARE_LOCATION_ID &&
    process.env.SQUARE_ACCESS_TOKEN !== 'your_square_access_token' &&
    process.env.SQUARE_LOCATION_ID !== 'your_square_location_id'
  );
}
