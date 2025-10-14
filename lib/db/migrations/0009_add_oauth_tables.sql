-- Migration: Add OAuth tables for NextAuth
-- Creates accounts and verification_tokens tables required for Google OAuth

-- Create accounts table for OAuth providers
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "provider_account_id" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text
);

-- Create indexes for accounts table
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id");
CREATE INDEX IF NOT EXISTS "accounts_provider_idx" ON "accounts" ("provider");
CREATE INDEX IF NOT EXISTS "accounts_provider_account_idx" ON "accounts" ("provider", "provider_account_id");

-- Create verification_tokens table for email verification
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL UNIQUE,
  "expires" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Create indexes for verification_tokens table
CREATE INDEX IF NOT EXISTS "verification_tokens_identifier_token_idx" ON "verification_tokens" ("identifier", "token");
CREATE INDEX IF NOT EXISTS "verification_tokens_token_idx" ON "verification_tokens" ("token");
