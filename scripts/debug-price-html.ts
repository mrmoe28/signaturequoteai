#!/usr/bin/env tsx

import * as cheerio from 'cheerio';

async function debugPriceHTML(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  console.log('\n🔍 Price Elements with .price class:\n');

  $('.price').each((index, el) => {
    const $el = $(el);
    const text = $el.text().trim().substring(0, 100);
    const tagName = $el.prop('tagName');
    const classes = $el.attr('class');
    const parent = $el.parent();
    const parentClasses = parent.attr('class');

    // Check if this element contains ONLY a price (not nested prices)
    const childPrices = $el.find('.price').length;

    console.log(`[${index}] <${tagName} class="${classes}">`);
    console.log(`  Parent: <${parent.prop('tagName')} class="${parentClasses}">`);
    console.log(`  Text: "${text}${text.length === 100 ? '...' : ''}"`);
    console.log(`  Child .price elements: ${childPrices}`);
    console.log(`  Looks like actual price: ${/^\$[\d,]+\.[\d]{2}$/.test(text)}`);
    console.log('');
  });

  // Try to find the main product price more specifically
  console.log('\n🎯 Searching for main product price:\n');

  const candidates = [
    '.price--withoutTax',
    '.price--withTax',
    '.price.price--withoutTax',
    '[data-product-price]',
    '.productView-price .price',
  ];

  for (const selector of candidates) {
    const elements = $(selector);
    if (elements.length > 0) {
      console.log(`✅ ${selector}: Found ${elements.length} elements`);
      elements.each((i, el) => {
        console.log(`  [${i}] Text: "${$(el).text().trim()}"`);
      });
    }
  }
}

debugPriceHTML('https://signaturesolar.com/complete-hybrid-solar-kit-12000w-output-eg4-18kpv-kit-e0006/');
