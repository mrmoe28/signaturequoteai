#!/usr/bin/env tsx

/**
 * Crawl all products from Signature Solar's solar kits page
 * and save them to the database with full details
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.production
config({ path: resolve(__dirname, '../.env.production') });

import { CrawlService } from '../lib/crawl-service';
import { createLogger } from '../lib/logger';

const logger = createLogger('crawl-solar-kits');

async function main() {
  try {
    logger.info('Starting solar kits crawl');

    const crawlService = CrawlService.getInstance();
    const categoryUrl = 'https://signaturesolar.com/solar-kits/';

    logger.info({ categoryUrl }, 'Crawling solar kits category');

    const job = await crawlService.runCategoryCrawl(categoryUrl);

    logger.info({
      jobId: job.id,
      status: job.status,
      productsProcessed: job.productsProcessed,
      productsUpdated: job.productsUpdated,
    }, 'Solar kits crawl completed');

    if (job.status === 'completed') {
      console.log('\n✅ Success!');
      console.log(`📦 Products processed: ${job.productsProcessed}`);
      console.log(`💾 Products saved to database: ${job.productsUpdated}`);
    } else {
      console.log('\n❌ Crawl failed');
      console.log(`Error: ${job.errorMessage || 'Unknown error'}`);
    }

    process.exit(job.status === 'completed' ? 0 : 1);
  } catch (error) {
    logger.error({ error }, 'Solar kits crawl failed');
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
