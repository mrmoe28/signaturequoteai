# Square Access Token Setup

Your current Square access token is **invalid or expired**. Follow these steps to generate a new one:

## 📋 Step 1: Go to Square Developer Dashboard

Visit: **https://developer.squareup.com/apps**

## 🔑 Step 2: Select Your Application

1. Log in to your Square account
2. Select your application (or create a new one)
3. You should see your app dashboard

## ⚙️ Step 3: Generate Personal Access Token

1. Click on **"Credentials"** in the left sidebar
2. Scroll to **"Personal Access Tokens"** section
3. Click **"Generate Token"**
4. **IMPORTANT**: Choose the correct environment:
   - For testing: **Sandbox**
   - For real payments: **Production**

## ✅ Step 4: Set Required Permissions

Make sure your token has these permissions:
- ✅ **Items** (ITEMS_READ, ITEMS_WRITE) - For catalog/subscription plans
- ✅ **Orders** (ORDERS_READ, ORDERS_WRITE) - For checkout orders
- ✅ **Payments** (PAYMENTS_READ, PAYMENTS_WRITE) - For processing payments
- ✅ **Subscriptions** (SUBSCRIPTIONS_READ, SUBSCRIPTIONS_WRITE) - For managing subscriptions
- ✅ **Customers** (CUSTOMERS_READ, CUSTOMERS_WRITE) - For customer management

## 📝 Step 5: Copy the Token

1. **Copy the generated token** (it will look like: `EAAAExxxxxxxxxxxxxx...`)
2. ⚠️ **Save it immediately** - Square only shows it once!

## 💻 Step 6: Update Vercel Environment Variable

Run this command (I'll help you with this after you get the token):

```bash
vercel env add SQUARE_ACCESS_TOKEN production
```

Then paste your new token when prompted.

## 🔍 Step 7: Verify the Token Works

After updating, we'll run:

```bash
npx tsx scripts/diagnose-square.ts
```

This should show ✅ for all API tests if the token is valid.

## 🚀 Step 8: Setup Subscription Plans

Once verified, run:

```bash
npx tsx scripts/setup-square-subscriptions.ts
```

This will create the Pro ($29) and Enterprise ($99) subscription plans in Square.

---

## 📌 Quick Reference

**What you need:**
- Environment: `production` (or `sandbox` for testing)
- Token format: Should start with `EAAA` (66 chars)
- Permissions: Items, Orders, Payments, Subscriptions, Customers

**Current Status:**
- ❌ Token is invalid/expired
- ✅ Environment variable fixed (removed newline)
- ⏳ Waiting for new token

---

Ready to generate your token? Let me know when you have it and I'll help you configure it!
