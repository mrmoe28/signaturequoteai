# Square Integration Test Instructions

## Overview

This document provides instructions for testing the Square Payment Integration on the production settings page.

## Test Location

- **Production URL**: `https://signaturequoteai-main-it5qwudt2-ekoapps.vercel.app`
- **Settings Page**: `https://signaturequoteai-main-it5qwudt2-ekoapps.vercel.app/settings`

## Prerequisites

### 1. Square Developer Account
You need a Square Developer account to get test credentials:
- Go to https://developer.squareup.com
- Sign up or log in
- Create a new application (or use existing one)

### 2. Get Square Credentials

#### For Sandbox Testing (Recommended):
1. Navigate to your Square Developer Dashboard
2. Select your application
3. Go to **Credentials** → **Sandbox** tab
4. Copy the following:
   - **Sandbox Access Token** (starts with `EAAAl...`)
   - **Sandbox Location ID** (usually starts with `L...`)

#### For Production Testing (Use with caution):
1. Navigate to your Square Developer Dashboard
2. Select your application
3. Go to **Credentials** → **Production** tab
4. Copy the following:
   - **Production Access Token** (starts with `EAAA...`)
   - **Production Location ID**

### 3. User Account
You need a user account on the application:
- Email address
- Password

## Running the Automated Test

### Using Environment Variables

```bash
# Navigate to project directory
cd /Users/ekodevapps/Desktop/signaturequoteai-main

# Run test with your credentials
TEST_SQUARE_ACCESS_TOKEN="<your-square-access-token>" \
TEST_SQUARE_LOCATION_ID="<your-location-id>" \
TEST_USER_EMAIL="<your-email>" \
TEST_USER_PASSWORD="<your-password>" \
npx playwright test tests/square-integration-manual-test.spec.ts --headed
```

### Example with Sandbox Credentials

```bash
TEST_SQUARE_ACCESS_TOKEN="EAAAl1234567890abcdef..." \
TEST_SQUARE_LOCATION_ID="L1234567890ABC" \
TEST_USER_EMAIL="user@example.com" \
TEST_USER_PASSWORD="yourpassword" \
npx playwright test tests/square-integration-manual-test.spec.ts --headed
```

### Running Without Credentials

If you run the test without credentials, it will skip the test and show you the required environment variables:

```bash
npx playwright test tests/square-integration-manual-test.spec.ts
```

## Manual Testing Steps

If you prefer to test manually without the automated script:

### 1. Navigate to Settings Page
1. Open browser
2. Go to: `https://signaturequoteai-main-it5qwudt2-ekoapps.vercel.app`
3. Log in if prompted
4. Navigate to Settings page

### 2. Locate Square Integration Section
1. Scroll down to find "Square Payment Integration"
2. Look for the connection status badge:
   - Green "Connected" badge = Already connected
   - Gray "Not Connected" badge = Not connected

### 3. Test Connection

#### If Not Connected:
1. Click the "Setup" button to expand the section
2. Fill in the following fields:
   - **Square Access Token**: Paste your access token
   - **Square Location ID**: Paste your location ID
3. Click "Connect Square Account" button
4. Wait for the response (loading spinner should appear)
5. Check for:
   - Success alert message
   - Page redirect to `/settings?success=square_manual_connected`
   - Connection status changes to "Connected"

#### If Already Connected:
1. Click the "Setup" button to expand the section
2. You should see:
   - Green success message box
   - Location ID displayed
   - Environment (sandbox/production) displayed
   - Connection date displayed
3. Test disconnect:
   - Click "Disconnect Square Account"
   - Confirm the dialog
   - Verify status changes to "Not Connected"

### 4. Monitor Network Activity

Open browser DevTools (F12) and go to the Network tab:

1. **Before connecting**, look for:
   - `GET /api/users/{userId}/square-status`
   - Response should show current connection status

2. **During connection**, look for:
   - `POST /api/integrations/square/connect`
   - Request body: `{ "accessToken": "...", "locationId": "..." }`
   - Response should be `200 OK` with success message

3. **After connection**, look for:
   - `GET /api/users/{userId}/square-status`
   - Response should show updated connection details

### 5. Monitor Console for Errors

Open browser DevTools Console tab:

1. Look for any red error messages
2. Common errors to watch for:
   - 401 Unauthorized (authentication issues)
   - 404 User not found (database issues)
   - 500 Server error (API issues)
   - Network errors
   - CSP violations

### 6. Verify Database Update

After successful connection, verify in database:

```sql
SELECT
  id,
  email,
  square_connected,
  square_location_id,
  square_environment,
  square_connected_at
FROM users
WHERE email = 'your-email@example.com';
```

Expected results:
- `square_connected`: true
- `square_location_id`: Your location ID
- `square_environment`: 'sandbox' or 'production'
- `square_connected_at`: Recent timestamp

## Test Results

The automated test generates a detailed report including:

### 1. Test Steps
- Each step with success/failure status
- Timestamps for each step
- Screenshots for each step

### 2. Network Activity
- All API requests to Square endpoints
- Request headers and bodies
- Response status codes and bodies

### 3. Console Errors
- All JavaScript errors
- Type and message for each error

### 4. Final State
- Connection status (connected/not connected)
- Error messages if any
- Connection details if successful

### Results Location
Results are saved in: `/Users/ekodevapps/Desktop/signaturequoteai-main/test-results/square-integration/`

Files generated:
- `test-report-{timestamp}.json` - Detailed JSON report
- `{step-name}-{timestamp}.png` - Screenshots for each step

## Expected Outcomes

### Success Case
1. **Network Request**: `POST /api/integrations/square/connect`
2. **Response**:
   ```json
   {
     "success": true,
     "message": "Square account connected successfully",
     "environment": "sandbox",
     "locationId": "L..."
   }
   ```
3. **UI Changes**:
   - Alert shows "Square account connected successfully!"
   - Page redirects to `/settings?success=square_manual_connected`
   - Green success banner appears
   - Connection badge shows "Connected"
   - Connection details displayed (Location ID, Environment, Date)

### Failure Cases

#### 1. Missing Credentials
- **Alert**: "Please enter both Access Token and Location ID"
- **UI**: Connect button remains enabled, no network request

#### 2. Invalid Credentials
- **Response**:
  ```json
  {
    "error": "Failed to connect Square account..."
  }
  ```
- **Alert**: Shows error message
- **UI**: Connection status remains "Not Connected"

#### 3. User Not Found
- **Response**:
  ```json
  {
    "error": "User account not found in database. Please try logging out and back in."
  }
  ```
- **Status**: 404
- **UI**: Alert shows error message

#### 4. Database Update Failed
- **Response**:
  ```json
  {
    "error": "Failed to save Square credentials. Please try again."
  }
  ```
- **Status**: 500
- **UI**: Alert shows error message

## Troubleshooting

### Test Won't Run
- Ensure Playwright is installed: `npx playwright install`
- Check environment variables are set correctly
- Verify credentials are valid

### Login Fails
- Verify email and password are correct
- Check if account exists in production database
- Try manual login first

### Connection Fails
- Verify Square credentials are valid
- Check if using correct environment (sandbox vs production)
- Ensure access token matches location ID environment
- Check network tab for specific error messages

### Database Not Updated
- Verify user exists in database
- Check database connection is working
- Look for server logs for database errors

## Security Notes

1. **Never commit credentials** to version control
2. **Use sandbox for testing** - Don't use production credentials for testing
3. **Environment variables** - Always use environment variables for credentials
4. **Token security** - Square access tokens are sensitive, treat them like passwords
5. **HTTPS only** - All testing should be done over HTTPS

## Additional Resources

- [Square Developer Dashboard](https://developer.squareup.com/apps)
- [Square API Documentation](https://developer.squareup.com/reference/square)
- [Square Sandbox Testing](https://developer.squareup.com/docs/devtools/sandbox/overview)
- [Playwright Documentation](https://playwright.dev/)

## Contact

If you encounter issues during testing, check:
1. Browser console for JavaScript errors
2. Network tab for API errors
3. Test results directory for detailed logs
4. Server logs for backend errors
