#!/usr/bin/env tsx

/**
 * Test script to verify JavaScript extraction from BigCommerce pages
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as cheerio from 'cheerio';

// Load environment variables
config({ path: resolve(__dirname, '../.env.production') });

async function testJsExtraction() {
  const testUrl = 'https://signaturesolar.com/all-products/solar-panels/';

  console.log(`\n🔍 Testing JavaScript extraction from: ${testUrl}\n`);

  try {
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CustomCrawler/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    console.log(`✅ Fetched HTML (${html.length} bytes)`);

    // Look for _smbdg_products in script tags
    const scriptTags = $('script').toArray();
    console.log(`📜 Found ${scriptTags.length} script tags`);

    let foundProducts = false;

    for (const scriptTag of scriptTags) {
      const scriptContent = $(scriptTag).html() || '';

      if (scriptContent.includes('_smbdg_products')) {
        console.log('\n✨ Found _smbdg_products variable!');

        const match = scriptContent.match(/var\s+_smbdg_products\s*=\s*(\[[\s\S]*?\]);/);

        if (match && match[1]) {
          console.log('📦 Successfully extracted JavaScript array');

          try {
            const productsData = JSON.parse(match[1]);
            console.log(`\n📊 Products in array: ${productsData.length}`);

            if (productsData.length > 0) {
              console.log('\n🔗 First 5 product URLs:');
              productsData.slice(0, 5).forEach((product: any, index: number) => {
                console.log(`   ${index + 1}. ${product.handle}`);
                console.log(`      Price: $${product.price}`);
                console.log(`      Brand: ${product.brand || 'N/A'}`);
              });
            }

            foundProducts = true;
            break;
          } catch (parseError) {
            console.error('❌ Failed to parse JSON:', parseError);
          }
        } else {
          console.log('⚠️  Variable found but regex match failed');
        }
      }
    }

    if (!foundProducts) {
      console.log('\n❌ No _smbdg_products variable found in any script tags');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

testJsExtraction();
