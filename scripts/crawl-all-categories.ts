#!/usr/bin/env tsx

/**
 * Crawl all categories from Signature Solar
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.production') });

import { CrawlService } from '../lib/crawl-service';
import { createLogger } from '../lib/logger';

const logger = createLogger('crawl-all-categories');

// List of category URLs to crawl
const CATEGORIES = [
  'https://signaturesolar.com/new-arrivals/',
  'https://signaturesolar.com/all-products/kits-bundles/',
  'https://signaturesolar.com/all-products/batteries/',
  'https://signaturesolar.com/all-products/battery-accessories-and-racking/',
  'https://signaturesolar.com/all-products/inverters/',
  'https://signaturesolar.com/all-products/solar-panels/',
  'https://signaturesolar.com/all-products/mounting-options-hardware/',
  'https://signaturesolar.com/shop-all/system-components/',
  'https://signaturesolar.com/all-products/generators/',
  'https://signaturesolar.com/all-products/portable-power-stations/',
  'https://signaturesolar.com/all-products/ev-chargers/',
  'https://signaturesolar.com/homesteading/',
];

async function main() {
  const crawlService = CrawlService.getInstance();

  let totalCategories = CATEGORIES.length;
  let categoriesProcessed = 0;
  let totalProductsProcessed = 0;
  let totalProductsUpdated = 0;

  console.log(`\n🚀 Starting crawl of ${totalCategories} categories\n`);

  for (const categoryUrl of CATEGORIES) {
    try {
      categoriesProcessed++;
      console.log(`\n[${ categoriesProcessed}/${totalCategories}] Crawling: ${categoryUrl}`);

      const job = await crawlService.runCategoryCrawl(categoryUrl);

      totalProductsProcessed += job.productsProcessed || 0;
      totalProductsUpdated += job.productsUpdated || 0;

      if (job.status === 'completed') {
        console.log(`✅ Success! Products: ${job.productsProcessed} processed, ${job.productsUpdated} saved`);
      } else {
        console.log(`⚠️  Failed: ${job.errorMessage || 'Unknown error'}`);
      }

    } catch (error) {
      console.error(`❌ Error crawling ${categoryUrl}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\n\n📊 Final Summary:`);
  console.log(`   Categories processed: ${categoriesProcessed}/${totalCategories}`);
  console.log(`   Total products processed: ${totalProductsProcessed}`);
  console.log(`   Total products saved: ${totalProductsUpdated}`);

  process.exit(0);
}

main();
