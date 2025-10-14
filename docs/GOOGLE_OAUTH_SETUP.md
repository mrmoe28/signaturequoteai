# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for SignatureQuoteCrawler.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step-by-Step Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Enter project name: `SignatureQuoteCrawler` (or your preferred name)
4. Click **Create**

### 2. Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

### 3. Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **Create**
4. Fill in the required information:
   - **App name**: `SignatureQuoteCrawler`
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **Save and Continue**
6. Click **Add or Remove Scopes**
   - Select: `userinfo.email`, `userinfo.profile`, `openid`
7. Click **Save and Continue**
8. Add test users (your email) if in testing mode
9. Click **Save and Continue**

### 4. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type**: **Web application**
4. **Name**: `SignatureQuoteCrawler Web Client`
5. Under **Authorized redirect URIs**, add:

   **For Development:**
   ```
   http://localhost:3000/api/auth/callback/google
   ```

   **For Production (Vercel):**
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```

   **For Custom Domain:**
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

6. Click **Create**
7. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these!

### 5. Update Environment Variables

1. Open your `.env.local` file
2. Replace the placeholder values:

```bash
# Replace these with your actual credentials from step 4
AUTH_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
AUTH_GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

### 6. Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### 7. Test the OAuth Flow

1. Go to `http://localhost:3000/auth/register`
2. Click **Sign up with Google**
3. You should see the Google OAuth consent screen
4. Select your Google account
5. Grant permissions
6. You should be redirected back to your app and logged in!

## Troubleshooting

### Error: "redirect_uri_mismatch"
**Solution**: Make sure the redirect URI in Google Cloud Console EXACTLY matches:
```
http://localhost:3000/api/auth/callback/google
```
- Check for trailing slashes
- Verify the port number (3000)
- Ensure http:// (not https://) for localhost

### Error: "400 Bad Request"
**Solution**:
- Verify `AUTH_GOOGLE_CLIENT_ID` and `AUTH_GOOGLE_CLIENT_SECRET` are correct
- Make sure `AUTH_URL=http://localhost:3000` is set
- Restart your development server after changing env variables

### Error: "Access blocked: Authorization Error"
**Solutions**:
- Make sure you've added your email as a test user in OAuth consent screen
- Verify the OAuth consent screen is properly configured
- Check that required scopes are added

### Error: "idpiframe_initialization_failed"
**Solution**: This usually happens with browser privacy settings
- Allow third-party cookies for localhost
- Try a different browser or incognito mode

## Production Deployment (Vercel)

When deploying to Vercel:

1. Add environment variables in Vercel Dashboard:
   - `AUTH_SECRET` (same as in .env.local)
   - `AUTH_URL=https://your-app.vercel.app`
   - `AUTH_GOOGLE_CLIENT_ID`
   - `AUTH_GOOGLE_CLIENT_SECRET`

2. Add production redirect URI in Google Cloud Console:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

3. Redeploy your app

## Security Best Practices

✅ **DO**:
- Keep your `AUTH_SECRET` secure and never commit it to version control
- Use different OAuth credentials for development and production
- Regularly rotate your `AUTH_SECRET`
- Review OAuth scopes - only request what you need

❌ **DON'T**:
- Share your Client Secret publicly
- Use production credentials in development
- Commit `.env.local` to git (it's in .gitignore)

## Need Help?

- [NextAuth.js Documentation](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
