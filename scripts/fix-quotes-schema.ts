/**
 * Script to fix the quotes table schema
 * Renames 'overall' column to 'total' if it exists
 * Run with: npx tsx scripts/fix-quotes-schema.ts
 */

import { sql } from '@/lib/db';
import { createLogger } from '@/lib/logger';

const logger = createLogger('fix-quotes-schema');

async function main() {
  logger.info('Starting quotes schema fix...');

  try {
    // Check current column names in quotes table
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'quotes' 
      ORDER BY ordinal_position
    `;

    logger.info({ columns }, 'Current quotes table columns:');

    const columnNames = columns.map((c: any) => c.column_name);

    if (columnNames.includes('overall') && !columnNames.includes('total')) {
      logger.info('Found "overall" column, renaming to "total"...');
      
      await sql`ALTER TABLE quotes RENAME COLUMN overall TO total`;
      
      logger.info('✓ Successfully renamed column from "overall" to "total"');
    } else if (columnNames.includes('total')) {
      logger.info('✓ Column "total" already exists, no action needed');
    } else {
      logger.warn('Neither "overall" nor "total" column found!');
    }

    // Verify the fix
    const verifyColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quotes' 
      AND column_name = 'total'
    `;

    if (verifyColumns.length > 0) {
      logger.info('✓ Verification successful: "total" column exists');
    } else {
      logger.error('✗ Verification failed: "total" column not found after migration');
    }

  } catch (error) {
    logger.error({ error }, 'Failed to fix quotes schema:');
    throw error;
  }
}

main()
  .then(() => {
    logger.info('Schema fix complete');
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, 'Schema fix failed:');
    process.exit(1);
  });

