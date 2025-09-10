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

