# Environment Variables Reference

## Required Environment Variables for New Google Cloud Project

### OAuth Authentication
```bash
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"                    # Local development
NEXTAUTH_URL="https://your-domain.com"                 # Production
NEXTAUTH_SECRET="your-nextauth-secret-here"            # Generate with: openssl rand -base64 32

# Google OAuth Credentials (from OAuth 2.0 Client ID)
GOOGLE_CLIENT_ID="your-oauth-client-id"                # From Google Cloud Console
GOOGLE_CLIENT_SECRET="your-oauth-client-secret"        # From Google Cloud Console
```

### Gmail API (Service Account)
```bash
# Gmail API Credentials (from Service Account JSON)
GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"  # From JSON file
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"  # From JSON file
```

### Application URLs
```bash
# App URL for email links and redirects
NEXT_PUBLIC_APP_URL="http://localhost:3000"            # Local development
NEXT_PUBLIC_APP_URL="https://your-domain.com"         # Production
```

## Complete .env.local Example

```bash
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwx"

# Gmail API Service Account
GOOGLE_CLIENT_EMAIL="signature-quote-emailer@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Where to Get Each Variable

| Variable | Source | Location |
|----------|--------|----------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client ID | Google Cloud Console → APIs & Services → Credentials |
| `GOOGLE_CLIENT_EMAIL` | Service Account JSON | Google Cloud Console → IAM & Admin → Service Accounts → Keys |
| `GOOGLE_PRIVATE_KEY` | Service Account JSON | Google Cloud Console → IAM & Admin → Service Accounts → Keys |
| `NEXTAUTH_SECRET` | Generated | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app URL | Local: `http://localhost:3000`, Prod: `https://your-domain.com` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | Same as NEXTAUTH_URL |

## Important Notes

### Private Key Formatting
The `GOOGLE_PRIVATE_KEY` must preserve the `\n` characters:
```bash
# ✅ Correct
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"

# ❌ Wrong (missing \n)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...-----END PRIVATE KEY-----"
```

### URL Requirements
- **Local development**: Use `http://localhost:3000`
- **Production**: Use your actual domain with `https://`
- **Redirect URI**: Must be exactly `/api/auth/callback/google`

### Security
- Never commit these variables to git
- Use different credentials for dev/prod
- Rotate keys periodically
- Store securely in Vercel environment variables

## Testing

Use the test script to verify all variables are set correctly:
```bash
node scripts/test-new-google-setup.js
```

This will check:
- All required variables are present
- Gmail API connection works
- OAuth credentials are valid
- NextAuth configuration is correct
