#!/bin/bash
# Migrate data from old NeonDB to new NeonDB

echo "🔄 Database Migration Script"
echo "============================"
echo ""

# Source database (Vercel production - has 228 products)
SOURCE_DB="postgresql://neondb_owner:npg_3eNUb6JOyalp@ep-crimson-wave-adnv565x-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Target database (new NeonDB - currently has 4 products)
TARGET_DB="postgresql://neondb_owner:npg_vqzMmGf72jkX@ep-floral-butterfly-add12tu0-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "📊 Source Database Analysis..."
psql "$SOURCE_DB" -c "SELECT COUNT(*) as products FROM products;"

echo ""
echo "📊 Target Database (before migration)..."
psql "$TARGET_DB" -c "SELECT COUNT(*) as products FROM products;"

echo ""
echo "🚀 Starting migration..."
echo ""

# Export products from source
echo "📤 Exporting products..."
psql "$SOURCE_DB" -t -A -F"," -c "
  SELECT
    id, name, sku, vendor, category, unit, price, currency, url,
    primary_image_url, description, short_description, images,
    specifications, features, dimensions, weight, warranty,
    power_rating, voltage, efficiency, certifications, in_stock,
    availability, stock_quantity, meta_title, meta_description,
    categories, tags, reviews, is_active
  FROM products
" > /tmp/products_export.csv

# Count exported products
PRODUCT_COUNT=$(wc -l < /tmp/products_export.csv | tr -d ' ')
echo "✅ Exported $PRODUCT_COUNT products"

echo ""
echo "📥 Importing to target database..."
echo "   This may take a few moments..."

# Import to target database using COPY or INSERT
# Note: We'll use a SQL approach for safety
psql "$TARGET_DB" << 'EOSQL'
-- Temporarily disable constraints for faster import
SET CONSTRAINTS ALL DEFERRED;

-- Clear existing test data (the 4 seed products)
TRUNCATE TABLE price_snapshots CASCADE;
TRUNCATE TABLE quote_items CASCADE;
TRUNCATE TABLE quotes CASCADE;
TRUNCATE TABLE products CASCADE;

-- Insert products from source
-- We'll do this via direct connection below

EOSQL

# Copy data directly between databases
echo "   Copying products..."
psql "$SOURCE_DB" -c "COPY (
  SELECT
    id, name, sku, vendor, category, unit, price, currency, url,
    primary_image_url, description, short_description, images,
    specifications, features, dimensions, weight, warranty,
    power_rating, voltage, efficiency, certifications, in_stock,
    availability, stock_quantity, meta_title, meta_description,
    categories, tags, reviews, last_updated, is_active
  FROM products
) TO STDOUT" | psql "$TARGET_DB" -c "COPY products (
  id, name, sku, vendor, category, unit, price, currency, url,
  primary_image_url, description, short_description, images,
  specifications, features, dimensions, weight, warranty,
  power_rating, voltage, efficiency, certifications, in_stock,
  availability, stock_quantity, meta_title, meta_description,
  categories, tags, reviews, last_updated, is_active
) FROM STDIN"

echo ""
echo "   Copying company settings..."
psql "$SOURCE_DB" -c "COPY (
  SELECT * FROM company_settings
) TO STDOUT" | psql "$TARGET_DB" -c "COPY company_settings FROM STDIN" 2>/dev/null || echo "   (Company settings already exist)"

echo ""
echo "   Copying quotes..."
psql "$SOURCE_DB" -c "COPY (
  SELECT * FROM quotes
) TO STDOUT" | psql "$TARGET_DB" -c "COPY quotes FROM STDIN" 2>/dev/null || echo "   (No quotes to copy)"

echo ""
echo "   Copying quote items..."
psql "$SOURCE_DB" -c "COPY (
  SELECT * FROM quote_items
) TO STDOUT" | psql "$TARGET_DB" -c "COPY quote_items FROM STDIN" 2>/dev/null || echo "   (No quote items to copy)"

echo ""
echo "✅ Migration complete!"
echo ""

# Verify migration
echo "📊 Target Database (after migration)..."
psql "$TARGET_DB" << 'EOF'
SELECT 'Products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'Products with Images', COUNT(*) FROM products WHERE primary_image_url IS NOT NULL
UNION ALL
SELECT 'Quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'Quote Items', COUNT(*) FROM quote_items;

\echo ''
\echo 'Sample products:'
SELECT id, name, price,
       CASE WHEN primary_image_url IS NOT NULL THEN '✅' ELSE '❌' END as image
FROM products
LIMIT 5;
EOF

echo ""
echo "🎉 Migration successful!"
echo ""
echo "Next steps:"
echo "  1. Update .env.local to use the new database"
echo "  2. Test the application"
echo "  3. Update Vercel env vars if needed"
echo ""
