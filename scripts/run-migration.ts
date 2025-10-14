#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { Pool } from 'pg';

config({ path: resolve(__dirname, '../.env.local') });

async function runMigration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const migrationSQL = readFileSync(
      resolve(__dirname, '../lib/db/migrations/0005_yielding_power_man.sql'),
      'utf-8'
    );

    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Running ${statements.length} migration statements...`);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      await pool.query(statement);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

runMigration();
