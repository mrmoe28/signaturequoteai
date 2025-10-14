# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SignatureQuoteCrawler is a web application that crawls Signature Solar for current prices and generates polished quotes. This is currently in the planning/documentation phase with no code implementation yet.

**Primary Goal**: Build a responsive Next.js app that authenticates users, displays a product catalog from crawled data, and generates PDF-style quotes matching a reference visual style.

## Tech Stack (Planned)

- **Frontend**: Next.js 14+ (App Router), React Server Components, TypeScript
- **UI/Styling**: SuperDesign for design system and components  
- **Authentication**: Google OAuth + Email/Password
- **Database** (future): NeonDB with Drizzle ORM
- **Deployment**: Vercel
- **PDF/Email** (future): Edge SSR to PDF, Resend or SES for email delivery

## Core Data Contracts

The application is designed around these key TypeScript interfaces (from docs/TLDR.md):

```ts
type Vendor = 'SignatureSolar';

type Product = {
  id: string; name: string; sku?: string; vendor: Vendor;
  category?: string; unit: 'ea'|'ft'|'pack';
  price: number; currency: 'USD';
  url?: string; lastUpdated: string; // ISO
};

type QuoteItem = { 
  productId: string; name: string; unitPrice: number; 
  qty: number; extended: number; notes?: string; 
};

type Customer = { 
  company?: string; name: string; email?: string; 
  phone?: string; shipTo?: string; 
};

type Quote = {
  id: string; number?: string; createdAt: string; validUntil?: string;
  preparedBy?: string; leadTimeNote?: string; 
  discount?: number; shipping?: number; tax?: number;
  items: QuoteItem[]; subtotal: number; total: number; 
  terms?: string;
};
```

## Development Phases

### Phase 1 (Frontend-First Implementation)
1. Scaffold Next.js + SuperDesign shell with global theme matching quote styling
2. Build Quote Preview layout first (pixel parity with reference PDF style)
3. Build Quote Builder Wizard with reusable line-item components
4. Build Products page using local `catalog.json` (seeded from reference data)
5. Add Authentication screens (Google + Email/Password UI)
6. Connect state flow: select products → compute totals → preview → stub "Send/Download"

### Phase 2 (Backend Integration)
- NeonDB + Drizzle schema implementation
- Crawler worker with rate limiting and freshness monitoring
- PDF generation and email sending
- Admin features and audit logging

## Key UI Components (Planned)

Core reusable components to implement:
- `PriceTag`, `FreshnessBadge`, `LineItemTable`, `TotalsCard` 
- `TermsBlock`, `QuoteHeader`, `CustomerCard`, `SaveBar`

## Key Routes/Pages (Planned)

- `/auth/login`, `/auth/register`, `/auth/reset` - Authentication flows
- `/dashboard` - Quick stats + "New Quote" entry point
- `/products` - Searchable product catalog with filtering
- `/quotes/new` - 5-step wizard: Customer → Items → Pricing → Preview → Send

## Quote Styling Requirements

The quote renderer must match the reference PDF style exactly:
- Header with Quote #, dates, customer info, prepared by, terms, lead time
- Line items table with unit price, quantity, extended totals
- Subtotal/Discount/Shipping/Total summary section  
- Footer terms/legal block
- Consistent typography and spacing throughout

## Environment Variables (Placeholders)

When implementing authentication and external services:
- `AUTH_GOOGLE_CLIENT_ID`, `AUTH_GOOGLE_CLIENT_SECRET`
- `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`
- `EMAIL_SERVER_*` (for magic links, future)
- Database connection strings (future)

## Important Considerations

- **Crawling Compliance**: Must respect robots.txt/TOS and implement proper rate limiting
- **Quote Precision**: PDF output must be pixel-faithful to reference styling
- **Data Freshness**: Price data requires timestamp tracking and freshness indicators
- **State Management**: Use simple client store for quote building workflow
- **Responsive Design**: All components must work across device sizes

## TypeScript Safety Protocol (MANDATORY)

**CRITICAL RULE: Never consider a task complete until `npm run build` passes with 0 TypeScript errors.**

### Pre-Implementation Checklist
- [ ] **Read existing code first** - Understand patterns and return types already in the file
- [ ] **Copy type definitions** from similar functions in the same file
- [ ] **Check interfaces** in `lib/types.ts` to understand expected shapes

### During Implementation Checklist
- [ ] **Add explicit return types** to ALL exported functions:
  ```typescript
  export async function myFunction(id: string): Promise<MyType | null>
  ```
- [ ] **Transform database results** to match TypeScript interfaces:
  ```typescript
  // ✅ Good - Transform raw DB data
  function transformDbResult(dbData: any): InterfaceType {
    return {
      id: dbData.id,
      field: dbData.field || undefined,
      // ... explicit mapping
    }
  }

  // ❌ Bad - Returning raw DB object
  return dbResult[0]; // Type mismatch!
  ```
- [ ] **Use type guards** for database results with string/number conversions
- [ ] **Never use `any`** without explicit justification in comments
- [ ] **Match existing patterns** - if file uses `Promise<Type | null>`, use same pattern

### Post-Implementation Checklist (MANDATORY)
- [ ] **Run type check**: `npm run build` or `npx tsc --noEmit`
- [ ] **Fix ALL errors** - Do not proceed until 0 errors
- [ ] **Check editor** - Ensure no red squiggly lines in VSCode/editor
- [ ] **Verify imports** - All imports resolve correctly

### Common TypeScript Patterns in This Project

1. **Database Query Results:**
   ```typescript
   // Always transform DB results to match interface
   const result = await db.select().from(table).where(eq(table.id, id));
   if (!result[0]) return null;

   return transformToInterface(result[0]); // ✅ Type-safe
   ```

2. **Nullable Fields:**
   ```typescript
   // Use || undefined for optional fields
   field: dbData.field || undefined,  // ✅ Correct
   field: dbData.field,                // ❌ May be null
   ```

3. **JSON Parsing:**
   ```typescript
   // Always handle parse errors
   metadata: job.metadata ? JSON.parse(job.metadata) : undefined,
   ```

4. **Numeric Conversions:**
   ```typescript
   // Parse strings to numbers explicitly
   productsProcessed: parseInt(job.productsProcessed || '0'),
   price: parseFloat(dbData.price),
   ```

### Pre-Commit Hook

A pre-commit hook is installed at `.git/hooks/pre-commit` that automatically runs TypeScript checks before allowing commits. If it fails:

```bash
# To see the errors:
npm run build

# Fix all errors, then try commit again
git commit -m "your message"
```

### Emergency Override (Use Sparingly)

If you must commit with TypeScript errors (NOT recommended):
```bash
git commit --no-verify -m "WIP: describe why override needed"
```

**⚠️ NEVER push to main/master with TypeScript errors**

## Repository Structure

- `docs/TLDR.md` - Comprehensive project specification and requirements
- `README.md` - Basic project overview and folder structure
- Future: `assets/` for brand assets, `ui/` for design mockups

When implementing this project, always reference the detailed specifications in `docs/TLDR.md` for accurate requirements and data structures.