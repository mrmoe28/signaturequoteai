/**
 * Fix Square Variation IDs
 *
 * Fetches the subscription plan variation IDs from Square and updates the database
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { subscriptionPlans } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function fixSquareVariationIds() {
  console.log('🔧 Fixing Square variation IDs...\n');

  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!accessToken || accessToken === 'your_square_access_token') {
    console.error('❌ SQUARE_ACCESS_TOKEN not configured');
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

    // Get all plans from database
    const plans = await db
      .select()
      .from(subscriptionPlans);

    // Filter plans that have catalog IDs but no variation IDs
    const plansWithCatalogIds = plans.filter(p => p.squareCatalogId && !p.squareVariationId);

    console.log(`Found ${plansWithCatalogIds.length} plans with Square Catalog IDs\n`);

    for (const plan of plansWithCatalogIds) {
      console.log(`📋 Processing ${plan.name} plan...`);
      console.log(`   Catalog ID: ${plan.squareCatalogId}`);

      try {
        // List all subscription plans from Square and find this one
        const listResponse = await client.catalog.list({ types: 'SUBSCRIPTION_PLAN' });

        const catalogObject = listResponse.objects?.find(obj => obj.id === plan.squareCatalogId);

        if (!catalogObject) {
          console.error(`   ❌ Catalog object not found in Square`);
          continue;
        }

        // Extract variation ID
        const variationId = catalogObject.subscriptionPlanData?.subscriptionPlanVariations?.[0]?.id;

        if (!variationId) {
          console.warn(`   ⚠️  No variation ID found`);
          console.log(`   Object data:`, JSON.stringify(catalogObject.subscriptionPlanData, null, 2));
          continue;
        }

        console.log(`   ✅ Found variation ID: ${variationId}`);

        // Update database
        await db
          .update(subscriptionPlans)
          .set({
            squareVariationId: variationId,
          })
          .where(eq(subscriptionPlans.id, plan.id));

        console.log(`   ✅ Updated database\n`);
      } catch (error: any) {
        console.error(`   ❌ Failed to process ${plan.name}:`, error.message);
        if (error.errors) {
          error.errors.forEach((err: any) => {
            console.error(`      - ${err.code}: ${err.detail}`);
          });
        }
        console.log('');
      }
    }

    console.log('✅ Variation ID fix complete!\n');
  } catch (error: any) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixSquareVariationIds()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
