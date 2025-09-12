# New Google Cloud Project Setup Guide

This guide walks you through creating a completely new Google Cloud project from scratch for the SignatureQuoteCrawler application.

## Overview

Your application requires two main Google services:
1. **OAuth 2.0** - For user authentication (Google sign-in)
2. **Gmail API** - For sending quote emails with PDF attachments

## Step-by-Step Setup

### Step 1: Create New Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project**:
   - Click the project dropdown at the top
   - Click "New Project"
   - Project name: `SignatureQuoteCrawler` (or your preferred name)
   - Organization: Select your organization (if applicable)
   - Click "Create"
3. **Select the new project** from the dropdown to make it active

### Step 2: Enable Required APIs

#### Enable Gmail API
1. Go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on it and press "Enable"

#### Enable Google+ API (for OAuth)
1. In the same Library section
2. Search for "Google+ API" 
3. Click on it and press "Enable"

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace account)
3. Fill in the required fields:
   - **App name**: `SignatureQuoteCrawler`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click "Save and Continue"
5. **Scopes**: Add these scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
6. Click "Save and Continue"
7. **Test users**: Add your Google account as a test user
8. Click "Save and Continue"

### Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. **Name**: `SignatureQuoteCrawler Web Client`
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for development)
   - `https://your-production-domain.com` (for production)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://your-production-domain.com/api/auth/callback/google` (for production)
7. Click "Create"
8. **Save the credentials**:
   - Copy the Client ID
   - Copy the Client Secret
   - Or download the JSON file

### Step 5: Create Service Account for Gmail API

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. **Service account name**: `signature-quote-emailer`
4. **Description**: `Service account for sending quote emails via Gmail API`
5. Click "Create and Continue"
6. **Grant access**: Skip for now (click "Continue")
7. Click "Done"
8. **Create and download key**:
   - Click on your new service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create New Key" → "JSON"
   - Download and save the JSON file securely

### Step 6: Extract Credentials from Service Account JSON

From the downloaded service account JSON file, extract:
- `client_email` → This becomes `GOOGLE_CLIENT_EMAIL`
- `private_key` → This becomes `GOOGLE_PRIVATE_KEY`

**Important**: The private key needs to have `\n` line breaks preserved in the environment variable.

### Step 7: Update Environment Variables

#### For Local Development (.env.local):
```bash
# OAuth Credentials
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here"
GOOGLE_CLIENT_ID="your-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-oauth-client-secret"

# Gmail API Credentials (from service account JSON)
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### For Production (Vercel):
Add the same variables in your Vercel project settings, but with production URLs:
- `NEXTAUTH_URL="https://your-production-domain.com"`
- `NEXT_PUBLIC_APP_URL="https://your-production-domain.com"`

### Step 8: Test the Setup

Run the test script to verify everything is working:

```bash
node scripts/test-new-google-setup.js
```

This will test:
- ✅ OAuth credentials are present
- ✅ Gmail API credentials are present
- ✅ Gmail API connection works
- ✅ NextAuth configuration is correct

## Expected Results

After completing all steps:

**OAuth Authentication:**
- Users can sign in with Google
- No "Access blocked" or "Error 400" messages
- User profile information is accessible

**Gmail API:**
- Quote emails send successfully
- PDF attachments are included
- Professional email formatting

## Troubleshooting

### OAuth Issues
- **Error 400: invalid_request**: Check redirect URIs match exactly
- **Access blocked**: Verify test users are added to OAuth consent screen
- **Invalid client**: Check Client ID and Secret are correct

### Gmail API Issues
- **Credentials not configured**: Verify environment variables are set
- **Insufficient permission**: Check Gmail API is enabled
- **Invalid private key**: Ensure `\n` line breaks are preserved

### Common Mistakes
1. **Wrong redirect URI**: Must be exactly `/api/auth/callback/google`
2. **Missing test users**: Add your Google account to OAuth consent screen
3. **Wrong client type**: Must be "Web application", not Desktop or Mobile
4. **Private key formatting**: Must preserve `\n` characters in environment variable

## Security Best Practices

- ⚠️ Never commit the service account JSON file to git
- ⚠️ Store private keys securely
- ⚠️ Use separate service accounts for dev/prod
- ✅ Rotate keys periodically
- ✅ Monitor API usage in Google Cloud Console
- ✅ Use environment variables for all credentials

## Next Steps

1. **Complete the setup** following all steps above
2. **Test locally** with `npm run dev`
3. **Test Google sign-in** in your application
4. **Test quote email sending** with PDF attachments
5. **Deploy to production** with production URLs
6. **Monitor usage** in Google Cloud Console

## Support

If you encounter issues:
1. Check the test script output for specific error messages
2. Verify all environment variables are set correctly
3. Check Google Cloud Console for API usage and errors
4. Review the troubleshooting section above

Your new Google Cloud project will provide both authentication and email functionality for your SignatureQuoteCrawler application! 🚀
