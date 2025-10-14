# Customer Table - Quick Start Guide

## 🚀 Quick Implementation Steps

### 1. Apply Database Migration (2 minutes)
```bash
# Run the SQL migration
npm run db:push

# OR manually:
psql $DATABASE_URL -f lib/db/migrations/0006_add_customers_table.sql
```

### 2. Migrate Existing Data (5 minutes)
```bash
# Move customer data from quotes to customers table
npx tsx scripts/migrate-customers.ts
```

### 3. Update Application Code (10 minutes)

**In `lib/db/queries.ts`**, replace these functions with versions from `lib/db/queries-updated.ts`:

```typescript
// Add import at top
import { findOrCreateCustomer, getCustomerById } from './customer-queries';

// Replace these functions:
- createQuote()
- getQuoteById()
- getQuotes()
- updateQuote()
```

### 4. Test (5 minutes)
```bash
npm run dev
```

Test:
- ✅ Create a new quote
- ✅ View existing quotes
- ✅ Create another quote with same customer email

### 5. Done! 🎉

---

## 📁 What Was Created

### New Files (Do NOT modify these):
- ✅ `lib/db/customer-queries.ts` - Customer operations
- ✅ `lib/db/migrations/0006_add_customers_table.sql` - Database migration
- ✅ `scripts/migrate-customers.ts` - Data migration

### Reference Files (Use as guides):
- ✅ `lib/db/queries-updated.ts` - Copy functions from here to queries.ts
- ✅ `CUSTOMER_MIGRATION_GUIDE.md` - Detailed documentation
- ✅ `CUSTOMER_TABLE_IMPLEMENTATION_SUMMARY.md` - Complete overview

### Modified Files:
- ✅ `lib/db/schema.ts` - Added customers table
- ✅ `lib/types.ts` - Updated types

### File to Update Manually:
- ⚠️ `lib/db/queries.ts` - Merge functions from queries-updated.ts

---

## 🎯 Key Functions Available

### Customer Management
```typescript
import { 
  findOrCreateCustomer, 
  getCustomerById,
  searchCustomers,
  getAllCustomers,
  updateCustomer 
} from './lib/db/customer-queries';
```

### Creating Quotes (Updated)
```typescript
const quote = await createQuote({
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Acme Corp'
  },
  items: [...],
  subtotal: 1000,
  total: 1000
});
// Customer automatically created or matched!
```

---

## ⚠️ Important

1. **Backup database** before migration
2. **Run in development** first
3. **Don't drop old columns** until verified
4. Migration keeps old customer fields safe

---

## 🐛 Issues?

Check the detailed guide:
```
CUSTOMER_MIGRATION_GUIDE.md
```

---

## 📊 Expected Results

After migration:
- ✅ New `customers` table with all your customers
- ✅ Quotes linked to customers via `customer_id`
- ✅ No duplicate customers
- ✅ All existing data preserved
- ✅ New customer management features available

---

## ✨ Benefits

- 🎯 No duplicate customer data
- 📊 Customer history tracking
- 🔍 Customer search capabilities
- ✏️ Update customer info once, reflects everywhere
- 📈 Better customer relationship management

---

**Total Setup Time: ~20 minutes**

**Difficulty: Medium** (mostly automated)

**Rollback: Easy** (old data preserved)


