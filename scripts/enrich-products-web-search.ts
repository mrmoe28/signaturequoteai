#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../lib/db';
import { products } from '../lib/db/schema';
import { eq, isNull, or } from 'drizzle-orm';
import { logger } from '../lib/logger';

/**
 * Extract potential model numbers from product names
 * Common patterns: EG4, 18kPV, KIT-E0006, etc.
 */
function extractModelNumbers(productName: string): string[] {
  const models: string[] = [];

  // Pattern 1: Brand models like "EG4 18kPV", "LL-S-V2"
  const brandModelPattern = /(EG4|PP|LL-S-V2|BrightMount)\s*[0-9]{1,3}[kA-Z]{0,3}/gi;
  const brandMatches = productName.match(brandModelPattern) || [];
  models.push(...brandMatches.map(m => m.replace(/\s+/g, '')));

  // Pattern 2: Alphanumeric codes like "BP3000", "J1772"
  const alphaNumericPattern = /[A-Z]{2,4}[0-9]{2,5}[A-Z]*/g;
  const alphaMatches = productName.match(alphaNumericPattern) || [];
  models.push(...alphaMatches);

  // Pattern 3: KIT codes like "KIT-E0006"
  const kitPattern = /KIT-[A-Z0-9]{4,}/gi;
  const kitMatches = productName.match(kitPattern) || [];
  models.push(...kitMatches);

  // Pattern 4: Model numbers with dashes like "LL-S-V2", "NEMA-14-50"
  const dashedPattern = /[A-Z]{2,4}-[A-Z0-9]{1,4}(-[A-Z0-9]{1,4})?/gi;
  const dashedMatches = productName.match(dashedPattern) || [];
  models.push(...dashedMatches);

  // Pattern 5: Specific wattage/voltage like "12000W", "400W", "48V" (significant values only)
  const specPattern = /[0-9]{3,5}[kKWVA]{1,2}/g;
  const specMatches = productName.match(specPattern) || [];
  models.push(...specMatches.filter(m => parseInt(m) >= 100)); // Filter out small numbers

  return Array.from(new Set(models)); // Remove duplicates
}

/**
 * Search web for product specifications using model number
 */
async function searchProductSpecs(productName: string, modelNumber: string): Promise<any> {
  try {
    const query = `${productName} ${modelNumber} specifications datasheet`;

    logger.info({ query, modelNumber }, 'Searching web for product specifications');

    // TODO: Implement actual web search using Google Custom Search API or similar
    // For now, returning a placeholder structure
    return {
      modelNumber,
      searchQuery: query,
      // These would be populated from actual search results
      manufacturer: null,
      datasheet: null,
      specifications: {},
      features: [],
    };
  } catch (error) {
    logger.error({ error, modelNumber }, 'Failed to search product specs');
    return null;
  }
}

/**
 * Enrich a single product with web search data
 */
async function enrichProduct(product: any): Promise<boolean> {
  try {
    const modelNumbers = extractModelNumbers(product.name);

    if (modelNumbers.length === 0) {
      logger.info({ productId: product.id, name: product.name }, 'No model numbers found in product name');
      return false;
    }

    logger.info({
      productId: product.id,
      name: product.name,
      modelNumbers
    }, 'Found model numbers');

    // Search for specs using the first (most likely) model number
    const primaryModel = modelNumbers[0];
    const specs = await searchProductSpecs(product.name, primaryModel);

    if (!specs) {
      return false;
    }

    // Update product with enriched data
    const updates: any = {};

    // Set SKU if not already present
    if (!product.sku && primaryModel) {
      updates.sku = primaryModel;
    }

    // Store model numbers in meta or specifications
    if (modelNumbers.length > 0) {
      const existingSpecs = product.specifications ? JSON.parse(product.specifications) : {};
      updates.specifications = JSON.stringify({
        ...existingSpecs,
        'Model Numbers': modelNumbers.join(', '),
      });
    }

    // Only update if we have changes
    if (Object.keys(updates).length > 0) {
      await db
        .update(products)
        .set(updates)
        .where(eq(products.id, product.id));

      logger.info({
        productId: product.id,
        updates
      }, 'Product enriched successfully');

      return true;
    }

    return false;
  } catch (error) {
    logger.error({ error, productId: product.id }, 'Failed to enrich product');
    return false;
  }
}

/**
 * Main enrichment process
 */
async function enrichAllProducts() {
  try {
    logger.info('Starting product enrichment with web search data');

    // Get products that need enrichment (no SKU or no specifications)
    const productsToEnrich = await db
      .select()
      .from(products)
      .where(
        or(
          isNull(products.sku),
          isNull(products.specifications)
        )
      )
      .limit(10); // Start with 10 products for testing

    logger.info({ count: productsToEnrich.length }, 'Found products to enrich');

    let enriched = 0;
    let failed = 0;

    for (const product of productsToEnrich) {
      const success = await enrichProduct(product);
      if (success) {
        enriched++;
      } else {
        failed++;
      }

      // Rate limiting - wait 2 seconds between products
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info({
      total: productsToEnrich.length,
      enriched,
      failed
    }, 'Enrichment complete');

  } catch (error) {
    logger.error({ error }, 'Product enrichment failed');
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  enrichAllProducts()
    .then(() => {
      logger.info('Product enrichment finished');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, 'Product enrichment failed');
      process.exit(1);
    });
}

export { enrichProduct, enrichAllProducts, extractModelNumbers };
