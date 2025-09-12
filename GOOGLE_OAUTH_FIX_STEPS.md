# Google OAuth Fix Steps - Desktop Commander Guide

## ✅ COMPLETED: Fixed NEXTAUTH_URL
- Changed from `http://localhost:3001` to `http://localhost:3000`
- Restarted dev server
- Verified environment variables are correct

## 🔧 NEXT: Fix Google Cloud Console OAuth Settings

### Step 1: Open Google Cloud Console
I've opened the credentials page for you. If it didn't open, go to:
https://console.cloud.google.com/apis/credentials

### Step 2: Find Your OAuth Client
Look for the OAuth 2.0 Client ID that starts with: `2443491941***`
(This matches your GOOGLE_CLIENT_ID)

### Step 3: Edit the OAuth Client
Click on the OAuth client name to edit it.

### Step 4: Update Authorized JavaScript Origins
Add this URL:
```
http://localhost:3000
```

### Step 5: Update Authorized Redirect URIs
Add this URL:
```
http://localhost:3000/api/auth/callback/google
```

### Step 6: Save Changes
Click "Save" at the bottom of the page.

### Step 7: Test Google Sign-In
1. Go to your app: http://localhost:3000
2. Try to sign in with Google
3. It should work now!

## 🚨 If Still Getting "Error 400: invalid_request"

### Check OAuth Consent Screen
1. Go to "OAuth consent screen" in the left sidebar
2. If it says "Testing", add your Google account as a Test User
3. Or change it to "Production" if you want anyone to sign in

### Verify Client Type
Make sure your OAuth client is of type "Web application" (not Desktop or Mobile)

## 📝 Your Current OAuth Client Details
- Client ID: 244349194151-kl4okrqvd0rafr388f8ic4tn8qcsolh.apps.googleusercontent.com
- Client Secret: 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
- Required Redirect URI: http://localhost:3000/api/auth/callback/google
- Required Origin: http://localhost:3000

## ✅ Verification
After making these changes, test the Google sign-in flow. The error should be resolved!