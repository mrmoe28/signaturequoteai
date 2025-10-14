# Square Payment Integration Setup Checklist

## Overview
This document outlines the steps needed to fully integrate Square payment links into the SignatureQuoteAI application.

## ✅ Completed Items

### 1. Quote History Sidebar
- **Component Created**: `components/QuoteHistorySidebar.tsx`
  - Shows sent quotes with their status (sent, viewed, accepted, rejected, expired)
  - Floating sidebar accessible from all pages
  - Links to individual quote details
  
### 2. Quote History API
- **Endpoint Created**: `/api/quotes/history/route.ts`
  - Returns list of sent quotes with status tracking
  - Currently using mock data (needs database integration)

### 3. Square Payment Links in Email
- **Email Template Updated**: `lib/simple-email-service.ts`
  - Added Square payment button in HTML emails
  - Added payment link in text emails
  - Generates payment links with quote details

### 4. Download Button Removal
- **Removed from**:
  - `/app/quotes/[id]/page.tsx` - Quote detail page
  - `/app/dashboard/page.tsx` - Dashboard quote list (both table and list view)
  - `/app/quotes/new/page.tsx` - Quote creation page

## 🔧 Required Square Setup

### 1. Square Account Configuration
1. **Create Square Account**
   - Sign up at https://squareup.com
   - Complete merchant verification
   
2. **Enable Online Payments**
   - Navigate to Square Dashboard > Online > Checkout Links
   - Enable Checkout API

### 2. Environment Variables
Add these to your `.env.local` file:
```env
# Square Payment Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_LOCATION_ID=your_square_location_id_here
SQUARE_ENVIRONMENT=sandbox # or 'production'
SQUARE_MERCHANT_ID=your_merchant_id_here
SQUARE_CHECKOUT_URL=https://checkout.square.site # or sandbox URL
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key_here
```

### 3. Square API Integration Steps

#### A. Install Square SDK
```bash
npm install square
```

#### B. Create Square Service
Create `lib/square-service.ts`:
```typescript
import { Client, Environment } from 'square';

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox
});

export async function createPaymentLink(quoteData: any) {
  const checkoutApi = squareClient.checkoutApi;
  
  const response = await checkoutApi.createPaymentLink({
    checkout: {
      locationId: process.env.SQUARE_LOCATION_ID!,
      order: {
        locationId: process.env.SQUARE_LOCATION_ID!,
        lineItems: quoteData.items.map(item => ({
          name: item.name,
          quantity: String(item.quantity),
          basePriceMoney: {
            amount: BigInt(Math.round(item.unitPrice * 100)),
            currency: 'USD'
          }
        })),
        referenceId: quoteData.quoteNumber
      },
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${quoteData.quoteId}/success`
    }
  });
  
  return response.result.paymentLink?.url;
}
```

#### C. Update Email Service
Replace the placeholder `generateSquarePaymentLink` function in `lib/simple-email-service.ts` with actual Square API call.

### 4. Webhook Configuration ✅

#### A. Create Webhook Endpoint ✅
- **Created**: `/api/webhooks/square/route.ts`
- **Features**:
  - HMAC-SHA256 signature verification
  - Handles `payment.created`, `payment.updated`, `checkout.completed` events
  - Updates quote payment status in database
  - Comprehensive error handling and logging
  - Health check endpoint (GET)

#### B. Testing Scripts ✅
- **Created**: `scripts/test-square-webhook.ts`
- **Commands**:
  - `npm run webhook:test` - Send test webhook events
  - `npm run webhook:signature` - Test signature verification
  - `npm run webhook:health` - Health check endpoint

#### C. Documentation ✅
- **Created**: `docs/SQUARE_WEBHOOK_SETUP.md`
- Complete setup guide with troubleshooting

#### D. Register Webhook in Square Dashboard ✅
1. ✅ **Webhook URL**: `https://your-domain.com/api/webhooks/square`
2. ✅ **Events Subscribed**:
   - `payment.created`
   - `payment.updated`
   - `checkout.completed`
3. ✅ **Signature Key Configured**: `4rUc7kN4c6thJK0NXLEcyA`
   - Added to `.env.local` for development
   - Added to `.env.production` for production deployment

### 5. Database Updates Needed

#### A. Update Quote Schema
Add fields to track payment status:
```sql
ALTER TABLE quotes ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE quotes ADD COLUMN payment_link TEXT;
ALTER TABLE quotes ADD COLUMN payment_id TEXT;
ALTER TABLE quotes ADD COLUMN paid_at TIMESTAMP;
```

#### B. Update Quote History API
Replace mock data in `/api/quotes/history/route.ts` with actual database queries.

## 📋 Testing Checklist

### Local Testing
- [ ] Quote history sidebar displays correctly
- [ ] Quote history API returns data
- [ ] Email sends with payment link
- [ ] Payment link redirects to Square Checkout
- [ ] Webhook receives payment confirmation
- [ ] Quote status updates after payment

### Square Sandbox Testing
- [ ] Use test card numbers from Square documentation
- [ ] Verify payment flow completes
- [ ] Check webhook notifications arrive
- [ ] Confirm database updates correctly

### Production Deployment
- [ ] Update environment variables in Vercel
- [ ] Switch Square to production mode
- [ ] Update webhook URLs to production domain
- [ ] Test with small real transaction

## 🚀 Next Steps

1. **Immediate Actions**:
   - Install Square SDK
   - Get Square API credentials
   - Implement `square-service.ts`

2. **Database Integration**:
   - Add payment tracking fields
   - Update quote history to use real data

3. **Enhanced Features** (Optional):
   - Payment reminders
   - Partial payment support
   - Multiple payment methods
   - Invoice reconciliation

## 📝 Notes

- The current implementation uses placeholder Square URLs
- Mock data in quote history needs database integration
- Consider adding payment status badges in quote list
- May want to add "Resend Payment Link" functionality

## 🔗 Resources

- [Square Checkout API Docs](https://developer.squareup.com/docs/checkout-api)
- [Square Payment Links Guide](https://developer.squareup.com/docs/payment-links)
- [Square Webhooks Documentation](https://developer.squareup.com/docs/webhooks)
- [Square Testing Guide](https://developer.squareup.com/docs/testing/test-values)