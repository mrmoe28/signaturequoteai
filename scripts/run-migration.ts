#!/usr/bin/env tsx

/**
 * Quick script to make first_name and last_name nullable
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log('Running migration: Make first_name and last_name nullable\n');

  try {
    // Make first_name nullable
    await sql`ALTER TABLE "users" ALTER COLUMN "first_name" DROP NOT NULL`;
    console.log('✅ Made first_name nullable');

    // Make last_name nullable
    await sql`ALTER TABLE "users" ALTER COLUMN "last_name" DROP NOT NULL`;
    console.log('✅ Made last_name nullable');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
