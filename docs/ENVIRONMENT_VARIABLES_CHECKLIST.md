# Environment Variables Checklist

## Required Environment Variables for SignatureQuoteCrawler

Based on code analysis, here are ALL the environment variables your application uses:

### 🔐 Authentication & OAuth
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXTAUTH_URL` | ✅ | NextAuth base URL | `https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app` |
| `NEXTAUTH_SECRET` | ✅ | NextAuth secret key | `your-generated-secret-here` |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth 2.0 Client ID | `123456789-abcdefghijklmnop.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth 2.0 Client Secret | `GOCSPX-abcdefghijklmnopqrstuvwx` |

### 📧 Gmail API (Service Account)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ | Service account email | `signature-quote-emailer@project.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | ✅ | Service account private key | `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----` |

### 🗄️ Database
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | Database connection string | `postgresql://user:password@host:port/database` |

### 🌐 Application URLs
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL for links | `https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app` |

### 💳 Stripe (Optional)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | ❌ | Stripe secret key | `sk_test_...` |
| `STRIPE_PUBLIC_KEY` | ❌ | Stripe public key | `pk_test_...` |

### 🔄 OAuth Refresh Token (Legacy)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_REFRESH_TOKEN` | ❌ | OAuth refresh token (legacy) | `1//04...` |

### 📧 Legacy Email (Deprecated)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GOOGLE_APP_PASSWORD` | ❌ | Gmail app password (deprecated) | `oysmzmpeqeewoarp` |
| `GOOGLE_CLIENT_EMAIL` | ❌ | Gmail client email (deprecated) | `your-email@gmail.com` |

## Vercel Environment Variables Setup

### Step 1: Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Select your project: `signaturequoteai`
3. Go to **Settings** → **Environment Variables**

### Step 2: Required Variables to Set/Verify

#### ✅ Core Authentication
```bash
NEXTAUTH_URL=https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
```

#### ✅ Gmail API Service Account
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=signature-quote-emailer@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----
```

#### ✅ Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

#### ✅ Application URL
```bash
NEXT_PUBLIC_APP_URL=https://signaturequoteai-git-quote-pdf-improvements-ekoapps.vercel.app
```

### Step 3: Private Key Formatting Issue

**CRITICAL**: The `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` must be formatted correctly:

#### ❌ Wrong Format (causes errors):
```
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
```

#### ✅ Correct Format:
```
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
```

**Key Points:**
- Must be on a single line
- Use `\n` for line breaks (not actual newlines)
- Include the BEGIN/END markers
- Wrap in quotes

### Step 4: Clean Private Key Script

Use the provided script to clean your private key:

```bash
node scripts/clean-private-key.js "your-private-key-here"
```

## Testing Environment Variables

### Test All Variables
```bash
# Test environment variables
curl https://your-app.vercel.app/api/test-env

# Test database connectivity
curl https://your-app.vercel.app/api/test-db

# Test Gmail API
curl https://your-app.vercel.app/api/test-email
```

### Local Development Setup

Create `.env.local` for local development:

```bash
# Copy from Vercel environment variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
GOOGLE_SERVICE_ACCOUNT_EMAIL=signature-quote-emailer@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Issues & Solutions

### 1. Private Key Format Errors
- **Problem**: `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` has wrong format
- **Solution**: Use the cleaning script or manually format with `\n`

### 2. Missing Environment Variables
- **Problem**: Build fails due to missing variables
- **Solution**: Ensure all required variables are set in Vercel

### 3. URL Mismatches
- **Problem**: `NEXTAUTH_URL` doesn't match actual domain
- **Solution**: Update to match your Vercel deployment URL

### 4. Database Connection Issues
- **Problem**: `DATABASE_URL` is incorrect or database is not accessible
- **Solution**: Verify database URL and ensure database is running

## Verification Checklist

- [ ] All required environment variables are set in Vercel
- [ ] `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` is properly formatted
- [ ] `NEXTAUTH_URL` matches your Vercel deployment URL
- [ ] `NEXT_PUBLIC_APP_URL` matches your Vercel deployment URL
- [ ] Database is accessible from Vercel
- [ ] Gmail API credentials are valid
- [ ] OAuth credentials are valid
- [ ] Build completes successfully
- [ ] All test endpoints return success

## Date Created
January 12, 2025
