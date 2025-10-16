#!/usr/bin/env tsx
/**
 * Seed Subscription Plans
 *
 * Populates the subscription_plans table with default plans
 */

import { db } from '../lib/db';
import { subscriptionPlans } from '../lib/db/schema';
import { SUBSCRIPTION_PLANS } from '../lib/subscription-plans';
import { createLogger } from '../lib/logger';
import { eq } from 'drizzle-orm';

const logger = createLogger('seed-plans');

async function seedPlans() {
  console.log('\n🌱 Seeding subscription plans...\n');

  try {
    for (const plan of SUBSCRIPTION_PLANS) {
      console.log(`Processing plan: ${plan.name}...`);

      // Check if plan already exists
      const [existing] = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.slug, plan.slug))
        .limit(1);

      const planData = {
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: plan.price.toString(),
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        trialDays: plan.trialDays,
        features: JSON.stringify(plan.features),
        limits: JSON.stringify(plan.limits),
        isPopular: plan.isPopular ? 'true' : 'false',
        displayOrder: plan.displayOrder,
        isActive: 'true',
      };

      if (existing) {
        // Update existing plan
        await db
          .update(subscriptionPlans)
          .set({ ...planData, updatedAt: new Date() })
          .where(eq(subscriptionPlans.id, existing.id));

        console.log(`  ✅ Updated: ${plan.name} (${plan.slug})`);
      } else {
        // Create new plan
        await db
          .insert(subscriptionPlans)
          .values(planData);

        console.log(`  ✅ Created: ${plan.name} (${plan.slug})`);
      }
    }

    console.log('\n✅ Subscription plans seeded successfully!\n');

    // Display seeded plans
    const allPlans = await db
      .select()
      .from(subscriptionPlans)
      .orderBy(subscriptionPlans.displayOrder);

    console.log('📊 Current subscription plans in database:\n');
    allPlans.forEach((plan) => {
      const features = JSON.parse(plan.features || '[]');
      const limits = JSON.parse(plan.limits || '{}');

      console.log(`  ${plan.isPopular === 'true' ? '⭐' : '  '} ${plan.name} - $${plan.price}/month`);
      console.log(`     Slug: ${plan.slug}`);
      console.log(`     Features: ${features.length} features`);
      console.log(`     Limits: quotes=${limits.quotes || 'unlimited'}, products=${limits.products || 'unlimited'}`);
      console.log('');
    });

    console.log('🎉 Seeding completed successfully!\n');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Seeding failed');
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedPlans();
