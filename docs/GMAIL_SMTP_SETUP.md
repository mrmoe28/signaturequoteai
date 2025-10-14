# Gmail SMTP Setup for Password Reset Emails

## Quick Setup Guide

### 1. Enable 2-Factor Authentication
- Go to [Google Account Settings](https://myaccount.google.com/)
- Click "Security" in the left sidebar
- Enable 2-Step Verification if not already enabled

### 2. Generate App Password
- Go to [App Passwords](https://myaccount.google.com/apppasswords)
- Select "Mail" as the app
- Select "Other" as the device and enter "SignatureQuoteAI"
- Copy the 16-character app password (format: xxxx xxxx xxxx xxxx)

### 3. Update Environment Variables
Edit your `.env.local` file:

```bash
# Replace with your actual Gmail address
EMAIL_FROM=your-email@gmail.com
GOOGLE_CLIENT_EMAIL=your-email@gmail.com

# Replace with the 16-character app password from step 2
EMAIL_PASSWORD=your-app-password-here
GOOGLE_APP_PASSWORD=your-app-password-here
```

### 4. Test the Setup
1. Start your development server: `npm run dev`
2. Go to `/auth/reset`
3. Enter an email address that exists in your database
4. Check the server console for success/error messages

## Troubleshooting

### "Invalid credentials" error
- Double-check your email address
- Ensure you're using the App Password, not your regular Gmail password
- Make sure 2-Factor Authentication is enabled

### "Less secure app access" error
- Use App Passwords instead of "Less secure app access"
- App Passwords are more secure and don't require enabling less secure apps

### Still not working?
- Check that Gmail SMTP is not blocked by your ISP
- Try using a different email service (SendGrid, Mailgun, etc.)
- Contact your hosting provider about SMTP restrictions

## Production Setup

For production, consider using:
- **SendGrid** - Reliable email delivery service
- **Mailgun** - Email API service
- **AWS SES** - Amazon Simple Email Service
- **Resend** - Modern email API (already installed in this project)

These services provide better deliverability and analytics than Gmail SMTP.