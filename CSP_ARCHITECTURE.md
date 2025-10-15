# Content Security Policy Architecture

## Overview

This document maps out all the third-party services used in the application and their required CSP domains to prevent future errors.

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SignatureQuoteAI App                       │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
        ┌───────▼────────┐             ┌───────▼────────┐
        │  Stack Auth    │             │     Square     │
        │ (Auth Provider)│             │  (Payments)    │
        └───────┬────────┘             └───────┬────────┘
                │                               │
        ┌───────▼────────┐                     │
        │     Stripe     │                     │
        │(Stack's billing)│                     │
        └────────────────┘                     │
                                               │
                            ┌──────────────────┼──────────────────┐
                            │                  │                  │
                    ┌───────▼────────┐ ┌──────▼──────┐ ┌────────▼────────┐
                    │  Square OAuth  │ │  Square SDK │ │ Square Connect  │
                    │                │ │             │ │                 │
                    └────────────────┘ └─────────────┘ └─────────────────┘
```

## Service Breakdown

### 1. Stack Auth (User Authentication)
**Purpose**: User sign-in, sign-up, authentication
**Credentials**: Stored in Vercel (NEXT_PUBLIC_STACK_*)
**CSP Domains Required**:
- `connect-src`: `https://*.stackauth.com`, `https://api.stack-auth.com`, `wss://*.stackauth.com`
- `script-src`: `https://*.stackauth.com`
- `style-src`: `https://*.stackauth.com`
- `font-src`: `https://*.stackauth.com`
- `frame-src`: `https://*.stackauth.com`

**Note**: Stack Auth uses Stripe internally for THEIR billing (not your app's payments). This is why Stripe CSP domains are needed even though you don't have Stripe credentials.

### 2. Stripe (Stack Auth's Payment Processor)
**Purpose**: Powers Stack Auth's internal billing system
**Credentials**: NONE needed (Stack Auth handles this)
**CSP Domains Required**:
- `connect-src`: `https://api.stripe.com`, `https://checkout.stripe.com`
- `script-src`: `https://js.stripe.com`, `https://*.js.stripe.com`, `https://checkout.stripe.com`, `https://connect-js.stripe.com`
- `frame-src`: `https://js.stripe.com`, `https://*.js.stripe.com`, `https://hooks.stripe.com`, `https://checkout.stripe.com`, `https://connect-js.stripe.com`
- `img-src`: `https://*.stripe.com`

**Important**: You don't need Stripe API keys. Stripe CSP is required for Stack Auth UI to function.

### 3. Square (Payment Link Generation)
**Purpose**: Generate payment links for quotes
**Credentials**: Stored in Vercel (SQUARE_*)
**CSP Domains Required**:
- `connect-src`: `https://connect.squareup.com`, `https://connect.squareupsandbox.com`, `https://pci-connect.squareup.com`, `https://pci-connect.squareupsandbox.com`
- `script-src`: `https://web.squarecdn.com`, `https://sandbox.web.squarecdn.com`
- `style-src`: `https://web.squarecdn.com`, `https://sandbox.web.squarecdn.com`
- `font-src`: `https://square-fonts-production-f.squarecdn.com`, `https://d1g145x70srn7h.cloudfront.net`
- `frame-src`: `https://connect.squareup.com`, `https://connect.squareupsandbox.com`, `https://web.squarecdn.com`, `https://sandbox.web.squarecdn.com`
- `form-action`: `https://connect.squareup.com`, `https://connect.squareupsandbox.com`

### 4. Other Services
**Sentry** (Error Monitoring):
- `connect-src`: `https://o160250.ingest.sentry.io`

**Cloudflare** (Analytics):
- `connect-src`: `https://cloudflareinsights.com`
- `script-src`: `https://cloudflareinsights.com`

## Complete CSP Configuration

```javascript
// next.config.mjs
{
  "default-src": "'self'",

  "script-src": [
    "'self'",
    "'unsafe-eval'",
    "'unsafe-inline'",
    // Square
    "https://web.squarecdn.com",
    "https://sandbox.web.squarecdn.com",
    // Stack Auth
    "https://*.stackauth.com",
    // Stripe (for Stack Auth)
    "https://js.stripe.com",
    "https://*.js.stripe.com",
    "https://checkout.stripe.com",
    "https://connect-js.stripe.com",
    // Cloudflare
    "https://cloudflareinsights.com"
  ],

  "style-src": [
    "'self'",
    "'unsafe-inline'",
    // Square
    "https://web.squarecdn.com",
    "https://sandbox.web.squarecdn.com",
    // Stack Auth
    "https://*.stackauth.com"
  ],

  "img-src": [
    "'self'",
    "data:",
    "https:",
    "http:"
  ],

  "font-src": [
    "'self'",
    "data:",
    // Square
    "https://square-fonts-production-f.squarecdn.com",
    "https://d1g145x70srn7h.cloudfront.net",
    // Stack Auth
    "https://*.stackauth.com"
  ],

  "connect-src": [
    "'self'",
    // Square
    "https://connect.squareup.com",
    "https://connect.squareupsandbox.com",
    "https://pci-connect.squareup.com",
    "https://pci-connect.squareupsandbox.com",
    // Stack Auth
    "https://*.stackauth.com",
    "https://api.stack-auth.com",
    "wss://*.stackauth.com",
    // Stripe (for Stack Auth)
    "https://api.stripe.com",
    "https://checkout.stripe.com",
    // Other
    "https://o160250.ingest.sentry.io",
    "https://api.clerk.com",
    "https://cloudflareinsights.com"
  ],

  "frame-src": [
    "'self'",
    // Square
    "https://connect.squareup.com",
    "https://connect.squareupsandbox.com",
    "https://web.squarecdn.com",
    "https://sandbox.web.squarecdn.com",
    // Stack Auth
    "https://*.stackauth.com",
    // Stripe (for Stack Auth)
    "https://js.stripe.com",
    "https://*.js.stripe.com",
    "https://hooks.stripe.com",
    "https://checkout.stripe.com",
    "https://connect-js.stripe.com"
  ],

  "form-action": [
    "'self'",
    // Square
    "https://connect.squareup.com",
    "https://connect.squareupsandbox.com"
  ]
}
```

## User Flow

### Authentication Flow (Stack Auth + Stripe CSP)
1. User visits `/auth/sign-in`
2. Stack Auth component loads (requires Stack Auth CSP domains)
3. Stack Auth makes API calls to `api.stack-auth.com`
4. Stack Auth UI may load Stripe elements (requires Stripe CSP domains)
5. User signs in successfully
6. Redirected to `/dashboard`

### Payment Integration Flow (Square)
1. User (already authenticated) visits `/settings`
2. Clicks "Connect Square Account"
3. Redirects to Square OAuth (requires Square connect-src)
4. User authorizes Square
5. Square redirects back to `/api/integrations/square/callback`
6. App saves Square credentials to database
7. User can now generate quotes with Square payment links

## Testing Checklist

### Test 1: Stack Auth Sign-In
- [ ] Visit `/auth/sign-in`
- [ ] Open DevTools Console
- [ ] Verify NO CSP errors for:
  - `api.stack-auth.com`
  - `*.stackauth.com`
  - `js.stripe.com` or `api.stripe.com`
- [ ] Sign-in form loads completely (no skeleton loaders)
- [ ] Can sign in successfully

### Test 2: Square OAuth Connection
- [ ] Sign in first
- [ ] Visit `/settings`
- [ ] Click "Connect Square Account"
- [ ] Verify NO CSP errors for:
  - `connect.squareup.com`
  - `web.squarecdn.com`
- [ ] OAuth redirect works smoothly
- [ ] After authorization, redirects back successfully
- [ ] Settings page shows "Connected" status

### Test 3: Quote with Payment Link
- [ ] Create a new quote
- [ ] Add line items
- [ ] Generate payment link (requires Square connection)
- [ ] Verify payment link works

## Common CSP Errors

### Error: "Refused to connect to 'https://api.stack-auth.com'"
**Solution**: Add `https://api.stack-auth.com` to `connect-src`

### Error: "Refused to load script from 'https://js.stripe.com'"
**Solution**: Add `https://js.stripe.com` and `https://*.js.stripe.com` to `script-src`

### Error: "Refused to frame 'https://checkout.stripe.com'"
**Solution**: Add `https://checkout.stripe.com` to `frame-src`

### Error: "Refused to connect to 'https://connect.squareup.com'"
**Solution**: Add Square domains to `connect-src` and `frame-src`

## Why Stripe CSP Is Needed (Without Stripe Credentials)

**Question**: "We don't have Stripe credentials, why do we need Stripe CSP?"

**Answer**: Stack Auth (your authentication provider) uses Stripe internally for THEIR billing system. When Stack Auth loads its UI components (sign-in form, account settings, etc.), it may load Stripe.js for payment-related features that Stack Auth offers to their customers.

You are not integrating with Stripe directly. You don't need Stripe API keys. But Stack Auth's code tries to load Stripe resources, which triggers CSP violations if Stripe domains aren't allowed.

Think of it like this:
- **Stack Auth** = Your authentication service provider
- **Stripe** = Stack Auth's payment processor (not yours)
- **Square** = YOUR payment processor for quote payment links

## Debugging Strategy

1. **Always check browser console first** - CSP errors are clearly logged
2. **Look for "Refused to connect" or "Refused to load"** - These indicate missing CSP domains
3. **Add the specific domain** that's being blocked
4. **Test incrementally** - Add one domain at a time and test
5. **Reference official documentation** - Check provider docs for required CSP

## Environment Variables

### Stack Auth (Required for Authentication)
```
NEXT_PUBLIC_STACK_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=<your-key>
STACK_SECRET_SERVER_KEY=<your-secret>
```

### Square (Required for Payment Links)
```
NEXT_PUBLIC_SQUARE_APPLICATION_ID=<your-app-id>
SQUARE_CLIENT_SECRET=<your-secret>
SQUARE_ENVIRONMENT=production
```

### Stripe (NOT Required)
```
# You DON'T need these!
# Stripe CSP is for Stack Auth, not your app
```

## Current Status

✅ **Deployed** - All CSP domains configured (commit `1fcbe6f`)
⏳ **Awaiting Testing** - Need to verify sign-in and Square OAuth work without CSP errors

---

**Last Updated**: 2025-10-15
**Deployment**: https://signaturequoteai-main.vercel.app
