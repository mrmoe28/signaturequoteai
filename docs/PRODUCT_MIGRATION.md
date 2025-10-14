# Product Migration Guide

## ✅ Initial Seed Complete

**Date:** 2025-10-11
**Status:** ✅ 4 products seeded successfully

### Current Database State

```
Products in Database: 4
├── EG4 18kPV Hybrid Inverter ($3,299)
├── EG4 BrightMount 4-Panel Roof Racking Kit ($499)
├── EG4 LL-S-V2 48V 280Ah Server Rack Battery ($1,899)
└── MC4 Extension Cable 12 AWG - 50ft ($89)
```

## 🚀 Next Steps: Crawl Signature Solar for More Products

### Option 1: Quick Seed (Already Done)

The initial 4 products from `lib/seed/catalog.json` have been imported to your database.

```bash
# Already executed:
psql "$DATABASE_URL" -f scripts/seed-products.sql
```

### Option 2: Full Web Crawl (Recommended for Production)

To populate your database with **hundreds of products** including images from Signature Solar:

#### Prerequisites

1. **Install dependencies first:**
```bash
npm install
```

2. **Ensure environment variables are set:**
```bash
# Check .env.local has DATABASE_URL
grep DATABASE_URL .env.local
```

#### Run the Crawler

```bash
# Full crawl of all Signature Solar products
npm run crawl:start

# Or directly with TypeScript:
npx tsx scripts/run-crawler.ts
```

**What the crawler does:**
- ✅ Scrapes Signature Solar website for products
- ✅ Fetches product details (name, SKU, price, descriptions)
- ✅ Downloads product images and CDN URLs
- ✅ Respects robots.txt and rate limits
- ✅ Updates existing products automatically
- ✅ Creates price snapshots for history

#### Monitoring the Crawl

```bash
# Watch crawl progress
tail -f crawler.log

# Check database updates in real-time
watch -n 5 "psql '$DATABASE_URL' -c 'SELECT COUNT(*) FROM products'"
```

### Option 3: Test Crawler (Recommended First)

Test the crawler on a single product before full crawl:

```bash
npm run crawl:test
```

### Option 4: Specific Category Crawl

Crawl only specific product categories:

```bash
# Crawl only solar kits
npx tsx scripts/crawl-solar-kits.ts

# Crawl only EG4 products
npx tsx scripts/crawl-eg4.ts

# Crawl all categories
npx tsx scripts/crawl-all-categories.ts
```

## 📊 Verification After Migration

### Check Products Count

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_products FROM products;"
```

### View Recent Products

```bash
psql "$DATABASE_URL" -c "
  SELECT id, name, price, category, last_updated
  FROM products
  ORDER BY last_updated DESC
  LIMIT 10;
"
```

### Check Products with Images

```bash
psql "$DATABASE_URL" -c "
  SELECT
    COUNT(*) FILTER (WHERE primary_image_url IS NOT NULL) as with_images,
    COUNT(*) FILTER (WHERE primary_image_url IS NULL) as without_images,
    COUNT(*) as total
  FROM products;
"
```

### View All Categories

```bash
psql "$DATABASE_URL" -c "
  SELECT category, COUNT(*) as count
  FROM products
  GROUP BY category
  ORDER BY count DESC;
"
```

## 🔧 Manual Migration Scripts

### Seed Products (SQL)

Location: `scripts/seed-products.sql`

```bash
psql "$DATABASE_URL" -f scripts/seed-products.sql
```

### Seed Products (JavaScript)

Location: `scripts/seed.js`

```bash
node scripts/seed.js
```

Requires:
- `@neondatabase/serverless` installed
- `.env.local` with `DATABASE_URL`

### Seed Products (TypeScript)

Location: `scripts/seed.ts`

```bash
npm run db:seed
```

Requires:
- All dependencies installed
- Drizzle ORM configured

## 🖼️ Image Handling

### Image Storage Strategy

The application uses **direct CDN URLs** from Signature Solar:

```typescript
// ✅ GOOD: Store full CDN URLs
{
  primaryImageUrl: "https://cdn.signaturesolar.com/image.jpg",
  images: [
    { url: "https://cdn.signaturesolar.com/image1.jpg", altText: "..." },
    { url: "https://cdn.signaturesolar.com/image2.jpg", altText: "..." }
  ]
}
```

**Benefits:**
- No local storage needed
- Always up-to-date images
- Faster page loads
- Signature Solar handles CDN/hosting

### Verify Images Work

```bash
# Check a product's images
psql "$DATABASE_URL" -c "
  SELECT id, name, primary_image_url
  FROM products
  WHERE primary_image_url IS NOT NULL
  LIMIT 3;
"
```

Then test the URLs in your browser to ensure they load.

## 📝 Troubleshooting

### Dependencies Not Installed

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Crawler Fails to Start

```bash
# Check logs
cat crawler.log

# Test single product
npm run crawl:test

# Verify robots.txt compliance
npm run crawl:robots
```

### Products Not Showing Images

```bash
# Run image verification script
npm run verify:images

# Check for malformed URLs
npx tsx scripts/check-malformed-images.ts
```

### Rate Limiting Issues

The crawler respects rate limits automatically, but if you encounter issues:

```bash
# Test rate limiting
npm run crawl:rate-limit

# Adjust delay in lib/crawler.ts:
CRAWLER_DELAY_MS=2000  # Increase to 2 seconds
```

## 🔄 Regular Updates

### Schedule Automatic Crawls

Set up a cron job to keep products fresh:

```bash
# Add to crontab
# Run daily at 2 AM
0 2 * * * cd /path/to/project && npm run crawl:start >> /var/log/crawler.log 2>&1
```

### Manual Price Updates

```bash
# Refresh all product prices
npm run crawl:freshness

# Validate all data
npm run crawl:validate
```

## 📈 Expected Results

After running the full crawler, you should see:

- **Products:** 200-500+ products (depends on Signature Solar catalog)
- **Categories:** ~10-15 categories
- **Images:** 90%+ products with images
- **Price History:** Snapshots for price tracking
- **Crawl Jobs:** Logged in `crawl_jobs` table

## 🎯 Current Status Summary

| Item | Status | Count |
|------|--------|-------|
| Products Seeded | ✅ Complete | 4 |
| Images Imported | ⏳ Pending | 0 |
| Full Crawl Run | ⏳ Pending | - |
| Categories Populated | ✅ Complete | 4 |

## 🚀 Next Action

**Recommended:** Run the full crawler to populate with hundreds of products:

```bash
# 1. Install dependencies (required)
npm install

# 2. Run the crawler
npm run crawl:start

# 3. Monitor progress
npm run crawl:monitor

# 4. Verify results
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM products;"
```

---

**Questions?**
See `docs/CRAWLER.md` for detailed crawler configuration and `docs/TROUBLESHOOTING.md` for common issues.
