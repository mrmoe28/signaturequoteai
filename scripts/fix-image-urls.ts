import { db, sql } from '../lib/db';

async function fixImageUrls() {
  try {
    console.log('Checking for products with malformed image URLs...');

    // Query for products with image URLs containing dash before extension
    const malformedProducts = await sql`
      SELECT id, name, primary_image_url
      FROM products
      WHERE primary_image_url LIKE '%-.jpg'
         OR primary_image_url LIKE '%-.png'
         OR primary_image_url LIKE '%-.webp'
         OR primary_image_url LIKE '%2431f62671eee585%'
      LIMIT 20
    `;

    console.log(`Found ${malformedProducts.length} products with potentially malformed image URLs:`);
    console.log(JSON.stringify(malformedProducts, null, 2));

    // Also check for the specific product by ID
    const championProduct = await sql`
      SELECT id, name, primary_image_url, images
      FROM products
      WHERE id LIKE '%champion-6500-watt%'
      LIMIT 5
    `;

    console.log('\n\nChampion products:');
    console.log(JSON.stringify(championProduct, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixImageUrls();
