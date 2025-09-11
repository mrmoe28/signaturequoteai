# Gmail SMTP Setup Guide

This guide will help you set up Gmail SMTP authentication for sending quote emails.

## Prerequisites

- A Gmail account
- Access to Google Account settings
- 2-Factor Authentication enabled

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Sign in with your Gmail account
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the setup process to enable 2FA
5. You'll need a phone number for verification

### 2. Generate App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **App passwords**
3. You may need to sign in again
4. Select **Mail** as the app
5. Select **Other (Custom name)** as the device
6. Enter "Signature QuoteCrawler" as the name
7. Click **Generate**
8. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### 3. Add to Environment Variables

Add the App Password to your `.env.local` file:

```bash
# Gmail SMTP Configuration
GOOGLE_APP_PASSWORD="your-16-character-app-password-here"
```

**Important:** 
- Remove any spaces from the App Password
- Keep the quotes around the password
- Don't share this password publicly

### 4. Restart Development Server

After adding the App Password, restart your development server:

```bash
npm run dev
```

## Testing

Once configured, the email service will automatically use SMTP instead of simulation. You can test by:

1. Creating a quote
2. Clicking "Send Quote"
3. Check the console logs for "Sending real quote email" message
4. Verify the email arrives in the recipient's inbox

## Troubleshooting

### "Invalid login" Error
- Verify the App Password is correct (no spaces)
- Ensure 2FA is enabled on your Google account
- Check that the email address matches your Gmail account

### "Less secure app access" Error
- This shouldn't happen with App Passwords
- Make sure you're using App Password, not your regular password

### Email Not Received
- Check spam/junk folder
- Verify the recipient email address is correct
- Check console logs for error messages

## Security Notes

- App Passwords are more secure than regular passwords
- Each App Password is unique and can be revoked independently
- Never commit App Passwords to version control
- Use environment variables for all sensitive credentials

## Production Deployment

For production (Vercel), add the App Password to your environment variables:

1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add `GOOGLE_APP_PASSWORD` with your App Password value
5. Redeploy your application

## Fallback Behavior

If no App Password is configured, the system will:
- Log a simulation message
- Return a success response
- Not send actual emails
- This allows development without email setup
