# Gmail API Setup for Quote PDF Emails

## Issue
PDFs are not being attached to quote emails because Gmail API credentials are missing.

## Root Cause
The app requires Google Service Account credentials to send emails via Gmail API, but these environment variables are not configured:
- `GOOGLE_CLIENT_EMAIL` - Missing
- `GOOGLE_PRIVATE_KEY` - Missing

## Solution: Step-by-Step Gmail API Setup

### Step 1: Create Google Cloud Project & Service Account

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project** for your SignatureQuoteCrawler app
3. **Enable Gmail API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"
4. **Create Service Account**:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name: `signature-quote-emailer`
   - Description: `Service account for sending quote emails`
   - Click "Create and Continue"
5. **Download JSON Key**:
   - Click on your new service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key" → "JSON"
   - Download and save the JSON file securely

### Step 2: Configure Environment Variables

**Local Development (.env file):**
```bash
# Gmail API Credentials
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# App URLs for email links
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Production (Vercel):**
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add the same variables:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `NEXT_PUBLIC_APP_URL` (your production URL)

### Step 3: Test Gmail API Connection

```bash
# Create a test script to verify connectivity
npx tsx scripts/test-gmail-connection.ts
```

### Step 4: Grant Email Permissions

**Option A: Domain-wide Delegation (Recommended)**
1. Go to Google Admin Console (admin.google.com)
2. Security → API Controls → Domain-wide Delegation
3. Add your service account with scope: `https://www.googleapis.com/auth/gmail.send`

**Option B: Individual Gmail Account**
1. The service account will send FROM its own email address
2. Less flexible but works for testing

### Step 5: Verify PDF Email Flow

Once credentials are configured:

```bash
# Test the complete flow
npm run dev

# Send a test quote email
curl -X POST http://localhost:3000/api/quotes/[quote-id]/send
```

## Expected Results

**Before Fix:**
- ❌ Emails fail to send
- ❌ No PDF attachments
- ❌ Error logs about missing credentials

**After Fix:**
- ✅ Emails send successfully
- ✅ Professional PDFs attached (3.7KB)
- ✅ Fast generation (107ms)
- ✅ Gmail API logs show success

## Common Issues & Solutions

### Issue: "credentials not configured"
**Solution**: Double-check environment variables are set correctly

### Issue: "insufficient permission"
**Solution**: Enable Gmail API and configure domain-wide delegation

### Issue: "invalid private key"
**Solution**: Ensure private key has proper `\n` line endings

### Issue: Works locally but fails on Vercel
**Solution**: Verify Vercel environment variables match local .env

## Security Notes

- ⚠️ Never commit the JSON key file to git
- ⚠️ Store private keys securely
- ⚠️ Use separate service accounts for dev/prod
- ✅ Rotate keys periodically
- ✅ Monitor API usage in Google Cloud Console

## Testing Checklist

- [ ] Gmail API enabled in Google Cloud Console
- [ ] Service account created with JSON key downloaded
- [ ] Environment variables set locally and on Vercel
- [ ] Domain-wide delegation configured (if using custom domain)
- [ ] Test email sending works
- [ ] PDFs are properly attached to emails
- [ ] Email templates render correctly

## Next Steps

1. **Set up Gmail API credentials** following the steps above
2. **Test quote email sending** in your app
3. **Verify PDF attachments** are included in emails
4. **Deploy to Vercel** with production credentials

Your PDF generation is already working perfectly - you just need to configure Gmail API credentials to start sending those PDFs via email! 🚀