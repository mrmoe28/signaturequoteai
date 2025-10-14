#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.production') });

import { crawler } from '../lib/crawler';

async function testPriceFix() {
  const testUrl = 'https://signaturesolar.com/complete-hybrid-solar-kit-12000w-output-eg4-18kpv-kit-e0006/';

  console.log(`\n🧪 Testing price fix for: ${testUrl}\n`);

  const result = await crawler.crawlProduct(testUrl);

  if (result.success && result.product) {
    console.log('✅ Product crawled successfully!');
    console.log(`\n📦 Product: ${result.product.name}`);
    console.log(`💰 Price: $${result.product.price}`);
    console.log(`🆔 SKU: ${result.product.sku}`);
    console.log(`🏷️  Category: ${result.product.category}`);

    // Validate the price is reasonable
    if (result.product.price !== null && result.product.price > 0 && result.product.price < 100000) {
      console.log('\n✅ Price looks correct!');
    } else {
      console.log('\n❌ Price looks suspicious!');
    }
  } else {
    console.log('❌ Failed to crawl product');
    console.log(`Error: ${result.error}`);
  }
}

testPriceFix();
