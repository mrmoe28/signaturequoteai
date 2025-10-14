# Complete Email Setup Guide

## Step 1: Get Gmail App Password

### Option A: Quick Setup (Recommended)
1. **Go to Google Account Security**: https://myaccount.google.com/security
2. **Enable 2-Factor Authentication** (if not already enabled)
3. **Go to App Passwords**: https://myaccount.google.com/apppasswords
4. **Create New App Password**:
   - Select "Mail" as the app
   - Select "Other" as device and type "SignatureQuoteAI"
   - Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

### Option B: Alternative Email Services
If Gmail doesn't work, you can use these alternatives:

**Resend (Recommended for production)**
```bash
npm install resend
# Get API key from https://resend.com
RESEND_API_KEY=your-resend-api-key
```

**SendGrid**
```bash
# Get API key from https://sendgrid.com
SENDGRID_API_KEY=your-sendgrid-api-key
```

## Step 2: Update Environment Variables

I'll help you update the `.env.local` file once you have the app password.

## Step 3: Test the Setup

After configuration, we'll test the password reset flow to ensure everything works.

---

## Current Status
✅ Email service code is ready  
⏳ Waiting for Gmail App Password  
⏳ Environment configuration  
⏳ Testing  

**Next Action**: Please generate a Gmail App Password using the steps above, then share it with me (it's safe to share as it's app-specific and can be regenerated).