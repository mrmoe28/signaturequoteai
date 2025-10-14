# Crawler Setup & Troubleshooting

## 🚨 Current Issue: NPM Install Failing

We're encountering an npm cache permission issue. Here are the solutions:

---

## ✅ Solution 1: Fix NPM Cache (Recommended)

Run this command in your terminal (you'll be prompted for password):

```bash
sudo chown -R $(whoami) "$HOME/.npm"
```

Then retry:

```bash
cd ~/Desktop/signaturequoteai-main
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ Solution 2: Use Alternative Package Manager

### Using Yarn

```bash
# Install Yarn if not installed
npm install -g yarn

# Install dependencies
yarn install

# Run crawler
yarn crawl:start
```

### Using pnpm

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install dependencies
pnpm install

# Run crawler
pnpm crawl:start
```

---

## ✅ Solution 3: Manual Product Addition (No Dependencies Needed)

You can add products manually using SQL without installing dependencies:

### Add Single Product

```bash
psql "$DATABASE_URL" << 'EOF'
INSERT INTO products (
  id, name, sku, vendor, category, unit, price, currency, url,
  primary_image_url, last_updated, is_active
) VALUES (
  'new-product-id',
  'Product Name',
  'SKU-123',
  'SignatureSolar',
  'Category',
  'ea',
  999.00,
  'USD',
  'https://signaturesolar.com/products/product-url',
  'https://cdn.signaturesolar.com/image.jpg',
  NOW(),
  'true'
) ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  last_updated = NOW();
EOF
```

### Batch Add Products

Create a file `my-products.sql` with multiple products:

```sql
INSERT INTO products (id, name, sku, vendor, category, unit, price, currency, url, primary_image_url, last_updated, is_active) VALUES
('product-1', 'Product 1', 'SKU-1', 'SignatureSolar', 'Inverters', 'ea', 1999, 'USD', 'https://...', 'https://cdn...', NOW(), 'true'),
('product-2', 'Product 2', 'SKU-2', 'SignatureSolar', 'Batteries', 'ea', 2999, 'USD', 'https://...', 'https://cdn...', NOW(), 'true')
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  last_updated = NOW();
```

Then run:

```bash
psql "$DATABASE_URL" -f my-products.sql
```

---

## 🎯 What the Crawler Does

Once dependencies are installed, the crawler will:

1. **Scrapes Signature Solar website** for products
2. **Extracts product details:**
   - Name, SKU, Price
   - Descriptions, Specifications
   - **Image CDN URLs** (not downloads!)
3. **Stores in NeonDB:**
   - Creates new products
   - Updates existing products
   - Tracks price history
4. **Respects best practices:**
   - Rate limiting (1-2 seconds between requests)
   - robots.txt compliance
   - Error handling and retries

---

## 📊 Current Database State

You already have:

```
✅ 4 Products seeded
✅ All database tables created
✅ Company settings configured
⏳ Images: Need crawler or manual addition
```

View current products:

```bash
psql "$DATABASE_URL" -c "SELECT id, name, price, category FROM products;"
```

---

## 🔧 Alternative: Test Your App Without Crawler

You can test the application with the 4 existing products:

```bash
# If dependencies were installed:
npm run dev

# Visit:
# - http://localhost:3000/products (view products)
# - http://localhost:3000/quotes/new (create quotes)
```

---

## 📝 Manual Image Addition

To add images to existing products without the crawler:

```bash
psql "$DATABASE_URL" << 'EOF'
UPDATE products SET
  primary_image_url = 'https://cdn.signaturesolar.com/eg4-18kpv-front.jpg',
  images = '[
    {"url": "https://cdn.signaturesolar.com/eg4-18kpv-front.jpg", "altText": "Front view"},
    {"url": "https://cdn.signaturesolar.com/eg4-18kpv-side.jpg", "altText": "Side view"}
  ]'
WHERE id = 'eg4-18kpv';
EOF
```

---

## 🚀 Once Dependencies Install Successfully

When npm install completes, run:

```bash
# Test crawler on single product
npm run crawl:test

# Run full crawl
npm run crawl:start

# Monitor progress
tail -f crawler.log

# Check results
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) as total,
         COUNT(*) FILTER (WHERE primary_image_url IS NOT NULL) as with_images
  FROM products;
"
```

---

## 💡 Why Dependencies Are Needed

The crawler requires these packages:

- **playwright** - Headless browser for JavaScript-heavy pages
- **cheerio** - HTML parsing
- **@neondatabase/serverless** - Database connectivity
- **tsx** - TypeScript execution

Without them, the automated crawler won't work, but you can still:
- Add products manually via SQL
- Use the app with existing 4 products
- Build quotes with current data

---

## 📞 Need Help?

If npm install continues to fail:

1. **Check Node version:**
   ```bash
   node --version  # Should be v18+ or v20+
   ```

2. **Try clearing everything:**
   ```bash
   rm -rf node_modules package-lock.json ~/.npm/_cacache
   npm install
   ```

3. **Use alternative package manager** (Yarn or pnpm)

4. **Contact support** with error logs from:
   ```bash
   cat ~/.npm/_logs/*-debug*.log | tail -100
   ```

---

## ✅ What's Working Now

Even without the crawler:

- ✅ Database fully configured
- ✅ 4 products available
- ✅ Can create quotes manually
- ✅ All migrations applied
- ✅ Best practices documented

**The app is functional** - the crawler just adds more products automatically!

---

## 📚 Documentation

- **Image Best Practices:** `docs/IMAGE_BEST_PRACTICES.md` ⭐ NEW
- **Product Migration:** `docs/PRODUCT_MIGRATION.md`
- **Database Setup:** `docs/DATABASE_SETUP.md`
- **Crawler Details:** `docs/CRAWLER.md`

---

**Next Action:** Fix npm cache permissions and retry installation, or use manual product addition for now.
