#!/usr/bin/env tsx

import * as cheerio from 'cheerio';

async function debugPriceSelectors(url: string) {
  console.log(`\n🔍 Debugging price selectors for: ${url}\n`);

  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  const priceSelectors = ['.price', '.product-price', '[data-price]', '.amount', '.cost', '.money'];

  console.log('Testing each price selector:\n');
  for (const selector of priceSelectors) {
    const elements = $(selector);
    console.log(`\n${selector}:`);
    console.log(`  Found ${elements.length} elements`);

    elements.each((index, el) => {
      const text = $(el).text().trim();
      const html = $(el).html();
      console.log(`\n  [${index}] Text: "${text}"`);
      console.log(`      HTML: ${html?.substring(0, 200)}`);
      console.log(`      Matches /\\$[\\d,.]/ : ${/\$[\d,.]/.test(text)}`);

      if (/\$[\d,.]/.test(text)) {
        console.log(`      ⭐ This would be selected!`);
        console.log(`      toString().replace(/[^0-9.]/g, ''): ${text.toString().replace(/[^0-9.]/g, '')}`);
        console.log(`      parseFloat(): ${parseFloat(text.toString().replace(/[^0-9.]/g, '') || '0')}`);
      }
    });
  }

  // Also check meta tags
  console.log('\n\n🏷️  Meta tag for product:price:amount:');
  const metaPrice = $('meta[property="product:price:amount"], meta[name="product:price:amount"]').first().attr('content');
  console.log(`  Content: ${metaPrice}`);
}

debugPriceSelectors('https://signaturesolar.com/complete-hybrid-solar-kit-12000w-output-eg4-18kpv-kit-e0006/');
