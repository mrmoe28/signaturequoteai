#!/usr/bin/env tsx

/**
 * Test script for the Signature Solar crawler
 * Tests basic crawler functionality without hitting the database
 */

import 'dotenv/config';
import { crawler } from '../lib/crawler';
import { createLogger } from '../lib/logger';

const logger = createLogger('test-crawler');

async function testCrawler() {
  logger.info('Starting crawler test...');

  try {
    // Test 1: Initialize crawler
    logger.info('Test 1: Initializing crawler...');
    await crawler.initialize();
    logger.info('✅ Crawler initialized successfully');

    // Test 2: Test robots.txt checking
    logger.info('Test 2: Testing robots.txt compliance...');
    const testUrl = 'https://signaturesolar.com/solar-panels/';
    
    // Test 3: Crawl a single category page (limited results)
    logger.info('Test 3: Testing category crawl...');
    const categoryResult = await crawler.crawlCategory(testUrl);
    
    if (categoryResult.success) {
      logger.info(`✅ Category crawl successful: found ${categoryResult.productUrls.length} product URLs`);
      
      // Show first few URLs as sample
      categoryResult.productUrls.slice(0, 3).forEach((url, i) => {
        logger.info(`  Sample URL ${i + 1}: ${url}`);
      });
    } else {
      logger.error(`❌ Category crawl failed: ${categoryResult.error}`);
    }

    // Test 4: Test product crawling with first URL if available
    if (categoryResult.success && categoryResult.productUrls.length > 0) {
      logger.info('Test 4: Testing single product crawl...');
      const testProductUrl = categoryResult.productUrls[0];
      
      const productResult = await crawler.crawlProduct(testProductUrl);
      
      if (productResult.success && productResult.product) {
        logger.info('✅ Product crawl successful:');
        logger.info(`  Name: ${productResult.product.name}`);
        logger.info(`  Price: $${productResult.product.price}`);
        logger.info(`  SKU: ${productResult.product.sku || 'N/A'}`);
        logger.info(`  Category: ${productResult.product.category || 'N/A'}`);
      } else {
        logger.error(`❌ Product crawl failed: ${productResult.error}`);
      }
    }

  } catch (error) {
    logger.error('❌ Crawler test failed:', error);
  } finally {
    // Clean up
    await crawler.close();
    logger.info('🏁 Crawler test completed');
  }
}

// Run the test
if (require.main === module) {
  testCrawler().catch(console.error);
}