#!/usr/bin/env tsx
/**
 * Database Seeding Script
 * Seeds the database with initial product data from catalog.json
 */

import { db } from '../lib/db';
import { products, companySettings } from '../lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';
import { eq } from 'drizzle-orm';

interface CatalogProduct {
  id: string;
  name: string;
  sku?: string;
  vendor: string;
  category?: string;
  unit: string;
  price: number;
  currency: string;
  url?: string;
  lastUpdated: string;
  images?: string[];
  isActive: boolean;
}

async function seedProducts() {
  console.log('📦 Starting product seeding...\n');

  // Read catalog.json
  const catalogPath = path.join(process.cwd(), 'lib', 'seed', 'catalog.json');

  if (!fs.existsSync(catalogPath)) {
    console.error('❌ catalog.json not found at:', catalogPath);
    process.exit(1);
  }

  const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf-8')) as CatalogProduct[];
  console.log(`📚 Found ${catalogData.length} products in catalog.json\n`);

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const product of catalogData) {
    try {
      // Check if product exists
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.id, product.id))
        .limit(1);

      const productData = {
        id: product.id,
        name: product.name,
        sku: product.sku || null,
        vendor: product.vendor,
        category: product.category || null,
        unit: product.unit,
        price: product.price.toString(),
        currency: product.currency,
        url: product.url || null,
        primaryImageUrl: product.images && product.images.length > 0 ? product.images[0] : null,
        images: product.images && product.images.length > 0 ? JSON.stringify(product.images.map(url => ({ url, altText: product.name }))) : null,
        lastUpdated: new Date(product.lastUpdated),
        isActive: product.isActive ? 'true' : 'false',
      };

      if (existing.length > 0) {
        // Update existing product
        await db
          .update(products)
          .set(productData)
          .where(eq(products.id, product.id));

        console.log(`✏️  Updated: ${product.name} (${product.id})`);
        updated++;
      } else {
        // Insert new product
        await db.insert(products).values(productData);
        console.log(`✅ Inserted: ${product.name} (${product.id})`);
        inserted++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${product.name}:`, error);
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
    const existing = await db.select().from(companySettings).limit(1);

    if (existing.length === 0) {
      // Insert default company settings
      await db.insert(companySettings).values({
        companyName: 'Your Company Name',
        companyPhone: '(555) 123-4567',
        companyEmail: 'quotes@yourcompany.com',
        companyWebsite: 'https://yourcompany.com',
        defaultTerms: 'Payment due within 30 days. All sales are final.',
        defaultLeadTime: '2-4 weeks',
        quotePrefix: 'Q',
      });

      console.log('✅ Created default company settings');
      console.log('⚠️  Please update company settings in the app');
    } else {
      console.log('ℹ️  Company settings already exist');
    }
  } catch (error) {
    console.error('❌ Error setting up company settings:', error);
  }
}

async function main() {
  console.log('🌱 Database Seeding Started\n');
  console.log('=' .repeat(50));

  try {
    // Seed products
    await seedProducts();

    // Seed company settings
    await seedCompanySettings();

    console.log('\n' + '='.repeat(50));
    console.log('✨ Database seeding completed successfully!\n');

    // Show database stats
    const productCount = await db.select().from(products);
    console.log('📊 Current Database Stats:');
    console.log(`   Products: ${productCount.length}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
