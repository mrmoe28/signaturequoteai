# Square Checkout Link Testing Guide

## Overview
Your app is configured with Square OAuth integration. Users connect their own Square accounts to generate payment links for quotes.

## Current Configuration Status

✅ **Square OAuth App ID**: sq0idp-Y9CUVriPCyP_6...
✅ **Square Client Secret**: Configured
✅ **Square Environment**: Production
✅ **Application URL**: http://localhost:3000

## Testing the Square Checkout Link

### Step 1: Start the Development Server

```bash
npm run dev
```

The server should be running on http://localhost:3000

### Step 2: Create an Account / Sign In

1. Open your browser to: http://localhost:3000
2. Sign up or log in with your credentials
   - The app uses Stack Auth for authentication
   - You can use Google OAuth or email/password

### Step 3: Connect Your Square Account

1. Navigate to: http://localhost:3000/settings
2. Look for the "Square Integration" section
3. Click **"Connect Square Account"**
4. You'll be redirected to Square's OAuth page
5. Log in with your Square account (Production environment)
6. Authorize the application
7. You'll be redirected back to the app with Square connected

### Step 4: Create a Test Quote

1. Go to http://localhost:3000/quotes/new
2. Fill in customer details:
   - Customer Name: John Doe
   - Customer Email: test@example.com (or your email)
   - Company: Test Solar Company
3. Add products to the quote
4. Review totals

### Step 5: Send the Quote (Generates Payment Link)

1. Click **"Send Quote"** button
2. The system will:
   - Generate a PDF of the quote
   - Create a Square payment link using YOUR Square account
   - Send an email to the customer with the payment link
3. Check your email (or the test customer's email)
4. You should see an email with:
   - Quote details
   - **"Pay Now with Square"** button
   - Direct payment link URL

### Step 6: Test the Payment Link

1. Click the payment link in the email
2. You'll be redirected to Square's checkout page
3. The checkout will show:
   - Quote number
   - Total amount
   - Payment form

#### For Production Testing
- Use a real credit/debit card
- The payment will be processed through your Square account

#### For Sandbox Testing
If you want to test without real money:
1. Change `SQUARE_ENVIRONMENT=sandbox` in `.env.local`
2. Reconnect your Square sandbox account
3. Use Square test cards:
   - Card Number: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date
   - ZIP: Any 5 digits

## Alternative: Manual Payment Link Generation

If you want to test payment link generation directly via API:

```bash
# Run the end-to-end test script
npx tsx scripts/test-checkout-e2e.ts
```

This script will:
1. Find a user with Square connected
2. Create a test quote
3. Generate a real Square payment link
4. Display the link for testing

**Note**: This only works after you've connected Square via the UI in Step 3.

## Troubleshooting

### No Payment Link Generated

If the payment link isn't created:

1. **Check Square Connection**
   - Go to Settings and verify Square is connected
   - Check for "Connected to Square" status

2. **Check Environment Variables**
   ```bash
   # Verify Square config
   npx tsx scripts/test-checkout-link.ts
   ```

3. **Check Browser Console**
   - Open DevTools (F12)
   - Look for any errors when sending the quote

4. **Check Server Logs**
   - Look at your terminal where `npm run dev` is running
   - Check for Square API errors

### OAuth Connection Fails

If you can't connect to Square:

1. **Verify OAuth Credentials**
   - Square Application ID matches your Square app
   - Square Client Secret is correct
   - Redirect URI is configured in Square Dashboard:
     `http://localhost:3000/api/integrations/square/callback`

2. **Check Square Dashboard**
   - Go to https://developer.squareup.com/apps
   - Open your app
   - Go to OAuth settings
   - Add redirect URI if missing

### Email Not Sending

If emails aren't being sent:

1. **Check Email Configuration**
   - Gmail App Password is configured in `.env.local`
   - `GOOGLE_CLIENT_EMAIL` and `GOOGLE_APP_PASSWORD` are set

2. **Check Email Logs**
   - Server logs will show if email sending failed
   - You'll see "Quote email sent successfully" or error message

## Quick Test Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] User account created
- [ ] Logged in to the app
- [ ] Square account connected (Settings page)
- [ ] Test quote created
- [ ] Quote sent successfully
- [ ] Email received with payment link
- [ ] Payment link opens Square checkout
- [ ] Checkout displays correct amount

## Security Notes

- **Never share** your Square Access Token or Client Secret
- **Production mode** means real payments - be careful!
- **Always test** in sandbox mode first before going live
- **Test cards** only work in sandbox mode

## Support

If you encounter issues:

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure Square OAuth redirect URI is configured
4. Test with a simple quote first before complex ones

---

**Current Status**:
- ✅ Square is configured
- ⚠️  Need to connect Square account via UI (Step 3)
- ⏳ Ready to test once connected

**Next Step**: Go to http://localhost:3000/settings and connect your Square account!
