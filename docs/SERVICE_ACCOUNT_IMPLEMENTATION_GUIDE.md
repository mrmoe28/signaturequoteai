# Service Account Implementation Guide

Based on [Google OAuth 2.0 Service Account Documentation](https://developers.google.com/identity/protocols/oauth2/service-account#delegatingauthority)

## Current Implementation Analysis

Your SignatureQuoteCrawler app correctly uses service accounts for Gmail API access, but there are some improvements needed based on Google's best practices.

## Issues Identified

### 1. Service Account Subject Configuration

**Current Implementation:**
```typescript
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/gmail.send'],
  subject: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, // ⚠️ Incorrect
});
```

**Problem:** The `subject` field should be the **user's email** you want to send emails on behalf of, not the service account email.

### 2. Missing Domain-Wide Delegation

For sending emails on behalf of users, you need domain-wide delegation configured in Google Workspace Admin Console.

## Recommended Solutions

### Option 1: Use Service Account Email Directly (Simplest)

**Pros:**
- ✅ No domain-wide delegation needed
- ✅ Works immediately
- ✅ Simpler setup

**Cons:**
- ❌ Emails come from service account email
- ❌ Less professional appearance

**Implementation:**
```typescript
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/gmail.send'],
  // Remove subject field - use service account email directly
});
```

### Option 2: Domain-Wide Delegation (Professional)

**Pros:**
- ✅ Emails come from your business email
- ✅ Professional appearance
- ✅ Full control over sender identity

**Cons:**
- ❌ Requires Google Workspace domain
- ❌ More complex setup
- ❌ Admin console access needed

**Implementation:**
```typescript
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/gmail.send'],
  subject: process.env.BUSINESS_EMAIL, // User's email to send on behalf of
});
```

## Step-by-Step Implementation

### Step 1: Update Gmail Service Implementation

Create an improved version of your Gmail service:

```typescript
// lib/gmail-service-improved.ts
import { google } from 'googleapis';
import { createLogger } from './logger';

const logger = createLogger('gmail-service');

export interface GmailQuoteData {
  quoteId: string;
  quoteNumber?: string | null;
  customerName: string;
  customerEmail: string;
  customerCompany?: string | null;
  total: number;
  validUntil?: string | null;
  pdfBuffer?: Buffer;
  items?: Array<{ name: string; sku?: string | null; quantity: number; unitPrice: number; extended: number; }>;
}

// Initialize Gmail API with proper configuration
function getGmailService() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error('Gmail API credentials not configured. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY environment variables.');
  }

  const authConfig: any = {
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
  };

  // Add subject only if domain-wide delegation is configured
  if (process.env.BUSINESS_EMAIL) {
    authConfig.subject = process.env.BUSINESS_EMAIL;
    logger.info('Using domain-wide delegation for email sending');
  } else {
    logger.info('Using service account email directly');
  }

  const auth = new google.auth.JWT(authConfig);
  return google.gmail({ version: 'v1', auth });
}

// Enhanced error handling
export async function verifyGmailConnectivity(): Promise<{ ok: boolean; email?: string; error?: string }> {
  try {
    const gmail = getGmailService();
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return { ok: true, email: profile.data.emailAddress || undefined };
  } catch (error) {
    logger.error({ error }, 'Gmail connectivity check failed');
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendQuoteEmailGmail(data: GmailQuoteData) {
  try {
    if (!data.customerEmail) {
      throw new Error('Customer email is required');
    }

    const gmail = getGmailService();
    
    // Verify connectivity first
    const connectivity = await verifyGmailConnectivity();
    if (!connectivity.ok) {
      throw new Error(`Gmail API not accessible: ${connectivity.error}`);
    }

    // Create email content
    const htmlContent = generateQuoteEmailHTML(data);
    const textContent = generateQuoteEmailText(data);
    
    // Create email message
    const message = createEmailMessage({
      to: data.customerEmail,
      subject: `Quote ${data.quoteNumber || data.quoteId} - Signature Solar Equipment`,
      html: htmlContent,
      text: textContent,
      pdfBuffer: data.pdfBuffer,
      quoteNumber: data.quoteNumber || data.quoteId,
    });

    logger.info({ 
      quoteId: data.quoteId, 
      customerEmail: data.customerEmail,
      hasPdf: !!data.pdfBuffer,
      senderEmail: connectivity.email
    }, 'Sending quote email via Gmail API');

    // Send email
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: message,
      },
    });

    logger.info({ 
      messageId: result.data.id,
      quoteId: data.quoteId 
    }, 'Quote email sent successfully via Gmail API');

    return {
      success: true,
      messageId: result.data.id,
      message: 'Quote sent successfully via Gmail',
    };

  } catch (error) {
    logger.error({ error, quoteId: data.quoteId }, 'Error sending quote email via Gmail API');
    throw error;
  }
}

// ... rest of your existing functions remain the same
```

### Step 2: Environment Variables

Add these environment variables:

```bash
# Required for service account
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Optional: For domain-wide delegation
BUSINESS_EMAIL="your-business@yourdomain.com"

# App configuration
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### Step 3: Domain-Wide Delegation Setup (Optional)

If you want emails to come from your business email:

1. **Go to Google Workspace Admin Console**: https://admin.google.com
2. **Navigate to Security** → **API Controls** → **Domain-wide Delegation**
3. **Add new client**:
   - Client ID: Your service account's client ID
   - OAuth Scopes: `https://www.googleapis.com/auth/gmail.send`
4. **Authorize** the delegation

### Step 4: Test Implementation

Create a test script:

```typescript
// scripts/test-service-account.ts
import { verifyGmailConnectivity, sendQuoteEmailGmail } from '../lib/gmail-service-improved';

async function testServiceAccount() {
  console.log('🔍 Testing service account connectivity...');
  
  const connectivity = await verifyGmailConnectivity();
  if (connectivity.ok) {
    console.log(`✅ Gmail API accessible. Sender email: ${connectivity.email}`);
  } else {
    console.log(`❌ Gmail API not accessible: ${connectivity.error}`);
    return;
  }

  // Test sending email
  console.log('📧 Testing email sending...');
  try {
    const result = await sendQuoteEmailGmail({
      quoteId: 'test-123',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      total: 1000,
    });
    console.log('✅ Test email sent successfully:', result.messageId);
  } catch (error) {
    console.log('❌ Test email failed:', error.message);
  }
}

testServiceAccount();
```

## Best Practices from Documentation

### 1. **Secure Key Management**
- ✅ Store private keys as environment variables
- ✅ Use different keys for dev/prod
- ✅ Rotate keys periodically
- ✅ Never commit keys to version control

### 2. **Error Handling**
- ✅ Handle authentication failures gracefully
- ✅ Log errors for debugging
- ✅ Provide fallback mechanisms

### 3. **Client Library Usage**
- ✅ Use Google APIs client library (you're already doing this)
- ✅ Avoid manual JWT creation
- ✅ Let the library handle token refresh

## Common Errors and Solutions

### Error: "invalid_grant"
- **Cause**: Incorrect service account configuration
- **Solution**: Verify email and private key are correct

### Error: "insufficient_scope"
- **Cause**: Missing required scopes
- **Solution**: Ensure `gmail.send` scope is included

### Error: "access_denied"
- **Cause**: Domain-wide delegation not configured
- **Solution**: Either configure delegation or use service account email directly

## Recommended Approach

For your SignatureQuoteCrawler app:

1. **Start with Option 1** (service account email directly)
2. **Test thoroughly** with the improved implementation
3. **Consider Option 2** (domain-wide delegation) for production

This approach follows Google's best practices while keeping your implementation simple and maintainable.

---

**Created**: January 12, 2025
**Status**: Ready for implementation
