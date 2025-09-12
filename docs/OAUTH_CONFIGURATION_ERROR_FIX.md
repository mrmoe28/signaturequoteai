# OAuth Configuration Error Fix

## Problem
- **Error**: "Server error" with URL `?error=Configuration`
- **Cause**: OAuth configuration issue despite environment variables being set

## Current Status ✅
Environment variables are correctly set:
- `GOOGLE_CLIENT_ID`: `7098986664***` (correct format)
- `GOOGLE_CLIENT_SECRET`: 35 characters (correct length)
- `NEXTAUTH_URL`: `https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app`
- `NEXTAUTH_SECRET`: Set

## Most Likely Causes

### 1. **OAuth Client Configuration Mismatch**
The OAuth client in Google Cloud Console doesn't match your Vercel deployment.

### 2. **Redirect URI Not Configured**
The redirect URI in Google Cloud Console doesn't match your app.

### 3. **OAuth Consent Screen Issues**
The consent screen might not be properly configured.

## Step-by-Step Fix

### Step 1: Verify Google Cloud Console Configuration

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select project**: `SignatureQuoteCrawler`
3. **Go to**: APIs & Services → Credentials
4. **Click on**: "SignatureQuoteCrawler Web Client" (Client ID: `7098986664***`)

### Step 2: Check OAuth Client Settings

**Verify these settings match exactly:**

**Authorized JavaScript origins:**
```
https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app
```

**Authorized redirect URIs:**
```
https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/api/auth/callback/google
```

**Important**: 
- No trailing slashes
- Exact match (case-sensitive)
- Must include `https://`

### Step 3: Check OAuth Consent Screen

1. **Go to**: APIs & Services → OAuth consent screen
2. **Verify status**: "In production" ✅
3. **Check scopes**:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/gmail.send`

### Step 4: Test OAuth Flow

1. **Clear browser cache and cookies**
2. **Visit**: https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/auth/login
3. **Click**: "Sign in with Google"
4. **Should redirect to Google OAuth** (not error page)

## Common Issues & Solutions

### Issue 1: "Invalid redirect URI"
- **Solution**: Ensure redirect URI exactly matches in Google Cloud Console
- **Check**: No trailing slashes, correct protocol (https://)

### Issue 2: "Unauthorized client"
- **Solution**: Verify client ID matches exactly
- **Check**: No extra spaces or characters

### Issue 3: "Access blocked"
- **Solution**: Check OAuth consent screen is published
- **Check**: Add your email as test user if in testing mode

### Issue 4: "Configuration error"
- **Solution**: Verify all environment variables are set
- **Check**: NEXTAUTH_SECRET is generated (not empty)

## Verification Checklist

- [ ] OAuth client ID matches Vercel environment variable
- [ ] Redirect URI exactly matches: `/api/auth/callback/google`
- [ ] JavaScript origin exactly matches your Vercel URL
- [ ] OAuth consent screen is "In production"
- [ ] All required scopes are configured
- [ ] NEXTAUTH_SECRET is set and not empty
- [ ] Browser cache cleared

## Test Commands

```bash
# Test environment variables
curl https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/api/test-env

# Test OAuth endpoint
curl -I https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/auth/login
```

## If Still Not Working

1. **Create new OAuth client** in Google Cloud Console
2. **Update Vercel environment variables** with new credentials
3. **Wait for deployment** to complete
4. **Test again**

## Date Created
January 12, 2025
