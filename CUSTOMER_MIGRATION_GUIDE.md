# Customer Table Migration Guide

This guide walks you through migrating from inline customer data in quotes to a dedicated customers table.

## Overview

### What's Changing

**Before:**
- Customer information stored directly in quotes table
- Fields: `customer_company`, `customer_name`, `customer_email`, `customer_phone`, `customer_ship_to`
- Customer data duplicated across multiple quotes

**After:**
- Dedicated `customers` table with unique customer records
- Quotes reference customers via `customer_id` foreign key
- Better data normalization and customer relationship management

## Files Modified

### Schema Changes
- **`lib/db/schema.ts`** - Added `customers` table, updated `quotes` table
- **`lib/types.ts`** - Updated `Customer` and `Quote` types

### New Files Created
- **`lib/db/customer-queries.ts`** - Customer CRUD operations
- **`lib/db/queries-updated.ts`** - Updated quote queries using customer relationship
- **`scripts/migrate-customers.ts`** - Data migration script

## Migration Steps

### Step 1: Generate Drizzle Migration

Generate the database schema migration:

```bash
npm run drizzle-kit generate:pg
```

This creates migration SQL files in `lib/db/migrations/`

### Step 2: Review the Migration

Check the generated migration file to ensure it:
1. Creates the `customers` table
2. Adds `customer_id` column to `quotes`
3. Adds foreign key constraint
4. Removes old customer columns (we'll do this manually after data migration)

### Step 3: Apply Schema Migration

Apply the migration to your database:

```bash
npm run drizzle-kit push:pg
```

Or manually run the migration SQL against your database.

### Step 4: Run Data Migration

Migrate existing customer data from quotes:

```bash
npx tsx scripts/migrate-customers.ts
```

This script will:
- Extract unique customers from quotes
- Create customer records
- Update quotes with customer IDs
- Validate the migration

### Step 5: Update Application Code

Replace the old query functions with updated versions:

1. Merge `lib/db/queries-updated.ts` into `lib/db/queries.ts`
2. Update imports to include customer queries:
   ```typescript
   import { findOrCreateCustomer, getCustomerById } from './customer-queries';
   ```

### Step 6: Test the Migration

1. Start your application
2. Test creating a new quote
3. Test viewing existing quotes
4. Verify customer data displays correctly

### Step 7: Clean Up Old Columns (Optional)

Once verified, remove old customer columns from quotes:

```sql
-- Run these SQL commands manually
ALTER TABLE quotes DROP COLUMN customer_company;
ALTER TABLE quotes DROP COLUMN customer_name;
ALTER TABLE quotes DROP COLUMN customer_email;
ALTER TABLE quotes DROP COLUMN customer_phone;
ALTER TABLE quotes DROP COLUMN customer_ship_to;
DROP INDEX IF EXISTS quotes_customer_email_idx;
```

## New Features Available

### Customer Management

```typescript
import { 
  findOrCreateCustomer, 
  getCustomerById, 
  searchCustomers,
  getAllCustomers,
  updateCustomer,
  deactivateCustomer,
  getCustomerWithQuotes
} from './lib/db/customer-queries';

// Find or create customer (prevents duplicates)
const customerId = await findOrCreateCustomer({
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Acme Corp'
});

// Search customers
const results = await searchCustomers('john');

// Get customer with quote history
const { customer, quoteCount } = await getCustomerWithQuotes(customerId);
```

### Updated Quote Creation

```typescript
// Quotes now automatically handle customer relationships
const quote = await createQuote({
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp',
    phone: '555-1234'
  },
  items: [...],
  subtotal: 1000,
  total: 1000
});

// Customer is automatically found or created
// Quote is linked to customer via customer_id
```

## Benefits

1. **No Duplicates**: Customers are stored once, referenced many times
2. **Customer History**: Easy to find all quotes for a customer
3. **Better Updates**: Update customer info in one place
4. **Enhanced Fields**: Additional customer fields (address, city, state, zip, notes)
5. **Search & Filter**: Better customer search and management capabilities

## Rollback Plan

If you need to rollback:

1. Keep the old migration files
2. The migration script doesn't delete old columns
3. You can re-run the old queries if needed
4. Create a reverse migration to restore old schema

## API Changes

### Quote Creation (Before)
```typescript
// Old format
const quote = {
  customer: {
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    shipTo?: string;
  },
  items: [...],
  ...
};
```

### Quote Creation (After)
```typescript
// New format - same interface, but customer can include more fields
const quote = {
  customer: {
    id?: string;      // NEW: Optional customer ID
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    address?: string; // NEW
    city?: string;    // NEW
    state?: string;   // NEW
    zip?: string;     // NEW
    notes?: string;   // NEW
  },
  shipTo?: string,    // MOVED: Now at quote level
  items: [...],
  ...
};
```

### Quote Response (After)
```typescript
// Quotes now include full customer object
const quote = await getQuoteById(id);
// quote.customer = { id, name, email, company, phone, address, ... }
// quote.customerId = "uuid"
```

## Troubleshooting

### Issue: Migration script fails with "customer_id column doesn't exist"

**Solution**: Run the Drizzle schema migration first (Step 2) before running the data migration (Step 4).

### Issue: Some quotes don't have customer_id after migration

**Solution**: The migration script validates this and will fail with an error. Check the logs to see which quotes failed and why.

### Issue: Duplicate customers created

**Solution**: The migration script deduplicates by email or name+company. Review the deduplication logic in `scripts/migrate-customers.ts` if needed.

### Issue: Old queries still being used

**Solution**: Make sure to update `lib/db/queries.ts` with the new query functions from `lib/db/queries-updated.ts`.

## Support

If you encounter issues:
1. Check the migration logs for detailed error messages
2. Verify your database connection
3. Ensure you have backup of your database
4. Review this guide carefully

## Next Steps After Migration

1. Consider creating a customer management UI
2. Add customer search/autocomplete to quote creation
3. Build customer history views
4. Implement customer analytics
5. Add customer contact management features


