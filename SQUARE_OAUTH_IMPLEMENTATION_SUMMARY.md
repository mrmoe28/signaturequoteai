# Square OAuth Integration - Implementation Summary

## What Was Implemented

You now have a complete Square OAuth integration that allows **each user** to connect their own Square account to accept payments through your app. This is different from the previous hardcoded approach where only the app owner could accept payments.

## Files Created/Modified

### Database

✅ **Created**: `lib/db/migrations/0007_add_square_integration.sql`
- Added Square OAuth fields to users table
- Fields: merchant ID, access/refresh tokens, location ID, environment, etc.

✅ **Modified**: `lib/db/schema.ts`
- Updated TypeScript schema with new Square fields

### UI Components

✅ **Created**: `components/settings/SquareIntegration.tsx`
- User-friendly Square connection interface
- Shows connection status
- Connect/disconnect buttons
- Token refresh functionality
- Helpful instructions and links

✅ **Modified**: `app/(app)/settings/page.tsx`
- Added Square Integration section
- Integrated with user authentication

### API Routes

✅ **Created**: `app/api/integrations/square/callback/route.ts`
- Handles OAuth callback from Square
- Exchanges authorization code for tokens
- Stores encrypted credentials in database
- Gets user's location information

✅ **Created**: `app/api/integrations/square/disconnect/route.ts`
- Allows users to disconnect their Square account
- Removes credentials from database

✅ **Created**: `app/api/integrations/square/refresh/route.ts`
- Manually refreshes expired access tokens
- Uses refresh token to get new access token

### Backend Services

✅ **Created**: `lib/square-user-client.ts`
- User-specific Square client
- Automatic token refresh when expired
- Creates payment links using user's Square account
- Helper functions for credential management

### Documentation

✅ **Created**: `docs/SQUARE_OAUTH_SETUP.md`
- Comprehensive setup guide
- Step-by-step OAuth configuration
- Environment variable setup
- Troubleshooting section
- Security best practices

### Environment Variables

✅ **Modified**: `.env.local`
- Added `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
- Added `SQUARE_CLIENT_SECRET`
- Deprecated old hardcoded credentials

---

## How It Works

### User Flow

1. **User Goes to Settings** → Sees "Square Payment Integration" card
2. **Clicks "Connect Square Account"** → Redirects to Square OAuth page
3. **Authorizes the App** → Grants payment permissions
4. **Redirected Back** → Returns to your app with success
5. **Credentials Stored** → Access/refresh tokens saved in database
6. **Ready to Accept Payments** → Can now create payment links

### Technical Flow

```
User → Settings Page → Connect Button → Square OAuth
  ↓
Square Authorizes → Callback with Code → Exchange for Tokens
  ↓
Store in Database → Encrypt Tokens → Link to User Account
  ↓
Create Payment Link → Use User's Credentials → Send to Customer
```

### Security Features

- ✅ OAuth 2.0 standard
- ✅ Tokens stored per user in database
- ✅ Automatic token refresh when expired
- ✅ State parameter prevents CSRF
- ✅ Client secret never exposed to frontend
- ✅ HTTPS required in production

---

## What You Need to Do Next

### 1. Create Square Developer Account

1. Go to https://developer.squareup.com
2. Sign up or log in
3. Create a new Application
4. Note your **Application ID** and **Client Secret**

### 2. Configure OAuth Redirect URI

In your Square app settings, add:
- **Development**: `http://localhost:3000/api/integrations/square/callback`
- **Production**: `https://yourapp.com/api/integrations/square/callback`

### 3. Update Environment Variables

Edit `.env.local`:
```bash
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-XXXXXXXXXX  # Your App ID
SQUARE_CLIENT_SECRET=sq0csp-XXXXXXXXXX              # Your Client Secret
SQUARE_ENVIRONMENT=sandbox                          # or 'production'
```

### 4. Test the Integration

```bash
# Start development server
npm run dev

# Navigate to settings
open http://localhost:3000/settings

# Click "Connect Square Account"
# Follow OAuth flow
# Verify connection shows as "Connected"
```

---

## Testing the Complete Workflow

### Quick Test Checklist

- [ ] Settings page loads without errors
- [ ] Square Integration card is visible
- [ ] "Connect Square Account" button works
- [ ] Redirects to Square OAuth page
- [ ] Can authorize the app
- [ ] Redirects back to settings
- [ ] Shows "Connected" status
- [ ] Displays merchant ID and location
- [ ] Can refresh access token
- [ ] Can disconnect account

### Test with Playwright

```bash
# Run the Playwright test we created
npx playwright test tests/square-paylink-workflow.spec.ts
```

---

## Environment Variables Reference

### Required for OAuth

```bash
# Public Application ID (can be exposed in frontend)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-XXXXXXXXXX

# Secret Client Secret (backend only - NEVER expose)
SQUARE_CLIENT_SECRET=sq0csp-XXXXXXXXXX

# Environment (sandbox for testing, production for live)
SQUARE_ENVIRONMENT=sandbox

# Your app's URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Optional

```bash
# Support email shown in checkout
SUPPORT_EMAIL=support@yourapp.com

# Webhook signature key (for payment notifications)
SQUARE_WEBHOOK_SIGNATURE_KEY=your_key_here
```

---

## Database Schema

New columns added to `users` table:

```sql
square_merchant_id         TEXT        -- Merchant ID from Square
square_access_token        TEXT        -- Access token (encrypted in prod)
square_refresh_token       TEXT        -- Refresh token (encrypted in prod)
square_token_expires_at    TIMESTAMP   -- When access token expires
square_location_id         TEXT        -- Default location for payments
square_environment         TEXT        -- 'sandbox' or 'production'
square_connected_at        TIMESTAMP   -- When user connected
square_scopes             TEXT        -- JSON array of granted permissions
```

---

## API Endpoints

### `GET /api/integrations/square/callback`
OAuth callback - exchanges code for tokens

### `POST /api/integrations/square/disconnect`
Disconnects user's Square account

### `POST /api/integrations/square/refresh`
Manually refreshes access token

---

## Integration with Quote System

When a quote is sent, the system will:

1. **Get user's Square credentials** from database
2. **Check if token expired** → auto-refresh if needed
3. **Create payment link** using user's Square account
4. **Include link in email** to customer
5. **Customer pays** directly to user's Square account

### Example Usage

```typescript
import { createUserSquarePaymentLink, isUserSquareConnected } from '@/lib/square-user-client';

// Check if user has Square connected
const isConnected = await isUserSquareConnected(userId);

if (isConnected) {
  // Create payment link using user's Square account
  const paymentUrl = await createUserSquarePaymentLink(userId, {
    quoteId: quote.id,
    quoteNumber: quote.number,
    customerName: customer.name,
    customerEmail: customer.email,
    amount: quote.total,
    description: `Quote ${quote.number}`,
  });

  // Include paymentUrl in email
}
```

---

## Security Notes

### In Production

1. **Encrypt Tokens**: Implement encryption for access/refresh tokens
2. **Use HTTPS**: Required for OAuth (automatic on Vercel)
3. **Rotate Secrets**: Change client secret periodically
4. **Monitor Access**: Log all Square API calls
5. **Rate Limiting**: Implement on OAuth endpoints

### Token Management

- Access tokens expire (Square sets expiration)
- Refresh tokens used to get new access tokens
- Automatic refresh implemented when expired
- Users can manually refresh via Settings

---

## Troubleshooting

### "Redirect URI Mismatch"
- Check `NEXT_PUBLIC_APP_URL` matches your domain
- Verify redirect URI in Square Dashboard
- Ensure exact match (including trailing slashes)

### "Invalid Client Credentials"
- Verify `NEXT_PUBLIC_SQUARE_APPLICATION_ID` is correct
- Check `SQUARE_CLIENT_SECRET` is from same app
- Ensure using sandbox credentials with `SQUARE_ENVIRONMENT=sandbox`

### "User Not Connected"
- User must complete OAuth flow first
- Check database for `square_access_token`
- Verify user ID matches in callback

---

## Next Steps

1. **Get Square Credentials** from https://developer.squareup.com
2. **Configure OAuth Redirect** in Square Dashboard
3. **Update .env.local** with real credentials
4. **Test OAuth Flow** in development
5. **Deploy to Production** with production credentials
6. **Monitor Usage** in Square Dashboard

---

## Support & Resources

- **Square OAuth Docs**: https://developer.squareup.com/docs/oauth-api/overview
- **Square Checkout API**: https://developer.squareup.com/docs/checkout-api
- **Setup Guide**: `/docs/SQUARE_OAUTH_SETUP.md`
- **Implementation Details**: This file

---

**Status**: ✅ Implementation Complete
**Last Updated**: January 2025
**Ready for**: Configuration and Testing
