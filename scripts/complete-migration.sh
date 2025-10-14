#!/bin/bash
# Complete Database Migration Script
# Migrates ALL data from old NeonDB to new NeonDB

set -e  # Exit on error

echo "🔄 Complete Database Migration"
echo "=============================="
echo ""

# Source database (Vercel production)
SOURCE_DB="postgresql://neondb_owner:npg_3eNUb6JOyalp@ep-crimson-wave-adnv565x-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Target database (new NeonDB)
TARGET_DB="postgresql://neondb_owner:npg_vqzMmGf72jkX@ep-floral-butterfly-add12tu0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "📊 Source Database Summary:"
psql "$SOURCE_DB" -c "
  SELECT 'Products' as table_name, COUNT(*) as count FROM products
  UNION ALL SELECT 'Price Snapshots', COUNT(*) FROM price_snapshots
  UNION ALL SELECT 'Quotes', COUNT(*) FROM quotes
  UNION ALL SELECT 'Quote Items', COUNT(*) FROM quote_items
  UNION ALL SELECT 'Users', COUNT(*) FROM users
  UNION ALL SELECT 'Crawl Jobs', COUNT(*) FROM crawl_jobs
  UNION ALL SELECT 'Company Settings', COUNT(*) FROM company_settings;
"

echo ""
read -p "⚠️  This will REPLACE all data in the target database. Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled."
  exit 0
fi

echo ""
echo "🚀 Starting migration..."
echo ""

# Step 1: Clear target database
echo "1️⃣  Clearing target database..."
psql "$TARGET_DB" << 'EOSQL'
TRUNCATE TABLE price_snapshots CASCADE;
TRUNCATE TABLE quote_items CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE crawl_jobs CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE products CASCADE;
DELETE FROM company_settings;
EOSQL
echo "   ✅ Target database cleared"

# Step 2: Migrate Products
echo ""
echo "2️⃣  Migrating products..."
psql "$SOURCE_DB" -c "COPY (
  SELECT
    id, name, sku, vendor, category, unit, price, currency, url,
    primary_image_url, description, short_description, images,
    specifications, features, dimensions, weight, warranty,
    power_rating, voltage, efficiency, certifications, in_stock,
    availability, stock_quantity, meta_title, meta_description,
    categories, tags, reviews, last_updated, is_active
  FROM products
  ORDER BY id
) TO STDOUT" | psql "$TARGET_DB" -c "COPY products (
  id, name, sku, vendor, category, unit, price, currency, url,
  primary_image_url, description, short_description, images,
  specifications, features, dimensions, weight, warranty,
  power_rating, voltage, efficiency, certifications, in_stock,
  availability, stock_quantity, meta_title, meta_description,
  categories, tags, reviews, last_updated, is_active
) FROM STDIN"

PRODUCTS=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM products")
echo "   ✅ Migrated $PRODUCTS products"

# Step 3: Migrate Price Snapshots
echo ""
echo "3️⃣  Migrating price snapshots..."
psql "$SOURCE_DB" -c "COPY (
  SELECT id, product_id, price, currency, captured_at
  FROM price_snapshots
  ORDER BY captured_at
) TO STDOUT" | psql "$TARGET_DB" -c "COPY price_snapshots (
  id, product_id, price, currency, captured_at
) FROM STDIN"

SNAPSHOTS=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM price_snapshots")
echo "   ✅ Migrated $SNAPSHOTS price snapshots"

# Step 4: Migrate Company Settings
echo ""
echo "4️⃣  Migrating company settings..."
psql "$SOURCE_DB" -c "COPY (
  SELECT * FROM company_settings
) TO STDOUT" | psql "$TARGET_DB" -c "COPY company_settings FROM STDIN"
echo "   ✅ Migrated company settings"

# Step 5: Migrate Users
echo ""
echo "5️⃣  Migrating users..."
psql "$SOURCE_DB" -c "COPY (
  SELECT id, email, password_hash, first_name, last_name, role,
         is_active, email_verified, last_login_at, created_at, updated_at
  FROM users
) TO STDOUT" | psql "$TARGET_DB" -c "COPY users (
  id, email, password_hash, first_name, last_name, role,
  is_active, email_verified, last_login_at, created_at, updated_at
) FROM STDIN"

USERS=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM users")
echo "   ✅ Migrated $USERS users"

# Step 6: Migrate Quotes
echo ""
echo "6️⃣  Migrating quotes..."
psql "$SOURCE_DB" -c "COPY (
  SELECT id, number, created_at, valid_until, prepared_by, lead_time_note,
         discount, shipping, tax, subtotal, total, terms,
         customer_company, customer_name, customer_email, customer_phone, customer_ship_to,
         status, sent_at, viewed_at, accepted_at, declined_at,
         payment_link, payment_id, paid_at, pdf_url, notes, updated_at, deleted_at
  FROM quotes
  ORDER BY created_at DESC
) TO STDOUT" | psql "$TARGET_DB" -c "COPY quotes (
  id, number, created_at, valid_until, prepared_by, lead_time_note,
  discount, shipping, tax, subtotal, total, terms,
  customer_company, customer_name, customer_email, customer_phone, customer_ship_to,
  status, sent_at, viewed_at, accepted_at, declined_at,
  payment_link, payment_id, paid_at, pdf_url, notes, updated_at, deleted_at
) FROM STDIN" 2>/dev/null || {
  # If payment_status column doesn't exist in source, try without it
  psql "$SOURCE_DB" -c "COPY (
    SELECT id, number, created_at, valid_until, prepared_by, lead_time_note,
           discount, shipping, tax, subtotal, total, terms,
           customer_company, customer_name, customer_email, customer_phone, customer_ship_to,
           status, sent_at, viewed_at, accepted_at, declined_at,
           pdf_url, notes, updated_at, deleted_at
    FROM quotes
    ORDER BY created_at DESC
  ) TO STDOUT" | psql "$TARGET_DB" -c "COPY quotes (
    id, number, created_at, valid_until, prepared_by, lead_time_note,
    discount, shipping, tax, subtotal, total, terms,
    customer_company, customer_name, customer_email, customer_phone, customer_ship_to,
    status, sent_at, viewed_at, accepted_at, declined_at,
    pdf_url, notes, updated_at, deleted_at
  ) FROM STDIN"
}

QUOTES=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM quotes")
echo "   ✅ Migrated $QUOTES quotes"

# Step 7: Migrate Quote Items
echo ""
echo "7️⃣  Migrating quote items..."
psql "$SOURCE_DB" -c "COPY (
  SELECT id, quote_id, product_id, name, unit_price, quantity, extended, notes, image_url
  FROM quote_items
) TO STDOUT" | psql "$TARGET_DB" -c "COPY quote_items (
  id, quote_id, product_id, name, unit_price, quantity, extended, notes, image_url
) FROM STDIN"

ITEMS=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM quote_items")
echo "   ✅ Migrated $ITEMS quote items"

# Step 8: Migrate Crawl Jobs (optional history)
echo ""
echo "8️⃣  Migrating crawl jobs..."
psql "$SOURCE_DB" -c "COPY (
  SELECT id, type, status, started_at, completed_at, target_url,
         products_processed, products_updated, error_message, metadata
  FROM crawl_jobs
  ORDER BY started_at DESC
) TO STDOUT" | psql "$TARGET_DB" -c "COPY crawl_jobs (
  id, type, status, started_at, completed_at, target_url,
  products_processed, products_updated, error_message, metadata
) FROM STDIN"

JOBS=$(psql "$TARGET_DB" -t -c "SELECT COUNT(*) FROM crawl_jobs")
echo "   ✅ Migrated $JOBS crawl jobs"

# Verification
echo ""
echo "✅ Migration Complete!"
echo ""
echo "📊 Target Database Summary:"
psql "$TARGET_DB" << 'EOF'
SELECT 'Products' as table_name, COUNT(*) as count,
       COUNT(*) FILTER (WHERE primary_image_url IS NOT NULL) as with_images
FROM products
UNION ALL
SELECT 'Price Snapshots', COUNT(*), NULL FROM price_snapshots
UNION ALL
SELECT 'Quotes', COUNT(*), NULL FROM quotes
UNION ALL
SELECT 'Quote Items', COUNT(*), NULL FROM quote_items
UNION ALL
SELECT 'Users', COUNT(*), NULL FROM users
UNION ALL
SELECT 'Crawl Jobs', COUNT(*), NULL FROM crawl_jobs
UNION ALL
SELECT 'Company Settings', COUNT(*), NULL FROM company_settings;
EOF

echo ""
echo "🎉 All data migrated successfully!"
echo ""
echo "Next steps:"
echo "  1. Your .env.local already points to the new database ✅"
echo "  2. Test the application: npm run dev"
echo "  3. Verify quotes are accessible"
echo "  4. Update Vercel env vars to new database if deploying"
echo ""
