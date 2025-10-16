/**
 * Subscription Plans API
 * GET /api/subscriptions/plans - Fetch all available subscription plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { subscriptionPlans } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-subscription-plans');

export async function GET(request: NextRequest) {
  try {
    // Fetch all active plans ordered by display order
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, 'true'))
      .orderBy(asc(subscriptionPlans.displayOrder));

    // Transform plans for client consumption
    const transformedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      price: plan.price,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      trialDays: plan.trialDays,
      features: JSON.parse(plan.features || '[]'),
      limits: JSON.parse(plan.limits || '{}'),
      isPopular: plan.isPopular === 'true',
      displayOrder: plan.displayOrder,
    }));

    return NextResponse.json({
      success: true,
      plans: transformedPlans,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch subscription plans');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription plans',
      },
      { status: 500 }
    );
  }
}
