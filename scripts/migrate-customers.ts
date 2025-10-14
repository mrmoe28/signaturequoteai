/**
 * Migration script to move customer data from quotes table to separate customers table
 * 
 * This script:
 * 1. Extracts unique customers from existing quotes
 * 2. Creates customer records in the new customers table
 * 3. Updates quotes to reference customer IDs
 * 4. Validates the migration
 * 
 * Run this AFTER applying the Drizzle schema migration
 */

import { db, sql } from '../lib/db/index';
import { customers, quotes } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { createLogger } from '../lib/logger';

const logger = createLogger('customer-migration');

interface OldQuoteCustomerData {
  quoteId: string;
  customerCompany: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerShipTo: string | null;
}

interface CustomerMapping {
  tempId: string;
  customerId: string;
  name: string;
  email: string | null;
  company: string | null;
}

async function migrateCustomers() {
  logger.info('Starting customer migration...');
  
  try {
    // Step 1: Check if we need to migrate (check if old columns exist)
    logger.info('Checking if migration is needed...');
    
    const checkResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'quotes' 
      AND column_name = 'customer_name'
    `;
    
    if (checkResult.rows.length === 0) {
      logger.info('Migration already completed or old columns do not exist');
      return;
    }
    
    // Step 2: Extract all unique customers from quotes
    logger.info('Extracting customer data from quotes...');
    
    const quotesWithCustomers = await sql<OldQuoteCustomerData>`
      SELECT 
        id as "quoteId",
        customer_company as "customerCompany",
        customer_name as "customerName",
        customer_email as "customerEmail",
        customer_phone as "customerPhone",
        customer_ship_to as "customerShipTo"
      FROM quotes
      WHERE deleted_at IS NULL
      AND customer_name IS NOT NULL
      ORDER BY created_at ASC
    `;
    
    logger.info({ count: quotesWithCustomers.rows.length }, 'Found quotes with customer data');
    
    if (quotesWithCustomers.rows.length === 0) {
      logger.info('No customer data to migrate');
      return;
    }
    
    // Step 3: Deduplicate customers based on email or name+company
    const customerMap = new Map<string, { 
      quotes: string[];
      data: OldQuoteCustomerData;
    }>();
    
    for (const row of quotesWithCustomers.rows) {
      // Create a unique key for deduplication
      // Use email if available, otherwise use name+company combination
      let key: string;
      if (row.customerEmail) {
        key = `email:${row.customerEmail.toLowerCase()}`;
      } else if (row.customerCompany) {
        key = `name-company:${row.customerName.toLowerCase()}:${row.customerCompany.toLowerCase()}`;
      } else {
        key = `name:${row.customerName.toLowerCase()}`;
      }
      
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          quotes: [row.quoteId],
          data: row,
        });
      } else {
        const existing = customerMap.get(key)!;
        existing.quotes.push(row.quoteId);
        
        // Update customer data with most complete information
        if (!existing.data.customerEmail && row.customerEmail) {
          existing.data.customerEmail = row.customerEmail;
        }
        if (!existing.data.customerPhone && row.customerPhone) {
          existing.data.customerPhone = row.customerPhone;
        }
        if (!existing.data.customerCompany && row.customerCompany) {
          existing.data.customerCompany = row.customerCompany;
        }
      }
    }
    
    logger.info({ 
      uniqueCustomers: customerMap.size,
      totalQuotes: quotesWithCustomers.rows.length 
    }, 'Deduplicated customers');
    
    // Step 4: Create customer records
    logger.info('Creating customer records...');
    
    const customerMappings: CustomerMapping[] = [];
    let createdCount = 0;
    
    for (const [key, { quotes: quoteIds, data }] of customerMap.entries()) {
      try {
        // Parse ship-to address if available (use first line as address)
        let address = null;
        let city = null;
        let state = null;
        let zip = null;
        
        if (data.customerShipTo) {
          const lines = data.customerShipTo.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length > 0) address = lines[0];
          if (lines.length > 1) {
            // Try to parse "City, ST ZIP" format
            const cityStateZip = lines[lines.length - 1];
            const match = cityStateZip.match(/^(.+),\s*([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
            if (match) {
              city = match[1];
              state = match[2];
              zip = match[3];
            }
          }
        }
        
        const newCustomer = await db
          .insert(customers)
          .values({
            company: data.customerCompany || null,
            name: data.customerName,
            email: data.customerEmail || null,
            phone: data.customerPhone || null,
            address,
            city,
            state,
            zip,
            country: 'USA',
            notes: data.customerShipTo || null,
            isActive: 'true',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
        customerMappings.push({
          tempId: key,
          customerId: newCustomer[0].id,
          name: data.customerName,
          email: data.customerEmail,
          company: data.customerCompany,
        });
        
        // Update all quotes for this customer
        for (const quoteId of quoteIds) {
          await db
            .update(quotes)
            .set({ 
              customerId: newCustomer[0].id,
              shipTo: data.customerShipTo || null,
              updatedAt: new Date(),
            })
            .where(eq(quotes.id, quoteId));
        }
        
        createdCount++;
        
        if (createdCount % 10 === 0) {
          logger.info({ createdCount, total: customerMap.size }, 'Migration progress');
        }
      } catch (error) {
        logger.error({ error, key, data }, 'Error creating customer');
        throw error;
      }
    }
    
    logger.info({ createdCount }, 'Customer records created');
    
    // Step 5: Validate migration
    logger.info('Validating migration...');
    
    const quotesWithoutCustomer = await sql`
      SELECT COUNT(*) as count
      FROM quotes
      WHERE deleted_at IS NULL
      AND customer_id IS NULL
    `;
    
    const unmappedCount = Number(quotesWithoutCustomer.rows[0]?.count || 0);
    
    if (unmappedCount > 0) {
      logger.error({ unmappedCount }, 'Some quotes do not have customer_id assigned');
      throw new Error(`Migration incomplete: ${unmappedCount} quotes without customer_id`);
    }
    
    logger.info('✅ Migration validation passed');
    
    // Step 6: Display summary
    logger.info({
      uniqueCustomers: createdCount,
      quotesUpdated: quotesWithCustomers.rows.length,
      mappings: customerMappings.slice(0, 5),
    }, '🎉 Customer migration completed successfully');
    
    logger.info('');
    logger.info('Next steps:');
    logger.info('1. Verify the migration by checking a few quotes in the UI');
    logger.info('2. Once verified, run the following SQL to drop old columns:');
    logger.info('   ALTER TABLE quotes DROP COLUMN customer_company;');
    logger.info('   ALTER TABLE quotes DROP COLUMN customer_name;');
    logger.info('   ALTER TABLE quotes DROP COLUMN customer_email;');
    logger.info('   ALTER TABLE quotes DROP COLUMN customer_phone;');
    logger.info('   ALTER TABLE quotes DROP COLUMN customer_ship_to;');
    logger.info('   DROP INDEX IF EXISTS quotes_customer_email_idx;');
    
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCustomers()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, 'Migration script failed');
      process.exit(1);
    });
}

export { migrateCustomers };


