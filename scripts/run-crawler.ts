#!/usr/bin/env tsx

/**
 * Manual crawler script to populate database with Signature Solar products
 * Run with: npx tsx scripts/run-crawler.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.production
config({ path: resolve(__dirname, '../.env.production') });

import { CrawlService } from '../lib/crawl-service';
import { createLogger } from '../lib/logger';

const logger = createLogger('manual-crawl');

async function main() {
  try {
    logger.info('Starting manual crawl...');

    const crawlService = CrawlService.getInstance();
    const job = await crawlService.runFullCrawl();

    logger.info({
      jobId: job.id,
      status: job.status,
      productsProcessed: job.productsProcessed,
      productsUpdated: job.productsUpdated,
    }, 'Crawl completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Crawl failed');
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
