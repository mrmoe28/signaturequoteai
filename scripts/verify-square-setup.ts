/**
 * Verify Square subscription setup
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { subscriptionPlans } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function verify() {
  console.log('🔍 Verifying Square subscription setup...\n');

  // Check Pro plan
  const proPlan = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, 'pro'))
    .limit(1);

  if (proPlan.length > 0) {
    console.log('✅ Pro Plan:');
    console.log(`   Name: ${proPlan[0].name}`);
    console.log(`   Price: $${proPlan[0].price}`);
    console.log(`   Square Catalog ID: ${proPlan[0].squareCatalogId || 'NOT SET'}`);
    console.log(`   Square Variation ID: ${proPlan[0].squareVariationId || 'NOT SET'}`);
  } else {
    console.log('❌ Pro plan not found in database');
  }

  console.log();

  // Check Enterprise plan
  const enterprisePlan = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, 'enterprise'))
    .limit(1);

  if (enterprisePlan.length > 0) {
    console.log('✅ Enterprise Plan:');
    console.log(`   Name: ${enterprisePlan[0].name}`);
    console.log(`   Price: $${enterprisePlan[0].price}`);
    console.log(`   Square Catalog ID: ${enterprisePlan[0].squareCatalogId || 'NOT SET'}`);
    console.log(`   Square Variation ID: ${enterprisePlan[0].squareVariationId || 'NOT SET'}`);
  } else {
    console.log('❌ Enterprise plan not found in database');
  }

  console.log('\n✅ Verification complete!');
  process.exit(0);
}

verify();
