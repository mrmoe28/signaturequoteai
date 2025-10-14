# Vercel Environment Variables Update

## Required Action: Add Square Webhook Signature Key

You need to add the Square webhook signature key to your Vercel production environment.

### 🚀 **Add to Vercel Dashboard**

1. **Go to Vercel Project Settings**:
   - Visit: https://vercel.com/dashboard
   - Select your `signaturequoteai` project
   - Go to Settings → Environment Variables

2. **Add New Environment Variable**:
   ```
   Name: SQUARE_WEBHOOK_SIGNATURE_KEY
   Value: 4rUc7kN4c6thJK0NXLEcyA
   Environment: Production, Preview, Development
   ```

3. **Redeploy**:
   - After adding the variable, trigger a new deployment
   - The webhook endpoint will now work in production

### 🔧 **Alternative: Using Vercel CLI**

```bash
# Add environment variable via CLI
vercel env add SQUARE_WEBHOOK_SIGNATURE_KEY production
# When prompted, enter: 4rUc7kN4c6thJK0NXLEcyA

# Deploy with new environment variables
vercel --prod
```

### ✅ **Verification**

After deployment, test the webhook endpoint:

```bash
# Health check
curl https://your-domain.vercel.app/api/webhooks/square

# Should return:
# {"status":"ok","message":"Square webhook endpoint is active","timestamp":"2024-..."}
```

### 📝 **Current Vercel Environment Status**

Based on your `.env.vercel.production` file, you already have:
- ✅ Database connection configured
- ✅ Google OAuth configured  
- ✅ Email service configured
- ❌ **Missing**: `SQUARE_WEBHOOK_SIGNATURE_KEY` (needs to be added)

### 🔗 **Webhook URL for Square Dashboard**

Once deployed, register this URL in Square Dashboard:
```
https://your-domain.vercel.app/api/webhooks/square
```

Replace `your-domain` with your actual Vercel deployment URL.