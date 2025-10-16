/**
 * Setup Square Subscription Plans
 *
 * This script:
 * 1. Creates subscription plans in Square using the Catalog API
 * 2. Updates the database plans with Square Catalog IDs
 * 3. Enables full Square checkout integration
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { subscriptionPlans } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { SUBSCRIPTION_PLANS } from '../lib/subscription-plans';

async function setupSquareSubscriptions() {
  console.log('🚀 Setting up Square subscription plans...\n');

  // Validate environment variables
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;

  if (!accessToken || accessToken === 'your_square_access_token') {
    console.error('❌ SQUARE_ACCESS_TOKEN not configured');
    process.exit(1);
  }

  if (!locationId) {
    console.error('❌ SQUARE_LOCATION_ID not configured');
    process.exit(1);
  }

  try {
    const { SquareClient, SquareEnvironment } = await import('square');

    const environment =
      process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox;

    console.log(`📡 Connecting to Square (${process.env.SQUARE_ENVIRONMENT || 'sandbox'})...\n`);

    const client = new SquareClient({
      token: accessToken,
      environment,
    });

    // Process each plan
    for (const plan of SUBSCRIPTION_PLANS) {
      // Skip free plan (no Square subscription needed)
      if (plan.price === 0) {
        console.log(`⏭️  Skipping Free plan (no payment required)\n`);
        continue;
      }

      console.log(`📋 Processing ${plan.name} plan...`);

      try {
        // Create subscription plan in Square Catalog
        const catalogResponse = await client.catalog.object.upsert({
          idempotencyKey: `plan-${plan.slug}-${Date.now()}`,
          object: {
            type: 'SUBSCRIPTION_PLAN',
            id: `#${plan.slug}-plan`,
            subscriptionPlanData: {
              name: `${plan.name} Plan - SignatureQuoteCrawler`,
              phases: [
                {
                  ordinal: BigInt(0),
                  cadence: 'MONTHLY',
                  recurringPriceMoney: {
                    amount: BigInt(plan.price * 100), // Convert to cents
                    currency: 'USD',
                  },
                  periods: undefined, // Unlimited periods
                },
              ],
            },
          },
        });

        const catalogObject = catalogResponse.catalogObject;

        if (!catalogObject || !catalogObject.id) {
          throw new Error('Failed to create catalog object');
        }

        console.log(`   ✅ Created in Square: ${catalogObject.id}`);

        // Get the subscription plan variation ID (needed for creating subscriptions)
        const variationId =
          catalogObject.subscriptionPlanData?.subscriptionPlanVariations?.[0]?.id;

        if (!variationId) {
          console.warn(`   ⚠️  No variation ID found for ${plan.name}`);
        }

        // Update database with Square IDs
        const updateResult = await db
          .update(subscriptionPlans)
          .set({
            squareCatalogId: catalogObject.id,
            squareVariationId: variationId || null,
          })
          .where(eq(subscriptionPlans.slug, plan.slug))
          .returning();

        if (updateResult.length > 0) {
          console.log(`   ✅ Updated database with Square IDs`);
          console.log(`      Catalog ID: ${catalogObject.id}`);
          if (variationId) {
            console.log(`      Variation ID: ${variationId}`);
          }
        } else {
          console.log(`   ⚠️  Plan not found in database: ${plan.slug}`);
        }
      } catch (error: any) {
        console.error(`   ❌ Failed to process ${plan.name}:`, error.message);

        if (error.errors) {
          error.errors.forEach((err: any) => {
            console.error(`      - ${err.code}: ${err.detail}`);
          });
        }
      }

      console.log('');
    }

    console.log('✅ Square subscription setup complete!\n');
    console.log('Next steps:');
    console.log('1. Test the checkout flow at /checkout?plan=pro');
    console.log('2. Verify subscription creation in Square Dashboard');
    console.log('3. Test webhook events\n');
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupSquareSubscriptions()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
