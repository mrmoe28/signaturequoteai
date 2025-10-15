# 🚀 Test Square Checkout Link - Quick Start

## ✅ Production Status: READY TO TEST

**Production URL**: https://signaturequoteai-main.vercel.app

### Current Configuration ✅
- ✅ Site is live and accessible
- ✅ Square OAuth configured (Production)
- ✅ Square Application ID: sq0idp-Y9CUViPCvP_6...
- ✅ Environment: Production (REAL payments)

---

## 🎯 Quick Test (5 Minutes)

### Step 1: Connect Square (First Time Only)

1. **Open**: https://signaturequoteai-main.vercel.app/settings
2. **Click**: "Connect Square Account" button
3. **Authorize**: Your production Square account
4. **Confirm**: "✅ Connected to Square" appears

### Step 2: Create & Send Test Quote

1. **Go to**: https://signaturequoteai-main.vercel.app/quotes/new
2. **Fill in**:
   - Customer Name: Test Customer
   - Customer Email: **YOUR_EMAIL@example.com** (use your real email!)
   - Company: Test Company
3. **Add products** to the quote
4. **Click**: "Send Quote"

### Step 3: Check Email & Test Link

1. **Check your email inbox**
2. **Open** the quote email
3. **Click**: "Pay Now with Square" button
4. **Verify**: Square checkout page opens with correct amount

✅ **Done!** Your Square checkout link is working!

---

## ⚠️ CRITICAL: Square OAuth Redirect URI

**Before testing, verify this is configured in Square Dashboard:**

1. Go to: https://developer.squareup.com/apps
2. Open your app → **OAuth** tab
3. Under **Redirect URLs**, add:
   ```
   https://signaturequoteai-main.vercel.app/api/integrations/square/callback
   ```
4. Click **Save**

❌ **If this is missing, OAuth connection will fail!**

---

## 🧪 Testing Options

### Option A: Full Test with Small Payment
- Complete the checkout with a **real card**
- Use a **small amount** (e.g., $5-$10 quote)
- Money will be charged to your Square account
- Refund later from Square Dashboard

### Option B: Verify Link Only (No Payment)
- Just verify the checkout page opens
- Check amount is correct
- Check quote details are shown
- **Close the page** without completing payment

---

## 🔍 What to Verify

When you click the payment link, you should see:

✅ Square checkout page opens
✅ Shows your business name (from Square account)
✅ Shows quote number (e.g., "Quote Q-2025-001")
✅ Shows correct total amount
✅ Payment form ready to accept card details

---

## 🚨 Troubleshooting

### "OAuth Connection Failed"
**Fix**: Add redirect URI to Square Dashboard (see above ☝️)

### "Payment link not in email"
**Possible causes**:
1. Square not connected → Go to Settings and connect
2. Email configuration issue → Check Vercel environment variables
3. Quote send failed → Check browser console for errors

### "Wrong amount in checkout"
**Check**: Quote total was calculated correctly before sending

---

## 📊 Quick Verification Script

Run this to verify production is ready:

```bash
npx tsx scripts/test-production-square.ts
```

This checks:
- ✅ Production site accessibility
- ✅ Square OAuth configuration
- ✅ Correct redirect URIs

---

## 📝 Complete Testing Guides

For detailed step-by-step instructions:
- **Production Testing**: `SQUARE_CHECKOUT_PRODUCTION_TEST.md`
- **Local Testing**: `SQUARE_CHECKOUT_TEST_GUIDE.md`

---

## 🎬 Start Testing Now!

### Quick Link:
👉 **https://signaturequoteai-main.vercel.app/settings**

1. Connect Square
2. Create quote
3. Send to your email
4. Test the payment link

**Estimated time**: 5 minutes

---

## 🔐 Security Note

This is **PRODUCTION** environment:
- Real Square account
- Real payment processing
- Real money transfers

Test responsibly! 💰

---

## ✅ Success Checklist

- [ ] Square OAuth redirect URI configured in Square Dashboard
- [ ] Opened production site: https://signaturequoteai-main.vercel.app
- [ ] Connected Square account (Settings page)
- [ ] Created test quote
- [ ] Sent quote to email
- [ ] Received email with payment link
- [ ] Clicked payment link
- [ ] Square checkout page opened
- [ ] Verified correct amount displayed

**All checked? Your Square integration is working! 🎉**
