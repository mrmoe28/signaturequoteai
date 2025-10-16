#!/usr/bin/env tsx
/**
 * Run Subscription Table Migrations
 *
 * This script creates all subscription-related tables in NeonDB
 */

import { sql } from 'drizzle-orm';
import { db } from '../lib/db';
import { createLogger } from '../lib/logger';

const logger = createLogger('migrate-subscriptions');

async function runMigrations() {
  console.log('\n🚀 Running subscription table migrations...\n');

  try {
    // Create subscription_plans table
    console.log('Creating subscription_plans table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT,
        price NUMERIC(12, 2) NOT NULL,
        currency TEXT DEFAULT 'USD' NOT NULL,
        billing_period TEXT DEFAULT 'monthly' NOT NULL,
        trial_days INTEGER DEFAULT 0,
        square_catalog_id TEXT,
        square_variation_id TEXT,
        features TEXT,
        limits TEXT,
        is_active TEXT DEFAULT 'true' NOT NULL,
        is_popular TEXT DEFAULT 'false' NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ subscription_plans table created');

    // Create indexes for subscription_plans
    await db.execute(sql`CREATE INDEX IF NOT EXISTS subscription_plans_slug_idx ON subscription_plans(slug)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS subscription_plans_active_idx ON subscription_plans(is_active)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS subscription_plans_order_idx ON subscription_plans(display_order)`);
    console.log('✅ subscription_plans indexes created');

    // Create subscriptions table
    console.log('Creating subscriptions table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        square_subscription_id TEXT UNIQUE,
        square_customer_id TEXT,
        square_location_id TEXT,
        status TEXT DEFAULT 'active' NOT NULL,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        trial_start TIMESTAMP,
        trial_end TIMESTAMP,
        canceled_at TIMESTAMP,
        cancel_at TIMESTAMP,
        ended_at TIMESTAMP,
        price NUMERIC(12, 2),
        currency TEXT DEFAULT 'USD',
        billing_period TEXT DEFAULT 'monthly',
        cancel_reason TEXT,
        cancel_feedback TEXT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ subscriptions table created');

    // Create indexes for subscriptions
    await db.execute(sql`CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON subscriptions(plan_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS subscriptions_square_id_idx ON subscriptions(square_subscription_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS subscriptions_period_end_idx ON subscriptions(current_period_end)`);
    console.log('✅ subscriptions indexes created');

    // Create subscription_invoices table
    console.log('Creating subscription_invoices table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        square_invoice_id TEXT UNIQUE,
        square_order_id TEXT,
        square_payment_id TEXT,
        invoice_number TEXT,
        amount NUMERIC(12, 2) NOT NULL,
        currency TEXT DEFAULT 'USD' NOT NULL,
        tax NUMERIC(12, 2) DEFAULT 0,
        total NUMERIC(12, 2) NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        billing_period_start TIMESTAMP,
        billing_period_end TIMESTAMP,
        due_date TIMESTAMP,
        paid_at TIMESTAMP,
        attempted_at TIMESTAMP,
        payment_method TEXT,
        last_four TEXT,
        failure_reason TEXT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ subscription_invoices table created');

    // Create indexes for subscription_invoices
    await db.execute(sql`CREATE INDEX IF NOT EXISTS invoices_subscription_id_idx ON subscription_invoices(subscription_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON subscription_invoices(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS invoices_status_idx ON subscription_invoices(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS invoices_square_id_idx ON subscription_invoices(square_invoice_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON subscription_invoices(due_date)`);
    console.log('✅ subscription_invoices indexes created');

    // Create subscription_usage table
    console.log('Creating subscription_usage table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS subscription_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        metric TEXT NOT NULL,
        quantity INTEGER DEFAULT 0 NOT NULL,
        "limit" INTEGER,
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ subscription_usage table created');

    // Create indexes for subscription_usage
    await db.execute(sql`CREATE INDEX IF NOT EXISTS usage_subscription_id_idx ON subscription_usage(subscription_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS usage_user_id_idx ON subscription_usage(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS usage_metric_idx ON subscription_usage(metric)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS usage_period_idx ON subscription_usage(period_start, period_end)`);
    console.log('✅ subscription_usage indexes created');

    console.log('\n✅ All subscription tables created successfully!\n');

    // Verify tables
    console.log('📊 Verifying tables...');
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'subscription%'
      ORDER BY table_name;
    `);

    console.log('\nCreated tables:');
    result.rows.forEach((row: any) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    console.log('\n🎉 Migration completed successfully!\n');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
