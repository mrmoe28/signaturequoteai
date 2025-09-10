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

## Repository Structure

- `docs/TLDR.md` - Comprehensive project specification and requirements
- `README.md` - Basic project overview and folder structure
- Future: `assets/` for brand assets, `ui/` for design mockups

When implementing this project, always reference the detailed specifications in `docs/TLDR.md` for accurate requirements and data structures.