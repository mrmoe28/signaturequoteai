# Square Payment Integration Setup Guide

## Overview

This guide will help you set up Square payments for your quote system. When properly configured, customers will receive working payment links in quote emails.

## Current Status

✅ **Code Implementation**: Complete
❌ **Square SDK Installation**: Pending
❌ **Square Credentials**: Not configured

## Prerequisites

1. A Square account (https://squareup.com)
2. Access to Square Developer Dashboard (https://developer.squareup.com)

---

## Step 1: Install Square SDK

Run this command in your project directory:

```bash
npm install square@43.1.0
```

This installs the official Square Node.js SDK (version 43.1.0) needed for payment link creation.

**Note**: If you encounter npm cache permission errors, run this first:
```bash
sudo chown -R $(whoami) "$HOME/.npm"
```

---

## Step 2: Set Up Square Application

### 2.1 Create a Square Application

1. Go to https://developer.squareup.com/apps
2. Click "Create app" (or use an existing app)
3. Give your app a name (e.g., "SignatureQuoteAI Payments")
4. Note down your **Application ID**

### 2.2 Get Your Access Token

**For Sandbox (Testing):**
1. In your Square app dashboard, go to **Credentials** → **Sandbox**
2. Copy your **Sandbox Access Token**
3. This token starts with `EAAAl...`

**For Production:**
1. In your Square app dashboard, go to **Credentials** → **Production**
2. Copy your **Production Access Token**
3. This token starts with `EAAAE...`

⚠️ **Important**: Never commit access tokens to git!

### 2.3 Get Your Location ID

1. In Square app dashboard, go to **Locations**
2. Copy the **Location ID** for your business location
3. This ID starts with a long string of characters

---

## Step 3: Configure Environment Variables

### 3.1 Update `.env.local`

Open `/Users/ekodevapps/Desktop/signaturequoteai-main/.env.local` and update these values:

```bash
# Square Configuration
SQUARE_ENVIRONMENT=sandbox  # Use 'production' when ready to go live
SQUARE_APPLICATION_ID=YOUR_APPLICATION_ID_HERE
SQUARE_ACCESS_TOKEN=YOUR_SANDBOX_ACCESS_TOKEN_HERE
SQUARE_LOCATION_ID=YOUR_LOCATION_ID_HERE
SQUARE_WEBHOOK_SIGNATURE_KEY=  # Optional - for webhook verification
```

### 3.2 Update Production Environment (Vercel)

When deploying to production, add these environment variables to Vercel:

```bash
# In Vercel Dashboard → Settings → Environment Variables
SQUARE_ENVIRONMENT=production
SQUARE_APPLICATION_ID=<your_app_id>
SQUARE_ACCESS_TOKEN=<your_production_token>
SQUARE_LOCATION_ID=<your_location_id>
```

Or via Vercel CLI:

```bash
vercel env add SQUARE_ENVIRONMENT production
# Enter: production

vercel env add SQUARE_APPLICATION_ID production
# Enter: your application ID

vercel env add SQUARE_ACCESS_TOKEN production
# Enter: your production access token

vercel env add SQUARE_LOCATION_ID production
# Enter: your location ID
```

---

## Step 4: Test the Integration

### 4.1 Start Development Server

```bash
npm run dev
```

### 4.2 Send a Test Quote

1. Go to http://localhost:3000/quotes/new
2. Create a quote with customer email
3. Send the quote
4. Check the email - it should contain a working Square payment link

### 4.3 Verify Payment Link

The payment link should:
- Start with `https://checkout.square.site/...` (not a placeholder)
- Open a real Square checkout page
- Show the correct amount and quote details

### 4.4 Test Payment (Sandbox Only)

Square provides test card numbers for sandbox testing:

**Test Card Numbers:**
- **Success**: 4111 1111 1111 1111
- **Declined**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **ZIP**: Any valid ZIP code

Complete a test payment to verify the full flow.

---

## How It Works

### Payment Link Generation Flow

1. **Quote Email Sent** → Triggers `sendQuoteEmailSimple()` in `lib/simple-email-service.ts`
2. **Check Configuration** → `isSquareConfigured()` validates environment variables
3. **Create Payment Link** → `createSquarePaymentLink()` calls Square Checkout API
4. **Email Generated** → Payment link embedded in HTML and text email
5. **Customer Clicks** → Redirects to Square hosted checkout page
6. **Payment Complete** → Customer redirected back to success page

### Files Modified

- ✅ `lib/square-client.ts` - New Square API integration
- ✅ `lib/simple-email-service.ts` - Updated to use Square client
- ✅ `.env.local` - Environment variables (needs your credentials)
- ✅ `docs/SQUARE_PAYMENT_SETUP.md` - This setup guide

---

## Troubleshooting

### Issue: "Square not configured" in logs

**Cause**: Environment variables are empty or contain placeholder values

**Solution**:
1. Check `.env.local` has real Square credentials (not placeholders)
2. Restart dev server: `npm run dev`
3. Check logs for "Square payment link created successfully"

### Issue: Payment link is still placeholder

**Cause**: Square SDK not installed or credentials invalid

**Solution**:
```bash
# Verify Square SDK is installed
npm list square

# If not found, install it
npm install square

# Restart dev server
npm run dev
```

### Issue: Square API Error

**Common errors:**

1. **"Invalid access token"**
   - Solution: Double-check your access token in `.env.local`
   - Ensure you're using sandbox token for `SQUARE_ENVIRONMENT=sandbox`

2. **"Location not found"**
   - Solution: Verify your `SQUARE_LOCATION_ID` is correct
   - Check it matches a location in your Square account

3. **"Insufficient permissions"**
   - Solution: Ensure your access token has "Payments" permission
   - Generate a new token with proper scopes

---

## Production Checklist

Before going live with real payments:

- [ ] Install Square SDK: `npm install square`
- [ ] Configure production Square credentials in Vercel
- [ ] Change `SQUARE_ENVIRONMENT=production` in Vercel
- [ ] Test with real (small) payment
- [ ] Set up webhook for payment confirmations (optional)
- [ ] Configure `SUPPORT_EMAIL` for customer support
- [ ] Test the full flow: quote → email → payment → success

---

## Security Best Practices

1. **Never commit credentials**: Always use environment variables
2. **Use sandbox for testing**: Only use production credentials on production
3. **Rotate tokens regularly**: Generate new access tokens periodically
4. **Monitor transactions**: Check Square Dashboard for suspicious activity
5. **Use HTTPS**: Ensure production site uses HTTPS (automatic on Vercel)

---

## Additional Resources

- [Square Checkout API Documentation](https://developer.squareup.com/docs/checkout-api/what-it-does)
- [Square Payment Links](https://developer.squareup.com/docs/checkout-api/payment-links)
- [Square Sandbox Testing](https://developer.squareup.com/docs/devtools/sandbox/overview)
- [Square Node.js SDK](https://github.com/square/square-nodejs-sdk)

---

## Support

If you encounter issues:

1. Check the logs: Look for Square-related messages in console
2. Verify credentials: Ensure all environment variables are set
3. Test in sandbox first: Use test credentials before production
4. Contact Square Support: For Square-specific payment issues

---

**Last Updated**: January 2025
**Status**: Ready for configuration
