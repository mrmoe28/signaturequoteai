#!/usr/bin/env node
/**
 * Database Seeding Script (JavaScript version)
 * Seeds the database with initial product data from catalog.json
 */

require('dotenv/config');
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);

async function seedProducts() {
  console.log('📦 Starting product seeding...\n');

  // Read catalog.json
  const catalogPath = path.join(process.cwd(), 'lib', 'seed', 'catalog.json');

  if (!fs.existsSync(catalogPath)) {
    console.error('❌ catalog.json not found at:', catalogPath);
    process.exit(1);
  }

  const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  console.log(`📚 Found ${catalogData.length} products in catalog.json\n`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const product of catalogData) {
    try {
      // Check if product exists
      const existing = await sql`
        SELECT id FROM products WHERE id = ${product.id}
      `;

      const images = product.images && product.images.length > 0
        ? JSON.stringify(product.images.map(url => ({ url, altText: product.name })))
        : null;

      const primaryImageUrl = product.images && product.images.length > 0
        ? product.images[0]
        : null;

      if (existing.length > 0) {
        // Update existing product
        await sql`
          UPDATE products SET
            name = ${product.name},
            sku = ${product.sku || null},
            vendor = ${product.vendor},
            category = ${product.category || null},
            unit = ${product.unit},
            price = ${product.price},
            currency = ${product.currency},
            url = ${product.url || null},
            primary_image_url = ${primaryImageUrl},
            images = ${images},
            last_updated = NOW(),
            is_active = ${product.isActive ? 'true' : 'false'}
          WHERE id = ${product.id}
        `;

        console.log(`✏️  Updated: ${product.name} (${product.id})`);
        updated++;
      } else {
        // Insert new product
        await sql`
          INSERT INTO products (
            id, name, sku, vendor, category, unit, price, currency, url,
            primary_image_url, images, last_updated, is_active
          ) VALUES (
            ${product.id},
            ${product.name},
            ${product.sku || null},
            ${product.vendor},
            ${product.category || null},
            ${product.unit},
            ${product.price},
            ${product.currency},
            ${product.url || null},
            ${primaryImageUrl},
            ${images},
            NOW(),
            ${product.isActive ? 'true' : 'false'}
          )
        `;

        console.log(`✅ Inserted: ${product.name} (${product.id})`);
        inserted++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${product.name}:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Seeding Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ✏️  Updated: ${updated}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${catalogData.length}`);
}

async function seedCompanySettings() {
  console.log('\n🏢 Setting up company settings...\n');

  try {
    // Check if company settings exist
    const existing = await sql`
      SELECT id FROM company_settings LIMIT 1
    `;

    if (existing.length === 0) {
      // Insert default company settings
      await sql`
        INSERT INTO company_settings (
          company_name, company_phone, company_email, company_website,
          default_terms, default_lead_time, quote_prefix
        ) VALUES (
          'Your Company Name',
          '(555) 123-4567',
          'quotes@yourcompany.com',
          'https://yourcompany.com',
          'Payment due within 30 days. All sales are final.',
          '2-4 weeks',
          'Q'
        )
      `;

      console.log('✅ Created default company settings');
      console.log('⚠️  Please update company settings in the app');
    } else {
      console.log('ℹ️  Company settings already exist');
    }
  } catch (error) {
    console.error('❌ Error setting up company settings:', error.message);
  }
}

async function main() {
  console.log('🌱 Database Seeding Started\n');
  console.log('='.repeat(50));

  try {
    // Test connection
    await sql`SELECT 1`;
    console.log('✅ Database connection successful\n');

    // Seed products
    await seedProducts();

    // Seed company settings
    await seedCompanySettings();

    console.log('\n' + '='.repeat(50));
    console.log('✨ Database seeding completed successfully!\n');

    // Show database stats
    const productCount = await sql`SELECT COUNT(*) as count FROM products`;
    const quoteCount = await sql`SELECT COUNT(*) as count FROM quotes`;

    console.log('📊 Current Database Stats:');
    console.log(`   Products: ${productCount[0].count}`);
    console.log(`   Quotes: ${quoteCount[0].count}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
