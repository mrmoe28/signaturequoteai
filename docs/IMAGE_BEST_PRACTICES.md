# Product Images: Vercel + NeonDB Best Practices

## 🎯 Overview

This guide covers **production-ready** best practices for handling product images in a Next.js app deployed on Vercel with NeonDB database.

---

## 📊 Architecture: CDN-First Approach

### ✅ Recommended: External CDN URLs (Current Approach)

**Store remote CDN URLs** in your NeonDB database, not local files.

```typescript
// Database schema (lib/db/schema.ts)
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  primaryImageUrl: text('primary_image_url'),  // Full CDN URL
  images: text('images'),  // JSON array of image objects
  // ... other fields
});

// Example data structure
{
  primaryImageUrl: "https://cdn.signaturesolar.com/products/eg4-18kpv-front.jpg",
  images: JSON.stringify([
    { url: "https://cdn.signaturesolar.com/products/eg4-18kpv-front.jpg", altText: "Front view" },
    { url: "https://cdn.signaturesolar.com/products/eg4-18kpv-side.jpg", altText: "Side view" },
    { url: "https://cdn.signaturesolar.com/products/eg4-18kpv-specs.jpg", altText: "Specifications" }
  ])
}
```

**Why This Approach:**
- ✅ No storage costs
- ✅ Images served from vendor's CDN (faster)
- ✅ Always up-to-date
- ✅ Leverages existing infrastructure
- ✅ No Vercel bandwidth limits concern
- ✅ Automatic image optimization by vendor

---

## 🚀 Implementation: Next.js Image Component

### Using next/image with External URLs

```typescript
// components/ProductCard.tsx
import Image from 'next/image';

export default function ProductCard({ product }) {
  const imageSrc = product.images?.[0]?.url
    || product.primaryImageUrl
    || '/images/placeholder.svg';

  return (
    <div className="product-card">
      <Image
        src={imageSrc}
        alt={product.name}
        width={400}
        height={400}
        className="product-image"
        placeholder="blur"
        blurDataURL="/images/placeholder.svg"
        onError={(e) => {
          // Fallback to placeholder on error
          const img = e.currentTarget as HTMLImageElement;
          if (!img.src.endsWith('/images/placeholder.svg')) {
            img.src = '/images/placeholder.svg';
          }
        }}
      />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </div>
  );
}
```

### Configure next.config.mjs for External Images

```javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.signaturesolar.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.signaturesolar.com',
        pathname: '/**',
      },
      // Add other image CDNs as needed
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // Enable image optimization
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
```

---

## 🗄️ Database Best Practices

### 1. Store Full URLs, Not Relative Paths

```typescript
// ✅ GOOD
primaryImageUrl: "https://cdn.signaturesolar.com/products/image.jpg"

// ❌ BAD
primaryImageUrl: "/images/product.jpg"  // Don't store local paths
primaryImageUrl: "product.jpg"           // Don't store just filename
```

### 2. Use JSON for Multiple Images

```typescript
// Database column: images (text type)
// Store as JSON string
const imagesData = JSON.stringify([
  {
    url: "https://cdn.signaturesolar.com/product-1.jpg",
    altText: "Front view",
    order: 1
  },
  {
    url: "https://cdn.signaturesolar.com/product-2.jpg",
    altText: "Side view",
    order: 2
  }
]);

// Insert
await db.insert(products).values({
  id: 'product-1',
  name: 'Product Name',
  primaryImageUrl: 'https://cdn.signaturesolar.com/product-1.jpg',
  images: imagesData,
});

// Query and parse
const product = await db.select().from(products).where(eq(products.id, 'product-1'));
const images = product[0].images ? JSON.parse(product[0].images) : [];
```

### 3. Add Image Metadata

```typescript
interface ProductImage {
  url: string;
  altText: string;
  width?: number;
  height?: number;
  order?: number;
  type?: 'thumbnail' | 'detail' | 'lifestyle';
}
```

---

## 🎨 Vercel Deployment Optimization

### 1. Enable Image Optimization

Vercel automatically optimizes images served through `next/image`:

- ✅ Automatic WebP/AVIF conversion
- ✅ Responsive image sizes
- ✅ Lazy loading
- ✅ Cache optimization

**No extra configuration needed!** Just use `next/image`.

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_CDN_URL=https://cdn.signaturesolar.com
NEXT_PUBLIC_FALLBACK_IMAGE=/images/placeholder.svg
```

```typescript
// lib/utils/images.ts
export function getProductImageUrl(product: Product): string {
  return product.primaryImageUrl
    || product.images?.[0]?.url
    || process.env.NEXT_PUBLIC_FALLBACK_IMAGE
    || '/images/placeholder.svg';
}
```

### 3. Add Placeholder Images

Store local placeholders in `/public/images/`:

```
public/
├── images/
│   ├── placeholder.svg          # Default placeholder
│   ├── product-placeholder.png  # Product-specific
│   └── loading.gif              # Loading state
└── logo.svg
```

---

## 🔄 Crawler Implementation

### Fetching Images from Source

```typescript
// lib/crawler.ts
import * as cheerio from 'cheerio';

export async function scrapeProduct(url: string) {
  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract image URLs from product page
  const images = [];

  // Method 1: From image tags
  $('.product-images img').each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && src.startsWith('http')) {
      images.push({
        url: src,
        altText: $(el).attr('alt') || `Product image ${i + 1}`,
        order: i
      });
    }
  });

  // Method 2: From JSON-LD structured data
  const jsonLd = $('script[type="application/ld+json"]').html();
  if (jsonLd) {
    const data = JSON.parse(jsonLd);
    if (data.image) {
      if (Array.isArray(data.image)) {
        data.image.forEach((url, i) => images.push({ url, altText: `Image ${i}`, order: i }));
      } else {
        images.push({ url: data.image, altText: 'Product image', order: 0 });
      }
    }
  }

  return {
    id: extractId(url),
    name: $('.product-title').text().trim(),
    price: parsePrice($('.product-price').text()),
    primaryImageUrl: images[0]?.url || null,
    images: JSON.stringify(images),
  };
}
```

### Saving to Database

```typescript
// Save scraped product
await db.insert(products).values({
  id: scrapedProduct.id,
  name: scrapedProduct.name,
  price: scrapedProduct.price.toString(),
  primaryImageUrl: scrapedProduct.primaryImageUrl,
  images: scrapedProduct.images,
  lastUpdated: new Date(),
})
.onConflictDoUpdate({
  target: products.id,
  set: {
    primaryImageUrl: scrapedProduct.primaryImageUrl,
    images: scrapedProduct.images,
    lastUpdated: new Date(),
  }
});
```

---

## 🛡️ Error Handling & Fallbacks

### Complete Error Handling Pattern

```typescript
// components/ProductImage.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProductImageProps {
  product: {
    name: string;
    primaryImageUrl?: string | null;
    images?: string | null;
  };
  width?: number;
  height?: number;
}

export default function ProductImage({
  product,
  width = 400,
  height = 400
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(() => {
    // Parse images JSON
    let images = [];
    if (product.images) {
      try {
        images = JSON.parse(product.images);
      } catch (e) {
        console.error('Failed to parse images:', e);
      }
    }

    // Priority: images array > primaryImageUrl > placeholder
    return images[0]?.url || product.primaryImageUrl || '/images/placeholder.svg';
  });

  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative">
      <Image
        src={imgSrc}
        alt={product.name}
        width={width}
        height={height}
        className="object-cover rounded"
        onError={() => {
          if (!hasError) {
            setHasError(true);
            setImgSrc('/images/placeholder.svg');
          }
        }}
      />
      {hasError && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-xs px-2 py-1 rounded">
          Image unavailable
        </div>
      )}
    </div>
  );
}
```

---

## 📈 Performance Optimization

### 1. Lazy Load Images

```typescript
// Automatic with next/image
<Image
  src={imageSrc}
  alt={alt}
  loading="lazy"  // Default behavior
  width={400}
  height={400}
/>
```

### 2. Priority Images (Above the Fold)

```typescript
// First product in list or hero image
<Image
  src={imageSrc}
  alt={alt}
  priority  // Load immediately
  width={800}
  height={800}
/>
```

### 3. Image Preloading

```typescript
// app/products/[id]/page.tsx
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);

  return {
    title: product.name,
    openGraph: {
      images: [product.primaryImageUrl],
    },
  };
}
```

---

## 🔒 Security Best Practices

### 1. Validate Image URLs

```typescript
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' &&
           (parsed.hostname.endsWith('signaturesolar.com') ||
            parsed.hostname.endsWith('cdn.signaturesolar.com'));
  } catch {
    return false;
  }
}
```

### 2. Sanitize Alt Text

```typescript
function sanitizeAltText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim()
    .substring(0, 125); // Limit length
}
```

---

## 📊 Monitoring & Analytics

### Track Image Load Failures

```typescript
// lib/analytics.ts
export function trackImageError(productId: string, imageUrl: string) {
  // Log to your analytics service
  console.error('[Image Error]', { productId, imageUrl });

  // Optional: Send to error tracking service
  // Sentry.captureMessage('Image failed to load', { extra: { productId, imageUrl } });
}
```

### Usage

```typescript
<Image
  src={imageSrc}
  alt={alt}
  onError={() => {
    trackImageError(product.id, imageSrc);
    setImgSrc('/images/placeholder.svg');
  }}
/>
```

---

## ✅ Production Checklist

Before deploying:

- [ ] All external image domains added to `next.config.mjs`
- [ ] Placeholder images created in `/public/images/`
- [ ] Error handling implemented for image load failures
- [ ] Image CDN URLs stored in database (not local paths)
- [ ] Alt text properly set for accessibility
- [ ] `next/image` used throughout (not `<img>` tags)
- [ ] Crawler configured to fetch full CDN URLs
- [ ] Database migration includes image columns
- [ ] Test images load correctly in production
- [ ] Monitor image errors in production

---

## 🎯 Quick Reference

### DO ✅

- Store full CDN URLs in database
- Use `next/image` component
- Add error handling with fallbacks
- Configure remote patterns in next.config.mjs
- Lazy load images below the fold
- Validate image URLs before storing
- Keep placeholder images locally

### DON'T ❌

- Store images in Vercel's file system (ephemeral!)
- Use relative paths in database
- Skip alt text
- Use regular `<img>` tags
- Forget error handling
- Store large images in git
- Hardcode image URLs in components

---

## 📚 Related Documentation

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Vercel Image Optimization](https://vercel.com/docs/image-optimization)
- [NeonDB Best Practices](https://neon.tech/docs/introduction)
- Project docs: `docs/CRAWLER.md`, `docs/DATABASE_SETUP.md`

---

**Questions?** Check the implementation in `lib/crawler.ts` and `components/ProductImage.tsx` for working examples.
