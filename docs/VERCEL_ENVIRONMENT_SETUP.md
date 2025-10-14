# Vercel Environment Variables Setup Guide

## Overview

This guide shows you how to configure all necessary environment variables in Vercel for production deployment.

---

## 🚀 Quick Setup via Vercel Dashboard

1. Go to: https://vercel.com/ekoapps/signaturequoteai-main/settings/environment-variables

2. Add each variable below with **Environment: Production**

---

## 📋 Required Environment Variables

### Application Configuration

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://signaturequoteai-main.vercel.app
```

### Authentication

```bash
AUTH_SECRET=<generate-a-secure-random-string-minimum-32-characters>
NEXTAUTH_URL=https://signaturequoteai-main.vercel.app
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Google OAuth

```bash
AUTH_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
AUTH_GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

Get these from: https://console.cloud.google.com/apis/credentials

### Database (NeonDB)

```bash
DATABASE_URL=<your-neondb-connection-string>
```

Get this from: https://console.neon.tech → Your Project → Connection String

### Gmail SMTP (for sending quote emails)

```bash
GOOGLE_CLIENT_EMAIL=<your-gmail@gmail.com>
GOOGLE_APP_PASSWORD=<your-gmail-app-specific-password>
```

**How to get Gmail App Password:**
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)" → "SignatureQuoteAI"
4. Click "Generate"
5. Copy the 16-character password

### Square Payment Integration

```bash
SQUARE_ENVIRONMENT=production
SQUARE_APPLICATION_ID=<your-square-application-id>
SQUARE_ACCESS_TOKEN=<your-production-square-access-token>
SQUARE_LOCATION_ID=<your-square-location-id>
SQUARE_WEBHOOK_SIGNATURE_KEY=<your-webhook-signature-key>
```

Get these from: https://developer.squareup.com/apps

### Support & Operations

```bash
SUPPORT_EMAIL=<your-support-email@gmail.com>
VERCEL_CRON_SECRET=<generate-a-random-string>
```

### Optional Configuration

```bash
CRAWLER_DELAY_MS=1000
CRAWLER_MAX_RETRIES=3
CRAWLER_TIMEOUT_MS=30000
API_RATE_LIMIT_PER_MINUTE=60
LOG_LEVEL=info
```

---

## 🖥️ Alternative: Setup via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Login
vercel login

# Add each variable
vercel env add NODE_ENV production
# Enter: production

vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://signaturequoteai-main.vercel.app

vercel env add AUTH_SECRET production
# Enter: <your-generated-secret>

vercel env add NEXTAUTH_URL production
# Enter: https://signaturequoteai-main.vercel.app

vercel env add AUTH_GOOGLE_CLIENT_ID production
# Enter: <your-google-client-id>.apps.googleusercontent.com

vercel env add AUTH_GOOGLE_CLIENT_SECRET production
# Enter: <your-google-client-secret>

vercel env add DATABASE_URL production
# Enter: <your-database-url>

vercel env add GOOGLE_CLIENT_EMAIL production
# Enter: <your-gmail@gmail.com>

vercel env add GOOGLE_APP_PASSWORD production
# Enter: <your-app-password>

vercel env add SQUARE_ENVIRONMENT production
# Enter: production

vercel env add SQUARE_APPLICATION_ID production
# Enter: <your-square-application-id>

vercel env add SQUARE_ACCESS_TOKEN production
# Enter: <your-production-square-access-token>

vercel env add SQUARE_LOCATION_ID production
# Enter: <your-square-location-id>

vercel env add SQUARE_WEBHOOK_SIGNATURE_KEY production
# Enter: <your-webhook-signature-key>

vercel env add SUPPORT_EMAIL production
# Enter: <your-support-email@gmail.com>

vercel env add VERCEL_CRON_SECRET production
# Enter: <random-string>
```

---

## ✅ Verification Checklist

After adding all variables:

- [ ] All required variables added to Vercel
- [ ] AUTH_SECRET generated and added (minimum 32 characters)
- [ ] Gmail App Password created and added
- [ ] Square webhook configured with notification URL
- [ ] Support email configured
- [ ] Vercel deployment triggered (automatic after adding vars)
- [ ] Check deployment logs: `vercel logs --follow`
- [ ] Test authentication on production site
- [ ] Test quote creation and email sending
- [ ] Test Square payment link generation

---

## 🔒 Security Notes

1. **Never commit credentials** to git
2. **Rotate secrets regularly** (AUTH_SECRET, API keys)
3. **Use production credentials** only in production environment
4. **Monitor access logs** in Vercel dashboard
5. **Enable Vercel authentication** if needed for staging

---

## 🚨 Troubleshooting

### Issue: Deployment fails with "Missing environment variable"

**Solution:**
1. Check variable name spelling in Vercel dashboard
2. Ensure variable is set for "Production" environment
3. Redeploy: `vercel --prod`

### Issue: Square payments not working

**Solution:**
1. Verify `SQUARE_ENVIRONMENT=production` in Vercel
2. Check Square access token is production token (not sandbox)
3. Verify webhook URL is configured in Square dashboard

### Issue: Emails not sending

**Solution:**
1. Verify `GOOGLE_CLIENT_EMAIL` is correct Gmail address
2. Check `GOOGLE_APP_PASSWORD` is the 16-character app password
3. Ensure 2FA is enabled on Gmail account
4. Test with: https://signaturequoteai-main.vercel.app/api/test-email

### Issue: Database connection errors

**Solution:**
1. Verify `DATABASE_URL` includes `?sslmode=require&channel_binding=require`
2. Check NeonDB is active in Neon dashboard
3. Ensure connection string is from pooler endpoint

---

## 📚 Additional Resources

- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **Square Production Credentials**: https://developer.squareup.com/apps
- **NeonDB Connection**: https://console.neon.tech

---

## 🔄 After Setup

Once all variables are configured:

1. **Deploy to production**:
   ```bash
   git push origin main
   # Vercel auto-deploys
   ```

2. **Verify deployment**:
   ```bash
   vercel logs --follow
   ```

3. **Test the application**:
   - Visit: https://signaturequoteai-main.vercel.app
   - Login with Google OAuth
   - Create a test quote
   - Send quote via email
   - Test Square payment link

---

**Environment setup is critical for production deployment!** ✅
