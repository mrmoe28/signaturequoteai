# Database Setup Guide

## Overview

SignatureQuoteAI uses **NeonDB** (PostgreSQL) as its database provider, with **Drizzle ORM** for schema management and queries.

## Database Connection

### Connection String Format
```
postgresql://[user]:[password]@[host]/[database]?sslmode=require&channel_binding=require
```

### Environment Variables

The database connection is configured via the `DATABASE_URL` environment variable in `.env.local`:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_vqzMmGf72jkX@ep-floral-butterfly-add12tu0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Database Schema

The database consists of 8 main tables:

### Core Tables

1. **products** - Product catalog from Signature Solar
   - id (text, primary key)
   - name, sku, vendor, category
   - price, currency, unit
   - url, primary_image_url
   - description, specifications, features
   - Enhanced metadata (dimensions, weight, warranty, etc.)
   - lastUpdated, isActive

2. **price_snapshots** - Historical price tracking
   - id (uuid, primary key)
   - product_id (foreign key → products)
   - price, currency
   - captured_at

3. **quotes** - Customer quotes
   - id (uuid, primary key)
   - number, created_at, valid_until
   - customer info (company, name, email, phone, ship_to)
   - pricing (subtotal, discount, shipping, tax, total)
   - status, payment tracking
   - pdf_url, notes

4. **quote_items** - Line items in quotes
   - id (uuid, primary key)
   - quote_id (foreign key → quotes)
   - product_id (foreign key → products)
   - name, unit_price, quantity, extended
   - notes, image_url

### Supporting Tables

5. **users** - User accounts
   - id (uuid, primary key)
   - email (unique), password_hash
   - first_name, last_name
   - role (admin/user), is_active
   - email_verified, last_login_at
   - created_at, updated_at

6. **sessions** - User sessions
   - id (uuid, primary key)
   - user_id (foreign key → users)
   - token (unique), expires_at
   - ip_address, user_agent
   - created_at

7. **crawl_jobs** - Web scraping job tracking
   - id (uuid, primary key)
   - type (full/category/product), status
   - started_at, completed_at
   - target_url, products_processed, products_updated
   - error_message, metadata

8. **company_settings** - Company/app settings
   - id (uuid, primary key)
   - company information (name, logo, address, etc.)
   - default_terms, default_lead_time
   - quote_prefix
   - created_at, updated_at

## Setup Steps

### 1. Initial Setup (Completed)

```bash
# Connection string stored in .env.local
DATABASE_URL=postgresql://...

# All tables created and indexed
✅ 8 tables created
✅ All foreign keys configured
✅ All indexes created for performance
```

### 2. Verify Setup

Run the verification script:
```bash
./verify-db-setup.sh
```

Expected output:
```
✅ .env.local file exists
✅ DATABASE_URL is configured
✅ Database connection successful
📊 Found 8 tables in the database
```

### 3. Test Database Connection

Using psql:
```bash
psql "$DATABASE_URL" -c "SELECT current_database(), current_user;"
```

Using the project code:
```bash
npm run db:studio
```

## Drizzle ORM Configuration

### Configuration File

`drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### Schema Location

- Schema definition: `lib/db/schema.ts`
- Database client: `lib/db/index.ts`
- Queries: `lib/db/queries.ts`, `lib/db/user-queries.ts`
- Migrations: `lib/db/migrations/`

## Available Scripts

```bash
# Generate new migrations from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema changes directly (development)
npm run db:push

# Open Drizzle Studio (visual DB editor)
npm run db:studio

# Seed database with sample data
npm run db:seed

# Reset database
npm run db:reset

# Drop all tables
npm run db:drop
```

## Database Access in Code

### Import the database client

```typescript
import { db } from '@/lib/db';
import { products, quotes, quoteItems } from '@/lib/db/schema';
```

### Example Queries

```typescript
// Get all products
const allProducts = await db.select().from(products);

// Get product by ID
const product = await db
  .select()
  .from(products)
  .where(eq(products.id, productId));

// Create a quote
const [newQuote] = await db
  .insert(quotes)
  .values({
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    subtotal: '1000.00',
    total: '1000.00',
  })
  .returning();
```

## Connection Details

- **Database**: neondb
- **User**: neondb_owner
- **Host**: ep-floral-butterfly-add12tu0-pooler.c-2.us-east-1.aws.neon.tech
- **Port**: 5432 (default)
- **SSL Mode**: require
- **Channel Binding**: require

## Security Notes

⚠️ **Important Security Practices**:

1. ✅ Database credentials are stored in `.env.local` (gitignored)
2. ✅ `.env.example` contains template without real credentials
3. ✅ SSL/TLS encryption enabled for all connections
4. ⚠️ Never commit `.env.local` to version control
5. ⚠️ Rotate credentials if accidentally exposed

## Troubleshooting

### Connection Issues

If you encounter connection errors:

1. Verify `.env.local` exists and contains `DATABASE_URL`
2. Check the connection string format is correct
3. Ensure NeonDB instance is active (not paused)
4. Verify network connectivity

### Schema Sync Issues

If schema is out of sync:

```bash
# Generate new migration from schema changes
npm run db:generate

# Apply the migration
npm run db:migrate

# Or push directly (development only)
npm run db:push
```

### Viewing Database

**Option 1: Drizzle Studio**
```bash
npm run db:studio
# Opens at https://local.drizzle.studio
```

**Option 2: psql CLI**
```bash
psql "$DATABASE_URL"
```

**Option 3: Neon Console**
Visit: https://console.neon.tech

## Next Steps

1. ✅ Database connection configured
2. ✅ Schema created (8 tables)
3. ⏳ Seed sample data: `npm run db:seed`
4. ⏳ Start development: `npm run dev`
5. ⏳ Test database queries in the app

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [NeonDB Documentation](https://neon.tech/docs)
- [Project Schema Details](../lib/db/schema.ts)
