# Password Reset 500 Error - Fix Guide

## 🔍 Problem Diagnosis

The password reset endpoint (`/api/auth/reset-password`) was returning a 500 error because:

1. **Missing Database Table** - The `password_reset_tokens` table doesn't exist in your database
2. **Database Connection** - DATABASE_URL needs to be configured with your actual NeonDB connection string
3. **Email Configuration** - Email credentials need to be set for sending reset emails

## ✅ What Was Fixed

### 1. Created Missing Migration
- **File**: `lib/db/migrations/0008_add_password_reset_tokens.sql`
- **Purpose**: Creates the `password_reset_tokens` table with proper indexes

### 2. Improved Error Logging
- **File**: `app/api/auth/reset-password/route.ts`
- **Change**: Now shows detailed error messages in development mode for easier debugging

### 3. Created Migration Runner Script
- **File**: `scripts/run-password-reset-migration.ts`
- **Purpose**: Runs the password_reset_tokens migration

## 🚀 Steps to Complete the Fix

### Step 1: Configure Database Connection

1. Open your `.env.local` file
2. Update the `DATABASE_URL` with your actual NeonDB connection string:

```bash
# Replace this placeholder:
DATABASE_URL=your_database_url_here

# With your actual NeonDB connection string (should look like this):
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

**Where to get your NeonDB connection string:**
- Go to [console.neon.tech](https://console.neon.tech)
- Select your project
- Go to "Connection Details"
- Copy the connection string

### Step 2: Configure Email Settings (for sending reset emails)

Add these to your `.env.local`:

```bash
# Gmail credentials for sending password reset emails
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

**How to get Gmail App Password:**
1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled
3. Search for "App passwords" in the settings
4. Generate a new app password for "Mail"
5. Copy the 16-character password (no spaces)

**Alternative**: Check `docs/GMAIL_SMTP_SETUP.md` for detailed Gmail setup instructions

### Step 3: Run the Migration

```bash
npx tsx scripts/run-password-reset-migration.ts
```

You should see:
```
✅ Migration completed successfully!
✅ password_reset_tokens table created
```

### Step 4: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 5: Test the Password Reset Flow

1. Go to: `http://localhost:3000/auth/reset-password` (or your forgot password page)
2. Enter an email address that exists in your database
3. Click "Send reset link"
4. Check for detailed error messages if it fails (they'll show in dev mode now)
5. Check your email for the reset link

## 🔧 Troubleshooting

### Error: "DATABASE_URL is not configured"
- Your `.env.local` file still has the placeholder value
- Update it with your actual NeonDB connection string

### Error: "Failed to send reset email"
- Check your EMAIL_FROM and EMAIL_PASSWORD are correct
- Verify you're using a Gmail App Password, not your regular password
- Check `docs/GMAIL_SMTP_SETUP.md` for setup instructions

### Error: "Invalid or expired reset token"
- This is normal if you're testing - tokens expire after 1 hour
- Request a new reset link

### Migration Already Ran
If you see "table already exists" - that's fine! The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

## 📊 Database Schema

The `password_reset_tokens` table structure:

```sql
CREATE TABLE "password_reset_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "expires" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "used" text DEFAULT 'false' NOT NULL
);

-- Indexes for performance
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" ("user_id");
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" ("token");
```

## ✨ What's Next

After completing these steps, your password reset flow should work:

1. User enters email on forgot password page
2. System generates secure token and saves to database
3. Email with reset link is sent to user
4. User clicks link and can set new password
5. Token is marked as used and cannot be reused

## 📝 Related Documentation

- `docs/DB_SETUP.md` - Complete database setup guide
- `docs/GMAIL_SMTP_SETUP.md` - Email configuration guide
- `docs/TROUBLESHOOTING.md` - General troubleshooting guide

---

**Fixed:** 2025-10-12
**By:** Claude Code
**Issue:** Password reset 500 error due to missing database table and configuration
