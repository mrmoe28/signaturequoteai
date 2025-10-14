#!/usr/bin/env tsx

import * as cheerio from 'cheerio';

async function debugJSONLD(url: string) {
  console.log(`\n🔍 Debugging JSON-LD for: ${url}\n`);

  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const jsonLd = $('script[type="application/ld+json"]').first();
  if (jsonLd.length > 0) {
    try {
      const data = JSON.parse(jsonLd.html() || '');
      console.log('✅ Found JSON-LD data:\n');
      console.log(JSON.stringify(data, null, 2));

      if (data['@type'] === 'Product') {
        console.log('\n📦 Product Data:');
        console.log('  Name:', data.name);
        console.log('  Offers:', JSON.stringify(data.offers, null, 2));

        const price = data.offers?.price || data.offers?.[0]?.price;
        console.log('\n💰 Extracted price:', price);
        console.log('  Type:', typeof price);
        console.log('  toString():', price?.toString());
        console.log('  After replace:', price?.toString().replace(/[^0-9.]/g, ''));
        console.log('  parseFloat():', parseFloat(price?.toString().replace(/[^0-9.]/g, '') || '0'));
      }
    } catch (e) {
      console.error('❌ Failed to parse JSON-LD:', e);
    }
  } else {
    console.log('❌ No JSON-LD found');
  }
}

debugJSONLD('https://signaturesolar.com/complete-hybrid-solar-kit-12000w-output-eg4-18kpv-kit-e0006/');
