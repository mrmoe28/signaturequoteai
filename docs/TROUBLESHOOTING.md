## PDF generation buffer type error on build/deploy

Symptom during `next build` or Vercel deploy:

```
Type error: Type 'Uint8Array<ArrayBufferLike>' is missing the following properties from type 'Buffer<ArrayBufferLike>': write, toJSON, equals, compare, copy
```

Cause: Puppeteer's `page.pdf()` return type can be `Uint8Array` in some versions/environments, which does not match Node's `Buffer` type expected elsewhere in the code.

Fix implemented in `lib/pdf-generator.ts`:

```ts
const pdf = await page.pdf({...});
const pdfBuffer: Buffer = Buffer.from(pdf);
return pdfBuffer;
```

This coerces the `Uint8Array` to a Node `Buffer` for consistent typing across environments (including Vercel lambdas).

## Tailwind CSS v4 PostCSS Plugin Error (Next.js + shadcn/ui)

### Symptom
Build fails with error similar to:

```
It looks like you're trying to use tailwindcss directly as a PostCSS plugin. The PostCSS plugin has moved to a separate package.
```

### Root Cause
Tailwind CSS v4+ separates the PostCSS plugin into `@tailwindcss/postcss`. Projects configured for Tailwind v3 (common with shadcn/ui setups) expect `tailwindcss` to work as a PostCSS plugin, causing build errors on v4.

### Preferred Fix (Stable): Downgrade to Tailwind v3

1. Install Tailwind v3.4.x as a dev dependency:
   ```bash
   npm install tailwindcss@^3.4.0 --save-dev
   ```
2. Keep the existing PostCSS config:
   ```js
   // postcss.config.js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   }
   ```
3. Rebuild the project:
   ```bash
   npm run build
   ```

### Alternative Fix (Tailwind v4)

1. Install new PostCSS plugin:
   ```bash
   npm install @tailwindcss/postcss --save-dev
   ```
2. Update PostCSS config:
   ```js
   // postcss.config.js
   module.exports = {
     plugins: {
       '@tailwindcss/postcss': {},
       autoprefixer: {},
     },
   }
   ```

### Additional Notes

- Avoid `@apply` on core utility class selectors (e.g., `.grid { @apply grid }`) — this can create circular dependencies in Tailwind v3 and fail the build. Use the utility classes directly in markup instead.
- If shadcn/ui components error on missing Radix packages, install the required packages, e.g.:
  ```bash
  npm install @radix-ui/react-label @radix-ui/react-select
  ```

### Verification Checklist

- `npm run build` completes successfully
- `npm run dev` compiles without PostCSS/Tailwind errors
- shadcn/ui components render and color tokens like `border` and `muted-foreground` work



## Run Locally Without a Database (DB optional)

### Symptom
- Local server starts, but certain API routes 500 with `DATABASE_URL environment variable is not set`.

### Root Cause
- Files under `app/api/products/**` and `app/api/quotes/**` import `lib/db/index.ts`, which throws if `DATABASE_URL` is undefined. These routes are only evaluated when requested; the UI pages themselves can run without a DB using `GET /api/catalog` (backed by `lib/seed/catalog.json`).

### What you do NOT need to change in Neon
- No Neon setting is required to “enable local servers.” The fix is in app configuration, not Neon. As long as you have a valid connection string, Neon works from local/dev by default.

### Options
1) Local dev without DB (recommended for UI work)
   - Don’t call DB-backed endpoints:
     - Avoid: `GET /api/products`, `GET /api/quotes`, `POST /api/quotes`, etc.
     - Use: `GET /api/catalog` (reads `lib/seed/catalog.json`). The Products and Quote Builder pages already use catalog data.
   - Start locally:
     ```bash
     npm install
     npm run dev
     ```

2) Local dev with DB
   - Create `.env.local` with your Neon connection URL:
     ```
     DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require
     ```
   - Apply the included schema (optional if DB is already provisioned):
     ```bash
     psql "${DATABASE_URL}&channel_binding=require" -v ON_ERROR_STOP=1 \
       -f lib/db/migrations/0000_odd_quasar.sql
     ```
   - Then `npm run dev` and DB-backed API routes will work.

### Using the Vercel production URL instead of running locally
- Yes, you can use the production (or preview) Vercel URL directly if it’s deployed.
- Ensure the Vercel project has `DATABASE_URL` set in Project Settings → Environment Variables if you want DB-backed API routes to work there. If not set, those routes will 500, but static pages and `/api/catalog` will still work.

### Quick Decision Matrix
- Only UI/catalog needed → run locally without DB or open the Vercel URL.
- Need `/api/products` or `/api/quotes` → set `DATABASE_URL` locally or in Vercel env.


## Vercel build fails: Cron Jobs plan limit exceeded

### Symptom
- Vercel deployment fails with error:
  - `Error: Your plan allows your team to create up to 2 Cron Jobs. Your team currently has 2, and this project is attempting to create 1 more, exceeding your team's limit.`

### Root Cause
- `vercel.json` declared a scheduled Cron for `"/api/cron/daily"`, which causes Vercel to provision a managed Cron Job. The team plan already has 2 Cron Jobs, so creating another fails the build.

### Fix
1. Remove the scheduled cron from `vercel.json` so Vercel stops provisioning a new job:
   ```json
   {
     "$schema": "https://openapi.vercel.sh/vercel.json",
     "crons": []
   }
   ```
2. Redeploy. The API route at `app/api/cron/daily/route.ts` still exists and can be triggered manually or via an external scheduler.

### Alternative (if you need a schedule)
- Use one of:
  - Upgrade your Vercel plan to allow more Cron Jobs.
  - Trigger the endpoint via an external scheduler (GitHub Actions, GitLab CI, cron-job.org, Zapier, etc.) using a `Bearer` token in the `Authorization` header with `VERCEL_CRON_SECRET`.

### Verification Checklist
- Build succeeds on Vercel.
- No new Cron Job appears under Project → Settings → Cron Jobs.
- Hitting `GET /api/cron/daily?secret=...` returns success in non-production, or use `POST` with `Authorization: Bearer <VERCEL_CRON_SECRET>`.

## Image extraction returns no images

### Symptom
- Product pages sometimes have no extractable image URLs; crawler stores none.

### Fix
- A fallback web image search is integrated via Bing Image Search.
- Set env vars locally or in Vercel:
  ```
  BING_IMAGE_SEARCH_KEY=your_azure_key
  # optional, default provided
  BING_IMAGE_SEARCH_ENDPOINT=https://api.bing.microsoft.com/v7.0/images/search
  ```
- The crawler will query `"<product name> <sku?> Signature Solar"` and use the first valid results.

### Notes
- Only common image types are allowed (jpg/png/webp/avif).
- Results are downloaded to `public/images/products/...` via the image storage service.

## Runtime Error: Cannot read properties of null (reading 'toLocaleString')

### Symptom
- Next.js runtime error: `TypeError: Cannot read properties of null (reading 'toLocaleString')`
- Error occurs in `lib/formatting.ts` when calling `money()` function
- Products page crashes when displaying products with null prices

### Root Cause
- The `money()` function expects a number but receives `null` values from crawled product data
- Signature Solar products may not have prices available, resulting in `null` values
- Function doesn't handle null/undefined inputs gracefully

### Fix
1. Update `lib/formatting.ts` to handle null values:
   ```typescript
   export const money = (n: number | null | undefined) => {
     if (n == null) return 'Price not available';
     return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
   };
   ```
2. Update UI to conditionally show "per unit" text only when price exists
3. This prevents runtime crashes when displaying products without prices

## TypeScript Build Error: Type 'number | null' is not assignable to type 'number'

### Symptom
- TypeScript compilation error: `Type 'number | null' is not assignable to type 'number'`
- Error occurs in quotes system when trying to assign product prices to quote items
- Build fails with type incompatibility errors

### Root Cause
- Product type was updated to allow `price: number | null` to handle missing prices
- Quote system types (`QuoteItem.unitPrice`) still expected `number` only
- Type system inconsistency between product and quote data structures

### Fix
1. Update `QuoteItem` type in `lib/types.ts`:
   ```typescript
   export type QuoteItem = {
     id?: string;
     productId: string;
     name: string;
     unitPrice: number | null;  // Allow null prices
     quantity: number;
     extended: number;
     notes?: string;
   };
   ```
2. Update `computeExtended` function to handle null prices:
   ```typescript
   export function computeExtended(item: Omit<QuoteItem, 'extended'>): number {
     if (item.unitPrice == null) return 0;
     return +(item.unitPrice * item.quantity).toFixed(2);
   }
   ```
3. Update UI components (`PriceTag`, `QuoteLineItemsTable`) to handle null values
4. Update database queries to handle null prices in price snapshots and quote items
5. This ensures type consistency throughout the application

### Verification Checklist
- Products page loads without errors
- Products with null prices show "Price not available" instead of crashing
- Products with valid prices display formatted currency correctly

## Vercel Deployment Error: Application error - client-side exception

### Symptom
- Vercel deployment shows "Application error: a client-side exception has occurred"
- Error occurs on quotes/new page or other pages that fetch product data
- Local development works fine but production fails

### Root Cause
- API endpoints trying to read files that don't exist on Vercel deployment
- Missing fallback handling when signature-solar data file is not available
- Client-side components not handling API failures gracefully

### Fix
1. Update API endpoints to handle missing files gracefully:
   ```typescript
   // In app/api/signature-solar/route.ts
   if (fs.existsSync(dataPath)) {
     const data = fs.readFileSync(dataPath, 'utf8');
     const products = JSON.parse(data);
     return NextResponse.json(products);
   }
   // Fallback: return empty array instead of error
   return NextResponse.json([]);
   ```

2. Add robust error handling in ProductPicker component:
   ```typescript
   // Add loading and error states
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   
   // Handle API failures with fallbacks
   .catch(err => {
     console.error('Failed to fetch products:', err);
     return fetch('/api/catalog').then(r => r.json());
   })
   ```

3. Ensure data files are included in deployment:
   - Verify `public/data/signature-solar-products.json` exists
   - Files in `public/` directory are automatically deployed to Vercel

4. This prevents client-side crashes when APIs return errors or empty data

