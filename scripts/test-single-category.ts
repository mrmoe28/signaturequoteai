#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.production') });

import { crawler } from '../lib/crawler';
import { createLogger } from '../lib/logger';

const logger = createLogger('test-single-category');

async function main() {
  try {
    logger.info('Testing single category crawl');

    await crawler.initialize();

    const categoryUrl = 'https://signaturesolar.com/all-products/solar-panels/';
    const productUrls = await crawler.crawlCategoryRecursively(categoryUrl);

    logger.info({
      categoryUrl,
      productsFound: productUrls.length,
      firstFew: productUrls.slice(0, 5)
    }, 'Products found');

    if (productUrls.length > 0) {
      logger.info('Testing first product crawl');
      const firstProduct = productUrls[0];
      const result = await crawler.crawlProduct(firstProduct);

      if (result.success && result.product) {
        logger.info({
          productId: result.product.id,
          name: result.product.name,
          price: result.product.price,
          vendor: result.product.vendor
        }, 'Product crawled successfully');
      } else {
        logger.error({ error: result.error }, 'Failed to crawl product');
      }
    }

    await crawler.close();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Test failed');
    process.exit(1);
  }
}

main();
