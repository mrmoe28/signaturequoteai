import { NextRequest, NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';
import { db } from '@/lib/db';

const logger = createLogger('api-fix-database');

export async function POST(request: NextRequest) {
  try {
    logger.info('Starting database fix...');

    // Add image_url column to quote_items if it doesn't exist
    try {
      await db.execute(`
        ALTER TABLE "quote_items" ADD COLUMN IF NOT EXISTS "image_url" text;
      `);
      logger.info('✅ image_url column added to quote_items');
    } catch (error) {
      logger.warn({ error }, 'image_url column might already exist');
    }

    // Add primary_image_url column to products if it doesn't exist
    try {
      await db.execute(`
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "primary_image_url" text;
      `);
      logger.info('✅ primary_image_url column added to products');
    } catch (error) {
      logger.warn({ error }, 'primary_image_url column might already exist');
    }

    logger.info('Database fix completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database columns added successfully',
    });

  } catch (error) {
    logger.error({ error }, 'Failed to fix database');
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix database',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
