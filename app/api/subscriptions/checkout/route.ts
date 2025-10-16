/**
 * Square Checkout API
 * POST /api/subscriptions/checkout - Create Square checkout session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { getPlanBySlug, getUserSubscription } from '@/lib/db/subscription-queries';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-subscription-checkout');

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to continue' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planSlug } = body;

    if (!planSlug) {
      return NextResponse.json(
        { error: 'Invalid request', message: 'Plan slug is required' },
        { status: 400 }
      );
    }

    // Get plan details
    const plan = await getPlanBySlug(planSlug);

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found', message: `Plan '${planSlug}' does not exist` },
        { status: 404 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await getUserSubscription(user.id);

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        {
          error: 'Active subscription exists',
          message: 'You already have an active subscription. Please cancel it first.',
        },
        { status: 400 }
      );
    }

    // Free plan doesn't need checkout
    if (parseFloat(plan.price) === 0) {
      return NextResponse.json(
        {
          error: 'Invalid plan',
          message: 'Free plan does not require checkout',
        },
        { status: 400 }
      );
    }

    // Check if Square is configured
    if (!plan.squareCatalogId) {
      logger.error({ planSlug }, 'Plan missing Square Catalog ID');
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: 'This plan is not yet configured for payments. Please contact support.',
        },
        { status: 500 }
      );
    }

    // Initialize Square client
    const { SquareClient, SquareEnvironment } = await import('square');

    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!accessToken || !locationId) {
      logger.error('Square credentials not configured');
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: 'Payment processing is not configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    const environment =
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox;

    const client = new SquareClient({
      token: accessToken,
      environment,
    });

    // Create payment link for first payment (subscription will be created via webhook after payment)
    const checkoutResponse = await client.checkout.paymentLinks.create({
      idempotencyKey: `checkout-${user.id}-${planSlug}-${Date.now()}`,
      order: {
        locationId,
        lineItems: [
          {
            name: `${plan.name} Plan - Monthly Subscription`,
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(Math.round(parseFloat(plan.price) * 100)), // Convert to cents
              currency: 'USD',
            },
            note: plan.trialDays && plan.trialDays > 0
              ? `Includes ${plan.trialDays}-day free trial. Subscription begins after trial.`
              : 'Monthly recurring subscription',
          },
        ],
        referenceId: user.id, // Store user ID in order reference
        metadata: {
          userId: user.id,
          planSlug: planSlug,
          userEmail: user.email,
          subscriptionSetup: 'true', // Flag to identify this as a subscription payment
        },
      },
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?checkout=success`,
        askForShippingAddress: false,
      },
      prePopulatedData: {
        buyerEmail: user.email,
      },
    });

    const paymentLink = checkoutResponse.paymentLink;

    if (!paymentLink || !paymentLink.url) {
      logger.error({ response: checkoutResponse }, 'Failed to create payment link');
      return NextResponse.json(
        {
          error: 'Checkout failed',
          message: 'Failed to create checkout session. Please try again.',
        },
        { status: 500 }
      );
    }

    logger.info(
      {
        userId: user.id,
        planSlug,
        paymentLinkId: paymentLink.id,
      },
      'Checkout session created'
    );

    return NextResponse.json({
      success: true,
      checkoutUrl: paymentLink.url,
      paymentLinkId: paymentLink.id,
    });
  } catch (error: any) {
    logger.error({ error }, 'Checkout creation failed');

    // Handle Square API errors
    if (error?.errors) {
      const errorMessages = error.errors.map((e: any) => e.detail || e.code).join(', ');
      return NextResponse.json(
        {
          error: 'Square API error',
          message: errorMessages,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
