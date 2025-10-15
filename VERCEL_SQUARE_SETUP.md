# Vercel Square Environment Variables Setup

## Issue

The Square "Connect" button redirects to sign-in because Square OAuth credentials are not configured in Vercel.

## Solution

Add the following environment variables to Vercel for the production deployment.

### Required Environment Variables

```bash
# 1. Square Application ID (PUBLIC - can be exposed to browser)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-YOUR_APP_ID_HERE

# 2. Square Client Secret (SECRET - backend only)
SQUARE_CLIENT_SECRET=sq0csp-YOUR_CLIENT_SECRET_HERE

# 3. Square Environment (sandbox for testing, production for live)
SQUARE_ENVIRONMENT=sandbox
```

### How to Add to Vercel

#### Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/ekoapps/signaturequoteai-main/settings/environment-variables

2. Add each variable:
   - **Variable Name**: `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
   - **Value**: Your Square Application ID (starts with `sq0idp-`)
   - **Environment**: Production, Preview, Development (check all)
   - Click "Save"

3. Repeat for:
   - `SQUARE_CLIENT_SECRET` (your client secret)
   - `SQUARE_ENVIRONMENT` (value: `sandbox`)

4. **Redeploy** your application for changes to take effect

#### Option 2: Via Vercel CLI

```bash
# Set Application ID (public)
vercel env add NEXT_PUBLIC_SQUARE_APPLICATION_ID production
# Enter: sq0idp-YOUR_APP_ID

# Set Client Secret (private)
vercel env add SQUARE_CLIENT_SECRET production
# Enter: sq0csp-YOUR_SECRET

# Set Environment
vercel env add SQUARE_ENVIRONMENT production
# Enter: sandbox

# Also add for preview/development
vercel env add NEXT_PUBLIC_SQUARE_APPLICATION_ID preview development
vercel env add SQUARE_CLIENT_SECRET preview development
vercel env add SQUARE_ENVIRONMENT preview development

# Redeploy
vercel --prod
```

### Where to Get Square Credentials

1. **Go to Square Developer Dashboard**
   - https://developer.squareup.com/apps

2. **Create or Select Your App**
   - If you don't have an app, click "Create app"
   - Name it "SignatureQuoteAI" or similar

3. **Get Your Credentials**
   - Click on your app
   - Go to **Credentials** tab
   - For testing: Use **Sandbox** credentials
   - For production: Use **Production** credentials

4. **Copy the Values**
   - **Application ID**: Copy the value (starts with `sq0idp-`)
   - **Application Secret**: Copy the value (starts with `sq0csp-`)

### Configure OAuth Redirect URI in Square

**IMPORTANT**: You must also add the callback URL to your Square app:

1. In Square Developer Dashboard, go to **OAuth** tab
2. Add this redirect URL:
   ```
   https://signaturequoteai-main.vercel.app/api/integrations/square/callback
   ```
3. Click "Save"

### Testing the Integration

After adding environment variables and redeploying:

1. Go to https://signaturequoteai-main.vercel.app/settings

2. You should now see:
   - No red warning about "Square OAuth Not Configured"
   - "Connect Square Account" button is enabled

3. Click "Connect Square Account"
   - Should redirect to Square OAuth page (not sign-in page)
   - Authorize the app
   - Should redirect back to settings
   - Should show "Connected" status

### Troubleshooting

#### Still seeing "Not Configured" warning:
- Verify environment variables are added in Vercel dashboard
- Redeploy the application (`vercel --prod`)
- Check browser console for errors
- Clear browser cache

#### Button still redirects to sign-in:
- Check that `NEXT_PUBLIC_SQUARE_APPLICATION_ID` has the `NEXT_PUBLIC_` prefix
- Verify the value is not the placeholder `your_square_app_id_here`
- Redeploy after adding variables

#### "Redirect URI mismatch" error:
- Verify the redirect URI in Square Dashboard matches exactly:
  `https://signaturequoteai-main.vercel.app/api/integrations/square/callback`
- Check for trailing slashes
- Ensure protocol is `https://`

### Quick Verification Commands

```bash
# Check if variables are set in Vercel
vercel env ls

# Should see:
# NEXT_PUBLIC_SQUARE_APPLICATION_ID
# SQUARE_CLIENT_SECRET
# SQUARE_ENVIRONMENT

# Test the config endpoint
curl https://signaturequoteai-main.vercel.app/api/integrations/square/config

# Should return:
# {"configured": true, "applicationId": "sq0idp-...", "environment": "sandbox"}
```

### Current Status

- ✅ Code is deployed and ready
- ✅ Database migration applied
- ✅ API endpoints created
- ❌ Environment variables not configured (YOU ARE HERE)
- ⏳ Square OAuth redirect URI not added
- ⏳ Ready to test

### Next Step

**Add the environment variables in Vercel Dashboard now, then redeploy!**
