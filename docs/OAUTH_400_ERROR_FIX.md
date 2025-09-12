# OAuth 400 Error Fix Guide

## Problem
- **Error**: "Access blocked: Authorization Error"
- **Code**: Error 400: invalid_request
- **Cause**: Google OAuth 2.0 policy compliance issue

## Quick Fix Checklist

### 1. ✅ Verify OAuth Consent Screen Status

**In Google Cloud Console:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Check the **Publishing status**:
   - If **"Testing"**: Add your email as a Test User
   - If **"In production"**: Should work for all users

**To add Test Users (if in Testing mode):**
1. Scroll down to **Test users**
2. Click **+ ADD USERS**
3. Add: `ekosolarize@gmail.com`
4. Click **SAVE**

### 2. ✅ Check Redirect URIs Match Exactly

**Current Vercel URL**: `https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app`

**In Google Cloud Console:**
1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. **Authorized JavaScript origins**:
   ```
   https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app
   ```
4. **Authorized redirect URIs**:
   ```
   https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/api/auth/callback/google
   ```
5. Click **SAVE**

### 3. ✅ Verify Environment Variables

**In Vercel Dashboard:**
1. Go to **Settings** → **Environment Variables**
2. Ensure these are set:
   ```
   NEXTAUTH_URL=https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app
   NEXTAUTH_SECRET=your-secret-here
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### 4. ✅ Check OAuth Client Type

**In Google Cloud Console:**
1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Verify **Application type** is **"Web application"**
4. If not, create a new one with correct type

## Step-by-Step Fix Process

### Step 1: Update Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**: SignatureQuoteCrawler
3. **Navigate to OAuth consent screen**:
   - Go to **APIs & Services** → **OAuth consent screen**
   - If status is "Testing", add `ekosolarize@gmail.com` as a test user
   - If you want to go to production, click "PUBLISH APP"

4. **Update OAuth credentials**:
   - Go to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Update **Authorized JavaScript origins**:
     ```
     https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app
     ```
   - Update **Authorized redirect URIs**:
     ```
     https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/api/auth/callback/google
     ```
   - Click **SAVE**

### Step 2: Verify Vercel Environment Variables

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: signaturequoteai
3. **Go to Settings** → **Environment Variables**
4. **Verify these variables exist**:
   ```
   NEXTAUTH_URL=https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app
   NEXTAUTH_SECRET=your-generated-secret
   GOOGLE_CLIENT_ID=your-oauth-client-id
   GOOGLE_CLIENT_SECRET=your-oauth-client-secret
   ```

### Step 3: Test the Fix

1. **Redeploy your app** (if you made changes)
2. **Test the OAuth flow**:
   - Go to your app: https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app
   - Click "Sign in with Google"
   - Should now work without the 400 error

## Common Issues & Solutions

### Issue 1: "This app isn't verified"
- **Solution**: Add your email as a test user in OAuth consent screen

### Issue 2: "Redirect URI mismatch"
- **Solution**: Ensure redirect URI exactly matches: `/api/auth/callback/google`

### Issue 3: "Invalid client"
- **Solution**: Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Issue 4: "Invalid request"
- **Solution**: Verify `NEXTAUTH_URL` matches your actual domain

## Testing Commands

Test your environment variables:
```bash
# Test environment variables
curl https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/api/test-env
```

## Verification Checklist

- [ ] OAuth consent screen has your email as test user (if in testing mode)
- [ ] Redirect URI exactly matches: `https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/api/auth/callback/google`
- [ ] JavaScript origin matches: `https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app`
- [ ] OAuth client type is "Web application"
- [ ] All environment variables are set in Vercel
- [ ] `NEXTAUTH_URL` matches your Vercel deployment URL
- [ ] App has been redeployed after changes

## Date Created
January 12, 2025
