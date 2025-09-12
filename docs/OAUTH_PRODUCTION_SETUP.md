# OAuth Production Setup Guide

## Moving from Testing to Production Mode

### Why Production Mode?
- ✅ **Anyone can sign in** (not just test users)
- ✅ **No user limit** (testing mode limited to 100 users)
- ✅ **Professional appearance** (no "unverified app" warnings)
- ✅ **Required for public applications**

## Step-by-Step Production Setup

### Step 1: Publish OAuth Consent Screen

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select project**: SignatureQuoteCrawler
3. **Navigate to OAuth consent screen**:
   - Go to **APIs & Services** → **OAuth consent screen**
4. **Check current status**:
   - If "Testing" → Click **"PUBLISH APP"**
   - If "In production" → Already done ✅
   - If "Needs verification" → See verification section below

### Step 2: Verify Required Information

**App Information:**
- **App name**: `SignatureQuoteCrawler`
- **User support email**: `ekosolarize@gmail.com`
- **Developer contact information**: `ekosolarize@gmail.com`
- **App logo**: Optional but recommended
- **App domain**: `signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app`
- **Authorized domains**: Add your Vercel domain

**Scopes (Current):**
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/userinfo.email` - Access email
- `https://www.googleapis.com/auth/userinfo.profile` - Access profile

### Step 3: Handle Google Verification (If Required)

**When verification is needed:**
- Apps with sensitive scopes (like Gmail access)
- Apps requesting user data
- Apps with high user volume

**Verification requirements:**
1. **Privacy Policy** - Required for sensitive scopes
2. **Terms of Service** - May be required
3. **App Security Assessment** - For high-risk apps
4. **Domain verification** - Verify you own the domain

### Step 4: Create Privacy Policy (Required)

**Add to your app:**
1. Create `/privacy-policy` page
2. Include information about:
   - What data you collect
   - How you use Gmail access
   - Data storage and security
   - User rights

**Example privacy policy sections:**
- Data collection (email, name, profile)
- Gmail usage (sending quote emails)
- Data storage (database)
- User rights (access, deletion)
- Contact information

### Step 5: Update OAuth Configuration

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

## Alternative: Reduce Scope Sensitivity

If you want to avoid verification, consider:

### Option 1: Remove Gmail Scope
```javascript
// In lib/auth.ts, remove Gmail scope
scopes: [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
]
```

### Option 2: Use Different Email Service
- SendGrid
- Mailgun
- AWS SES
- Nodemailer with SMTP

## Testing Production Mode

### Test Steps:
1. **Publish to production**
2. **Test with different Google accounts** (not in test users list)
3. **Verify OAuth flow works**
4. **Check for any warnings or errors**

### Test Commands:
```bash
# Test OAuth flow
curl -I https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/auth/login

# Test environment
node scripts/fix-oauth-config.js
```

## Monitoring and Maintenance

### After Going Live:
1. **Monitor OAuth usage** in Google Cloud Console
2. **Watch for verification requests** from Google
3. **Update privacy policy** as needed
4. **Respond to user feedback** about OAuth experience

### Common Issues:
- **"App not verified"** warning → Normal for new apps
- **Verification required** → Submit required documents
- **Scope changes** → May require re-verification

## Recommended Approach

For your business application:

1. **✅ Publish to production** with current scopes
2. **✅ Add privacy policy** to your app
3. **✅ Monitor for verification requests**
4. **✅ Prepare for potential verification process**

This allows anyone to use your app while you handle any verification requirements that may come up.

## Date Created
January 12, 2025
