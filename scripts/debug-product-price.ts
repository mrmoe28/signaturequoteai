#!/usr/bin/env tsx

/**
 * Debug script to examine raw product data from BigCommerce JavaScript
 */

import * as cheerio from 'cheerio';

async function debugProduct(url: string) {
  console.log(`\n🔍 Debugging: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CustomCrawler/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for the product JavaScript data
    const scriptTags = $('script').toArray();

    for (const scriptTag of scriptTags) {
      const scriptContent = $(scriptTag).html() || '';

      // Look for BCData.product_attributes
      if (scriptContent.includes('BCData') && scriptContent.includes('product_attributes')) {
        console.log('✅ Found BCData.product_attributes');

        // Extract the product attributes data
        const match = scriptContent.match(/BCData\.product_attributes\s*=\s*(\{[\s\S]*?\});/);
        if (match && match[1]) {
          try {
            const productData = JSON.parse(match[1]);
            console.log('\n📦 Product Attributes Data:');
            console.log(JSON.stringify(productData, null, 2));

            if (productData.price) {
              console.log('\n💰 Price Data:');
              console.log('  Raw price object:', productData.price);
              console.log('  Type:', typeof productData.price);

              if (typeof productData.price === 'object') {
                console.log('  Keys:', Object.keys(productData.price));
                console.log('  Values:', JSON.stringify(productData.price, null, 2));
              }

              // Test the current parsing logic
              const priceStr = productData.price?.toString();
              console.log('\n🧪 Testing current parser:');
              console.log('  toString():', priceStr);
              console.log('  After replace:', priceStr?.replace(/[^0-9.]/g, ''));
              console.log('  parseFloat():', parseFloat(priceStr?.replace(/[^0-9.]/g, '') || '0'));
            }
          } catch (e) {
            console.error('❌ Failed to parse product data:', e);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

const testUrl = 'https://signaturesolar.com/complete-hybrid-solar-kit-12000w-output-eg4-18kpv-kit-e0006/';
debugProduct(testUrl);
