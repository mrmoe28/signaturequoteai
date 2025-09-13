# Google OAuth Verification Guide

## Current Situation

Your SignatureQuoteCrawler app uses **sensitive OAuth scopes** that trigger Google's "unverified app" warnings:

- ✅ **Gmail API scope**: `https://www.googleapis.com/auth/gmail.send` (SENSITIVE)
- ✅ **User info scopes**: `userinfo.email`, `userinfo.profile` (Less sensitive)

## Impact of Unverified App Status

According to [Google's documentation](https://support.google.com/cloud/answer/7454865):

- ⚠️ **100 user limit**: Only 100 new users can sign up
- ⚠️ **"Unverified app" warnings**: Users see security warnings
- ⚠️ **Professional appearance**: May affect user trust
- ⚠️ **Verification required**: Must complete Google verification process

## Solution Options

### Option 1: Complete Google Verification (Recommended)

**Pros:**
- ✅ No user limits
- ✅ Professional appearance
- ✅ No security warnings
- ✅ Full Gmail functionality

**Requirements:**
1. **Privacy Policy** (✅ You have this)
2. **Terms of Service** (✅ You have this)
3. **Domain verification** (Required)
4. **App security assessment** (For sensitive scopes)

**Steps:**
1. **Verify domain ownership** in Google Search Console
2. **Update OAuth consent screen** with privacy policy URL
3. **Submit verification request** to Google
4. **Wait for approval** (can take several weeks)

### Option 2: Reduce Scope Sensitivity (Quick Fix)

**Remove Gmail scope and use alternative email service:**

```typescript
// In lib/auth.ts - Remove Gmail scope
Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // Remove Gmail scope to avoid verification
})
```

**Alternative email services:**
- SendGrid (recommended)
- Mailgun
- AWS SES
- Nodemailer with SMTP

### Option 3: Stay in Testing Mode (Temporary)

**Keep current setup but:**
- Add more test users as needed
- Accept the 100 user limit
- Plan for verification later

## Recommended Approach

### Phase 1: Immediate (This Week)
1. **Verify domain ownership** in Google Search Console
2. **Update OAuth consent screen** with privacy policy URL
3. **Submit verification request** to Google

### Phase 2: Backup Plan (If verification takes too long)
1. **Implement SendGrid** for email sending
2. **Remove Gmail scope** from OAuth
3. **Keep user authentication** with Google

## Step-by-Step Verification Process

### Step 1: Domain Verification

1. **Go to Google Search Console**: https://search.google.com/search-console
2. **Add property**: `signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app`
3. **Verify ownership** using one of these methods:
   - HTML file upload
   - HTML tag
   - Google Analytics
   - Google Tag Manager

### Step 2: Update OAuth Consent Screen

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select project**: SignatureQuoteCrawler
3. **Go to**: APIs & Services → OAuth consent screen
4. **Add privacy policy URL**: `https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/privacy-policy.html`
5. **Add terms of service URL**: `https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app/terms-of-service.html`
6. **Save changes**

### Step 3: Submit Verification Request

1. **In OAuth consent screen**, click **"Submit for verification"**
2. **Fill out verification form**:
   - App description
   - Data usage explanation
   - Security measures
3. **Submit request** to Google

### Step 4: Wait for Approval

- **Timeline**: 2-8 weeks typically
- **Status updates**: Check Google Cloud Console
- **Email notifications**: Google will contact you

## Alternative: SendGrid Implementation

If verification takes too long, implement SendGrid:

### Step 1: Create SendGrid Account
1. **Sign up**: https://sendgrid.com/
2. **Verify sender identity**
3. **Get API key**

### Step 2: Update Environment Variables
```bash
# Add to .env
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM_EMAIL=your_verified_email@domain.com
```

### Step 3: Update Email Service
```typescript
// Replace Gmail service with SendGrid
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendQuoteEmail(to: string, subject: string, html: string, pdfBuffer: Buffer) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL!,
    subject,
    html,
    attachments: [{
      content: pdfBuffer.toString('base64'),
      filename: 'quote.pdf',
      type: 'application/pdf',
      disposition: 'attachment'
    }]
  }
  
  return await sgMail.send(msg)
}
```

## Current App Status

✅ **Privacy Policy**: Available at `/privacy-policy.html`
✅ **Terms of Service**: Available at `/terms-of-service.html`
✅ **OAuth Configuration**: Properly set up
✅ **Gmail Integration**: Working with service account
⚠️ **Domain Verification**: Needs to be completed
⚠️ **Google Verification**: Not yet submitted

## Next Steps

1. **Complete domain verification** in Google Search Console
2. **Update OAuth consent screen** with policy URLs
3. **Submit verification request** to Google
4. **Monitor verification status** in Google Cloud Console
5. **Consider SendGrid backup** if verification is delayed

## Timeline

- **Domain verification**: 1-2 days
- **OAuth updates**: 1 day
- **Google verification**: 2-8 weeks
- **SendGrid backup**: 1-2 days (if needed)

## Support

If you need help with any of these steps, refer to:
- [Google OAuth Verification FAQ](https://support.google.com/cloud/answer/7454865)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- Your existing documentation in `/docs/` folder

---

**Created**: January 12, 2025
**Status**: Ready for implementation
