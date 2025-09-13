# Domain-Wide Delegation Setup for Gmail API

## Current Situation
Your service account `signature-quote-emailer@signatureqoute.iam.gserviceaccount.com` needs domain-wide delegation to access Gmail API.

## Option 1: Google Workspace Admin Setup (If you have admin access)

### Step 1: Get Service Account Client ID
1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click on: `signature-quote-emailer@signatureqoute.iam.gserviceaccount.com`
3. Go to: "Details" tab
4. Copy the "Unique ID" (this is your Client ID)

### Step 2: Set Up Domain-Wide Delegation
1. Go to: https://admin.google.com
2. Navigate to: Security → API Controls → Domain-wide Delegation
3. Click: "Add new"
4. Enter:
   - **Client ID**: (from Step 1)
   - **OAuth Scopes**: `https://www.googleapis.com/auth/gmail.send`
5. Click: "Authorize"

## Option 2: Personal Gmail Account (If no Workspace admin access)

If you don't have Google Workspace admin access, you can use your personal Gmail account:

### Step 1: Update Service Account Configuration
```typescript
// In your Gmail service, update the subject field
const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/gmail.send'],
  subject: 'ekosolarize@gmail.com', // Your personal Gmail address
});
```

### Step 2: Grant Permission in Gmail
1. Go to: https://myaccount.google.com/security
2. Enable: "2-Step Verification" (required for app passwords)
3. Go to: https://myaccount.google.com/apppasswords
4. Generate an app password for your service account

## Option 3: Use Gmail API with User Authentication

Instead of service account, use OAuth2 user authentication:

### Step 1: Update OAuth Scopes
In your OAuth consent screen, ensure you have:
- `https://www.googleapis.com/auth/gmail.send`

### Step 2: Update Gmail Service
```typescript
// Use OAuth2 instead of service account
const auth = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/auth/callback/google'
);
```

## Testing After Setup

Once you've set up domain-wide delegation, test with:

```bash
npx tsx scripts/test-service-account.ts
```

## Expected Results

If successful, you should see:
```
✅ Gmail API accessible. Sender email: ekosolarize@gmail.com
✅ Test email sent successfully
```

## Troubleshooting

### Error: "access_denied"
- **Cause**: Domain-wide delegation not configured
- **Solution**: Complete the delegation setup in Google Workspace Admin

### Error: "invalid_grant"
- **Cause**: Incorrect subject email
- **Solution**: Ensure subject matches the email you want to send from

### Error: "insufficient_scope"
- **Cause**: Missing Gmail send scope
- **Solution**: Add `https://www.googleapis.com/auth/gmail.send` to delegation

---

**Created**: January 12, 2025
**Status**: Ready for implementation
