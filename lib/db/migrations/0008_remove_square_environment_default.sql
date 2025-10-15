-- Migration: Remove default value from square_environment column
-- This ensures the environment is only set when a user connects via OAuth

-- Remove the default value
ALTER TABLE "users" ALTER COLUMN "square_environment" DROP DEFAULT;

-- Optional: Update any existing 'sandbox' values to NULL where user isn't actually connected
-- (where there's no access token)
UPDATE "users"
SET "square_environment" = NULL
WHERE "square_access_token" IS NULL
  AND "square_merchant_id" IS NULL;
