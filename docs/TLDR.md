# Signature QuoteCrawler — TL;DR (Frontend-First)

**Goal**  
Build a web app that crawls Signature Solar for current prices, normalizes them into a simple catalog, and lets the user generate/send a polished quote **in the visual style of the uploaded quote** (line-items, subtotals, discount, lead times, terms).

**Primary Outcome (v1)**  
- A responsive Next.js app (App Router) styled with **SuperDesign** that:
  - Authenticates via **Google** and **email+password** (UI flows ready; logic stubs).
  - Shows a **Products** view (fed by a local “cached catalog” JSON for now; later wired to crawler/DB).
  - Lets a user assemble a **Quote** from products, adjust qty/discount, add customer info, preview a **PDF-like quote** matching the reference style, and **send** (UI only in v1; email/PDF wiring comes later).
  - Displays **price freshness** badges (timestamp of last crawl/cache).

**Tech Stack (Frontend-first)**
- **Next.js 14+ (App Router)**, React Server Components, TypeScript.
- **SuperDesign** for UI (design tokens, components).
- **Auth UI**: Google + Email/Password screens (forms, validation, error states).  
- **PDF-style Quote Renderer**: SSR layout that mirrors the reference quote typography/sections (header/meta, line items, subtotal/discount/shipping/total, terms).
- **State & Data Contracts**: Local `catalog.json` + `types.ts` to mirror the future DB schema; simple client store for quote building.

**Key Screens & Components**
- `/auth/login`, `/auth/register`, `/auth/reset` (UI only; hooks for later).
- `/dashboard` — quick stats + “New Quote”.
- `/products` — searchable list (name, SKU/vendor, current price, last-updated).
- `/quotes/new` (wizard):
  1) Customer info  
  2) Select items (filter by vendor/SKU; quick-add quantities)  
  3) Adjust pricing (discounts, shipping placeholder)  
  4) **Preview** (pixel-faithful to reference)  
  5) Send (stub) / Download (stub)
- Components: `PriceTag`, `FreshnessBadge`, `LineItemTable`, `TotalsCard`, `TermsBlock`, `QuoteHeader`, `CustomerCard`, `SaveBar`.

**Data Contracts (for UI now, DB later)**
```ts
type Vendor = 'SignatureSolar';

type Product = {
  id: string; name: string; sku?: string; vendor: Vendor;
  category?: string; unit: 'ea'|'ft'|'pack';
  price: number; currency: 'USD';
  url?: string; lastUpdated: string; // ISO
};

type QuoteItem = { productId: string; name: string; unitPrice: number; qty: number; extended: number; notes?: string; };
type Customer = { company?: string; name: string; email?: string; phone?: string; shipTo?: string; };
type Quote = {
  id: string; number?: string; createdAt: string; validUntil?: string;
  preparedBy?: string; leadTimeNote?: string; discount?: number; shipping?: number; tax?: number;
  items: QuoteItem[]; subtotal: number; total: number; terms?: string; // include legal notes block
};
```

**Crawler (planned; backend later)**
- Source: Signature Solar product pages/category APIs (respect **robots.txt/TOS**, throttle, rotate user-agent).  
- Extract: title, SKU, price, URL, category, unit.  
- Normalize → `products` table (Neon) with `last_updated`.  
- Freshness strategy: daily cron + on-demand refresh for a single SKU.  
- Diff alerts if layout changes or a page returns unexpected markup.

**Deployment & Config**
- **Vercel**: Next.js app; environment placeholders only (no live DB in v1).
- ENV placeholders (to fill later):  
  `AUTH_GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `EMAIL_SERVER_…` (if using magic links later), `NEXT_PUBLIC_APP_URL`.
- PDF/email in v2: use **Edge SSR to PDF** or a render service; email via **Resend** or SES.

**Quote Styling Requirements (match reference)**
- Header block with **Quote #**, dates (Created/Valid Until), **Prepared For** (company, contact, phone, ship-to), **Quoted By**, **Terms**, **Lead Time**.  
- Line items table with unit price, qty, extended, and discount rows, then **Subtotal / Discount / Shipping / Total** summary.  
- Footer terms/legal block; checkout/CTA section (UI analog only in v1).

**What we’ll do NOW (UI build order)**
1) Scaffold Next.js + SuperDesign shell; global theme (typography/spacing matching quote).  
2) Build **Quote Preview** layout first (pixel parity with the PDF style).  
3) Build **Quote Builder Wizard** and reusable line-item components.  
4) Build **Products** page pulling from local `catalog.json` (seeded from your spreadsheet references).  
5) Add **Auth screens** (Google + Email/Password UI).  
6) Hook state: select products → compute totals → preview → stub “Send/Download”.

**Later (Backend bolt-on)**
- NeonDB + Drizzle schema (`products`, `quotes`, `quote_items`, `customers`, `users`, `price_snapshots`).  
- Crawler worker (rate-limited), freshness cron, admin overrides, audit log.  
- PDF generation + email sending, taxes/shipping calculators, role-based access.

**Likely Gaps / Decisions to Confirm**
- **Crawl compliance** (robots.txt/TOS) & rate limits.  
- **Email delivery** choice (Resend vs SES) + domain auth (SPF/DKIM/DMARC).  
- **Tax/Shipping** approach (flat vs estimator).  
- **Discount rules** (per-item vs order-level).  
- **Branding** (logo/colors) and whether quotes need multi-vendor support.  
- **Terms/Legal** block content (mirror the reference; editable later).
