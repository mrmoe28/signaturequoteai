/**
 * Create Subscription API
 * POST /api/subscriptions/create - Create a new subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth';
import { createSquareSubscription } from '@/lib/square-subscriptions';
import { createSubscription, getUserSubscription } from '@/lib/db/subscription-queries';
import { getPlanBySlug } from '@/lib/subscription-plans';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-create-subscription');

const createSubscriptionSchema = z.object({
  planSlug: z.string(),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  paymentMethodId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please sign in to subscribe' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { planSlug, billingPeriod, paymentMethodId } = createSubscriptionSchema.parse(body);

    // Check if user already has an active subscription
    const existingSubscription = await getUserSubscription(user.id);

    if (existingSubscription && existingSubscription.status === 'active') {
      return NextResponse.json(
        {
          error: 'Subscription exists',
          message: 'You already have an active subscription. Please cancel it before subscribing to a new plan.',
          subscription: existingSubscription,
        },
        { status: 400 }
      );
    }

    // Get the plan details
    const plan = getPlanBySlug(planSlug);

    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan', message: 'Subscription plan not found' },
        { status: 404 }
      );
    }

    // If it's a free plan, create subscription without Square
    if (parseFloat(plan.price.toString()) === 0) {
      const subscription = await createSubscription({
        userId: user.id,
        planId: plan.id,
        status: 'active',
        price: '0',
        currency: plan.currency,
        billingPeriod,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      return NextResponse.json({
        success: true,
        subscription,
        message: 'Free plan activated successfully',
      });
    }

    // For paid plans, create Square subscription
    const squareSubscription = await createSquareSubscription({
      userId: user.id,
      planSlug: plan.slug,
      customerEmail: user.email,
      customerName: user.name || user.email,
      paymentMethodId: paymentMethodId,
    });

    return NextResponse.json({
      success: true,
      subscription: squareSubscription,
      message: 'Subscription created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error({ error }, 'Failed to create subscription');

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to create subscription. Please try again.',
      },
      { status: 500 }
    );
  }
}
