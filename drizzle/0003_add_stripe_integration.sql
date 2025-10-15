-- Add Stripe integration columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_account_id" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_access_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_refresh_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_token_expires_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_connected_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_scopes" text;

-- Create index for stripe_account_id
CREATE INDEX IF NOT EXISTS "users_stripe_account_id_idx" ON "users" ("stripe_account_id");
