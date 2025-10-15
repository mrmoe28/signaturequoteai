# Square Checkout Link - Production Testing Guide

## Production URL
🌐 **https://signaturequoteai-main.vercel.app**

## Current Configuration Status

✅ **Square OAuth App ID**: sq0idp-Y9CUVriPCyP_6...
✅ **Square Client Secret**: Configured
✅ **Square Environment**: Production (Real payments!)
✅ **Production Deployment**: Live and ready

## ⚠️ IMPORTANT: Production Environment

**This is PRODUCTION mode - all payments are REAL!**
- Real credit cards will be charged
- Money will be transferred to your Square account
- Use caution when testing

## Step-by-Step Production Testing

### Step 1: Verify Square OAuth Redirect URI

Before testing, ensure your Square app has the correct redirect URI:

1. Go to https://developer.squareup.com/apps
2. Open your application
3. Click **OAuth** in the left sidebar
4. Under **Redirect URLs**, add:
   ```
   https://signaturequoteai-main.vercel.app/api/integrations/square/callback
   ```
5. Click **Save**

### Step 2: Sign In to Production

1. Open: **https://signaturequoteai-main.vercel.app**
2. Sign in with your account
   - Use Google OAuth or email/password
   - Create an account if you don't have one

### Step 3: Connect Square Account (Production)

1. Navigate to: **https://signaturequoteai-main.vercel.app/settings**
2. Scroll to **"Square Integration"** section
3. Click **"Connect Square Account"**
4. You'll be redirected to Square OAuth
5. **Sign in with your PRODUCTION Square account**
   - ⚠️ Make sure it's your production account, not sandbox
6. Authorize the application
7. You'll be redirected back with Square connected ✅

### Step 4: Create a Test Quote

1. Go to: **https://signaturequoteai-main.vercel.app/quotes/new**
2. Fill in customer details:
   ```
   Customer Name: Test Customer (or real customer)
   Customer Email: your-email@example.com (use your email for testing)
   Company: Test Solar Company
   ```
3. Add products to the quote
4. Review the totals

### Step 5: Send the Quote (Generates Payment Link)

1. Click **"Send Quote"** button
2. The system will:
   - ✅ Generate a PDF of the quote
   - ✅ Create a **REAL Square payment link** via Square API
   - ✅ Send email to customer with the payment link

### Step 6: Check Your Email

1. Check the email inbox (customer email you entered)
2. You should receive an email with:
   - Quote details and PDF attachment
   - **"Pay Now with Square"** button
   - Direct Square checkout link

### Step 7: Test the Square Checkout Link

**🔗 Click the payment link** - You have two options:

#### Option A: Complete a Real Test Payment (Small Amount)
- The checkout will show the full quote amount
- Use a real credit/debit card
- **Money will be charged for real**
- Payment goes to your Square account
- You can refund it later from Square Dashboard

#### Option B: Just Verify the Link Works (No Payment)
- Click the link to verify it opens Square checkout
- Check that the amount is correct
- Check that quote details are displayed
- **DO NOT complete the payment** if you don't want to be charged
- Close the browser tab

## 🧪 Testing Checklist

- [ ] Production site accessible: https://signaturequoteai-main.vercel.app
- [ ] Square OAuth redirect URI configured in Square Dashboard
- [ ] User account created and logged in
- [ ] Square account connected (Production)
- [ ] Test quote created successfully
- [ ] Quote sent - email received
- [ ] Payment link opens Square checkout page
- [ ] Checkout shows correct quote amount
- [ ] Checkout displays quote number/reference

## 🔍 Verification Steps

### Verify Square Connection
1. Go to: https://signaturequoteai-main.vercel.app/settings
2. Should see: **"✅ Connected to Square"**
3. Should show your Square Merchant ID

### Verify Payment Link in Email
Email should contain:
- Quote number (e.g., "Quote Q-2025-001")
- Customer name
- Total amount
- **"Pay Now with Square"** button (prominent)
- Direct payment link URL starting with `https://squareup.com/` or `https://checkout.square.site/`

### Verify Square Checkout Page
The checkout should show:
- Your Square business name
- Quote number in description
- Correct total amount
- Payment form (card details)
- **Merchant name matches YOUR Square account**

## 🚨 Troubleshooting

### Payment Link Not Generated

**Check 1: Square Connection**
```
Go to Settings → Verify "Connected to Square" status
If not connected, reconnect Square OAuth
```

**Check 2: Square OAuth Token**
```
Square tokens expire - may need to reconnect
Settings → Disconnect → Reconnect Square
```

**Check 3: Production Logs**
```
vercel logs https://signaturequoteai-main.vercel.app --follow
```

### OAuth Connection Fails

**Redirect URI Mismatch**
- Square Dashboard → OAuth → Redirect URLs must include:
  `https://signaturequoteai-main.vercel.app/api/integrations/square/callback`

**Wrong Environment**
- Ensure using **production** Square account (not sandbox)
- Check SQUARE_ENVIRONMENT=Production in Vercel settings

### Email Not Sent

**Check Email Configuration**
```bash
vercel env ls production | grep EMAIL
```

Ensure these are set:
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_APP_PASSWORD`
- `SUPPORT_EMAIL`

## 🎯 Quick Production Test

Here's the fastest way to test:

```bash
# 1. Open production site
open https://signaturequoteai-main.vercel.app/settings

# 2. Connect Square (in browser)
# 3. Create quote (in browser)
# 4. Check payment link in email
```

## 💡 Best Practices for Production Testing

1. **Use Small Amounts**: Test with quotes under $10 if using real payments
2. **Use Your Own Email**: Send test quotes to yourself
3. **Refund Immediately**: If you complete a test payment, refund from Square Dashboard
4. **Test During Off-Hours**: Avoid confusing real customers
5. **Mark Test Quotes**: Use "TEST" prefix in quote numbers

## 🔐 Security Reminders

- ✅ Never share Square access tokens
- ✅ Keep Square Client Secret encrypted in Vercel
- ✅ OAuth tokens auto-refresh (handled by system)
- ✅ All payment data handled by Square (PCI compliant)
- ✅ No card data stored in your database

## 📊 Monitoring Production Payments

### Square Dashboard
- Go to: https://squareup.com/dashboard
- Check **Payments** for incoming transactions
- Payment description will include quote number

### Application Logs
```bash
# Real-time production logs
vercel logs https://signaturequoteai-main.vercel.app --follow

# Filter for payment-related logs
vercel logs https://signaturequoteai-main.vercel.app | grep -i "payment\|square"
```

### Database Check
```bash
# Check quotes sent
npm run db:studio
# Or use Drizzle Studio to view quotes table
```

## 📞 Support

### Square Support
- Dashboard: https://squareup.com/dashboard
- Developer: https://developer.squareup.com/apps
- Docs: https://developer.squareup.com/docs

### Application Issues
Check:
1. Vercel deployment logs
2. Square API status: https://status.squareup.com/
3. Email delivery logs

---

## ✅ Ready to Test?

### Quick Start:
1. **Open**: https://signaturequoteai-main.vercel.app/settings
2. **Connect**: Your production Square account
3. **Create**: A test quote
4. **Send**: Quote to your email
5. **Test**: Click the payment link

### Expected Result:
✅ Quote email sent
✅ Payment link works
✅ Square checkout displays correct amount
✅ Ready for real customers!

---

**Current Status**: Production environment ready for testing 🚀

**Next Step**: Go to https://signaturequoteai-main.vercel.app/settings and connect Square!
