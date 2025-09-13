# Gmail API Scope Issue Fix

## Current Issue
- ✅ Gmail API is enabled in Google Cloud Console
- ✅ Service account credentials are configured correctly
- ✅ Access token can be obtained
- ❌ **Error**: "Request had insufficient authentication scopes"

## Root Cause
The service account `signature-quote-emailer@signatureqoute.iam.gserviceaccount.com` cannot access Gmail directly because:

1. **Service accounts cannot access Gmail by default** - they need domain-wide delegation
2. **Gmail API requires user authentication** for most operations
3. **Service accounts are meant for server-to-server APIs**, not Gmail access

## Solution Options

### Option 1: Use Gmail SMTP (Recommended - Simplest)

Your `.env.local` already has SMTP credentials:
```bash
GOOGLE_APP_PASSWORD="oysmzmpeqeewoarp"
```

**Pros:**
- ✅ Works immediately
- ✅ No OAuth verification needed
- ✅ Simple setup
- ✅ You already have the credentials

**Implementation:**
```typescript
// Use SMTP instead of Gmail API
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: process.env.GOOGLE_APP_PASSWORD
  }
});
```

### Option 2: Domain-Wide Delegation (Complex)

**Requirements:**
- Google Workspace domain
- Admin console access
- Complex setup

**Steps:**
1. Go to Google Workspace Admin Console
2. Navigate to Security → API Controls → Domain-wide Delegation
3. Add your service account client ID
4. Grant Gmail send scope

### Option 3: Use Different Email Service (Recommended)

**Alternatives:**
- SendGrid (recommended)
- Mailgun
- AWS SES
- Resend

## Recommended Solution: Switch to SMTP

Since you already have SMTP credentials, let's use that instead of the Gmail API:

### Step 1: Create SMTP Email Service

```typescript
// lib/smtp-email-service.ts
import nodemailer from 'nodemailer';

export async function sendQuoteEmailSMTP(data: {
  to: string;
  subject: string;
  html: string;
  text: string;
  pdfBuffer?: Buffer;
}) {
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'ekosolarize@gmail.com', // Your Gmail address
      pass: process.env.GOOGLE_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: 'ekosolarize@gmail.com',
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text,
    attachments: data.pdfBuffer ? [{
      filename: 'quote.pdf',
      content: data.pdfBuffer,
      contentType: 'application/pdf'
    }] : []
  };

  return await transporter.sendMail(mailOptions);
}
```

### Step 2: Update Your Email Service

Replace the Gmail API calls with SMTP calls in your quote sending logic.

## Why This Happened

The Gmail API is designed for applications that need to access **user's Gmail data**, not for sending emails on behalf of the application. Service accounts are meant for:

- Google Cloud APIs (Storage, Compute, etc.)
- Google Workspace APIs (with domain delegation)
- Server-to-server authentication

For sending emails, SMTP or dedicated email services are more appropriate.

## Next Steps

1. **Test SMTP approach** with your existing credentials
2. **Update email service** to use SMTP instead of Gmail API
3. **Remove Gmail API dependency** from your code
4. **Consider SendGrid** for production scalability

---

**Created**: January 12, 2025
**Status**: Ready for implementation
