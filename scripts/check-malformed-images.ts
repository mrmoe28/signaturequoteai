import { db, sql } from '../lib/db';

async function checkMalformedImages() {
  try {
    console.log('Checking for products with malformed image URLs...\n');

    // Check for primaryImageUrl that doesn't start with /
    const malformedPrimary = await sql`
      SELECT id, name, primary_image_url
      FROM products
      WHERE primary_image_url IS NOT NULL
        AND primary_image_url NOT LIKE '/%'
      LIMIT 10
    `;

    console.log(`Found ${malformedPrimary.length} products with primaryImageUrl missing leading slash:`);
    malformedPrimary.forEach((p: any) => {
      console.log(`  - ${p.id}: "${p.primary_image_url}"`);
    });

    // Check specifically for the files we saw in 404s
    console.log('\n\nChecking for specific files from 404 errors:');
    const specificFiles = [
      'af1954111dccf9c6.png',
      '96a7b96e8ebb3466.jpg',
      'db22f4b0d2a3a747.jpg',
      'f31f4ab40f96f538.png',
      '41cedda8462947dd.png',
      'dd51ded1685725ba.jpg'
    ];

    for (const filename of specificFiles) {
      const results = await sql`
        SELECT id, name, primary_image_url, images
        FROM products
        WHERE primary_image_url LIKE ${`%${filename}%`}
           OR images LIKE ${`%${filename}%`}
        LIMIT 1
      `;

      if (results.length > 0) {
        console.log(`\nProduct with ${filename}:`);
        console.log(`  ID: ${results[0].id}`);
        console.log(`  Name: ${results[0].name}`);
        console.log(`  primaryImageUrl: ${results[0].primary_image_url}`);
        console.log(`  images: ${results[0].images?.substring(0, 200)}...`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkMalformedImages();
