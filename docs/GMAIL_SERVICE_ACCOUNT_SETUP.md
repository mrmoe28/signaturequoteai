# Gmail Service Account Setup Guide

## Current Issue
Your Gmail API is not accessible because the service account credentials are missing:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Not set
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` - Not set

## Quick Setup Options

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
npx tsx scripts/setup-gmail-service-account.ts
```

This will:
1. Open Google Cloud Console
2. Create a service account
3. Download the JSON credentials
4. Save environment variables to `.env.local`

### Option 2: Manual Setup

#### Step 1: Go to Google Cloud Console

1. **Open**: https://console.cloud.google.com/
2. **Select your project**: SignatureQuoteCrawler (or create a new one)
3. **Navigate to**: IAM & Admin → Service Accounts

#### Step 2: Create Service Account

1. **Click**: "Create Service Account"
2. **Fill in**:
   - Name: `signature-quote-gmail-sender`
   - Description: `Service account for sending quote emails via Gmail API`
3. **Click**: "Create and Continue"
4. **Skip roles** (click "Continue")
5. **Click**: "Done"

#### Step 3: Create Service Account Key

1. **Click on** your new service account
2. **Go to**: "Keys" tab
3. **Click**: "Add Key" → "Create new key"
4. **Select**: "JSON" format
5. **Click**: "Create"
6. **Download** the JSON file

#### Step 4: Extract Credentials

From the downloaded JSON file, extract:

```json
{
  "client_email": "signature-quote-gmail-sender@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
}
```

#### Step 5: Set Environment Variables

**Local Development (.env.local):**
```bash
# Gmail API Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL="signature-quote-gmail-sender@your-project.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Optional: For domain-wide delegation
# BUSINESS_EMAIL="your-business@yourdomain.com"
```

**Production (Vercel):**
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add the same variables

#### Step 6: Enable Gmail API

1. **Go to**: APIs & Services → Library
2. **Search for**: "Gmail API"
3. **Click**: "Enable"

## Test the Setup

After setting up the credentials, test the connection:

```bash
npx tsx scripts/test-service-account.ts
```

## Expected Output

If successful, you should see:
```
🔍 Testing service account connectivity...
✅ Gmail API accessible. Sender email: signature-quote-gmail-sender@your-project.iam.gserviceaccount.com
📧 Testing email sending...
✅ Test email sent successfully: 18c1234567890abcdef
```

## Troubleshooting

### Error: "invalid_grant"
- **Cause**: Incorrect private key format
- **Solution**: Ensure the private key includes `\n` characters

### Error: "insufficient_scope"
- **Cause**: Gmail API not enabled
- **Solution**: Enable Gmail API in Google Cloud Console

### Error: "access_denied"
- **Cause**: Service account doesn't have Gmail access
- **Solution**: Ensure Gmail API is enabled and service account has proper permissions

## Security Notes

- ✅ Store private keys as environment variables
- ✅ Never commit credentials to version control
- ✅ Use different keys for dev/prod
- ✅ Rotate keys periodically

## Next Steps

After setting up the service account:

1. **Test the connection** with the test script
2. **Update your email service** to use the new credentials
3. **Deploy to production** with the environment variables
4. **Monitor email sending** for any issues

---

**Created**: January 12, 2025
**Status**: Ready for implementation
