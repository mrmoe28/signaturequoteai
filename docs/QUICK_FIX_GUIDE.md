# Quick Fix Guide: Payment Link 404 Error

## Problem
You're seeing a **404 NOT FOUND** error when clicking payment links in quote emails, along with service worker errors on the checkout page.

## Root Cause
The application is using **placeholder payment links** because Square payment integration is not properly configured. The URL `https://checkout.square.site/placeholder/quote-payment` doesn't actually exist, which causes the 404 error.

## Quick Fix (For Testing/Development)

### Option 1: Accept the Limitation (Fastest)
The app will now redirect to an informative error page instead of a broken Square checkout page:

1. **No action needed** - The fix has been applied
2. Payment links will now redirect to `/payment-error` page
3. This page explains that Square needs to be configured

**When this is acceptable:**
- During development/testing phases
- When payments are not required yet
- For demo/preview purposes

### Option 2: Configure Square (Recommended for Production)

Follow these steps to enable real payment processing:

#### Step 1: Validate Current Environment
```bash
npm run env:validate
```

This will show you what's missing.

#### Step 2: Create Environment File
```bash
# Copy the example file
cp .env.local.example .env.local
```

#### Step 3: Get Square Credentials

1. **Create Square Account**
   - Go to https://squareup.com and sign up
   - Complete merchant verification

2. **Access Developer Dashboard**
   - Visit https://developer.squareup.com/apps
   - Create a new application or select existing

3. **Get Credentials** (Sandbox for testing)
   - Go to **Credentials** → **Sandbox**
   - Copy these values:
     ```
     SQUARE_ACCESS_TOKEN=EAAAl... (your sandbox token)
     SQUARE_LOCATION_ID=L... (your location ID)
     SQUARE_APPLICATION_ID=sq0idp-... (your app ID)
     ```

4. **Update .env.local**
   ```bash
   # Edit your .env.local file
   SQUARE_ENVIRONMENT=sandbox
   SQUARE_ACCESS_TOKEN=EAAAl... # Your actual token
   SQUARE_LOCATION_ID=L... # Your actual location ID
   SQUARE_APPLICATION_ID=sq0idp-... # Your actual app ID
   ```

#### Step 4: Restart Application
```bash
# Restart the development server
npm run dev
```

#### Step 5: Test Payment Flow
1. Create a new quote
2. Send the quote via email
3. Click the payment link in the email
4. Should now redirect to real Square checkout page
5. Use test card: `4111 1111 1111 1111` (sandbox only)

## Environment Validation

Run this command anytime to check your configuration:

```bash
npm run env:validate
```

**Expected Output:**
```
✅ All required environment variables are configured correctly!
```

## Additional Fixes Applied

1. **Error Page Created**: `/app/payment-error/page.tsx`
   - User-friendly error message
   - Setup instructions for admins
   - Links back to dashboard

2. **Validation Script**: `scripts/validate-env.ts`
   - Checks all environment variables
   - Identifies missing/placeholder values
   - Provides actionable feedback

3. **Improved Logging**: Square client now logs when using placeholder links

4. **Environment Template**: `.env.local.example`
   - Complete list of all required variables
   - Helpful comments and instructions
   - Easy to copy and customize

## Troubleshooting

### Still seeing 404 after configuring Square?

1. **Verify environment variables are loaded:**
   ```bash
   npm run env:validate
   ```

2. **Check for typos in .env.local:**
   - No spaces around `=` signs
   - No quotes around values (unless needed)
   - Correct variable names (case-sensitive)

3. **Restart the development server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

4. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

### Square API Errors?

**"Invalid access token"**
- Check you're using the correct token for your environment
- Sandbox tokens start with `EAAAl...`
- Production tokens start with `EAAAE...`

**"Location not found"**
- Verify your `SQUARE_LOCATION_ID` is correct
- Check it matches a location in your Square account
- Go to Square Dashboard → Account & Settings → Business → Locations

**"Insufficient permissions"**
- Your access token needs "Payments" permission
- Regenerate token with proper scopes in Square Dashboard

## Production Deployment

Before deploying to production:

1. **Switch to Production Credentials**
   - Get production token from Square Dashboard
   - Update Vercel environment variables
   - Set `SQUARE_ENVIRONMENT=production`

2. **Update Webhook URL**
   - Configure Square webhook to point to your production domain
   - Test webhook with: `npm run webhook:test`

3. **Test with Small Transaction**
   - Create test quote with minimal amount
   - Complete full payment flow
   - Verify payment confirmation

## Documentation References

- **Square Setup**: `docs/SQUARE_PAYMENT_SETUP.md`
- **Environment Setup**: `docs/VERCEL_ENVIRONMENT_SETUP.md`
- **Webhook Configuration**: `docs/SQUARE_WEBHOOK_SETUP.md`
- **Email Setup**: `docs/EMAIL_SETUP.md`

## Summary

The **404 error is now fixed** by redirecting to an informative error page instead of a broken Square URL. To enable actual payment processing, you need to configure Square with valid API credentials.

**Quick commands:**
```bash
# Check configuration
npm run env:validate

# Start development
npm run dev

# Test webhooks
npm run webhook:test
```

---

**Last Updated**: October 2025
**Status**: Fixed - Error handling improved, Square configuration required for payments

