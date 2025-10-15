-- Migration: Add Square Integration Support
-- Description: Adds fields to users table for Square OAuth integration

-- Add Square integration fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS square_merchant_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS square_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS square_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS square_token_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS square_location_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS square_environment TEXT DEFAULT 'sandbox'; -- 'sandbox' or 'production'
ALTER TABLE users ADD COLUMN IF NOT EXISTS square_connected_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS square_scopes TEXT; -- JSON array of granted scopes

-- Create index for Square merchant lookups
CREATE INDEX IF NOT EXISTS users_square_merchant_id_idx ON users(square_merchant_id);

-- Comments for documentation
COMMENT ON COLUMN users.square_merchant_id IS 'Square merchant/seller ID from OAuth';
COMMENT ON COLUMN users.square_access_token IS 'Encrypted Square access token for API calls';
COMMENT ON COLUMN users.square_refresh_token IS 'Encrypted Square refresh token for token renewal';
COMMENT ON COLUMN users.square_token_expires_at IS 'When the Square access token expires';
COMMENT ON COLUMN users.square_location_id IS 'Default Square location ID for payments';
COMMENT ON COLUMN users.square_environment IS 'Square environment (sandbox/production)';
COMMENT ON COLUMN users.square_connected_at IS 'When user connected their Square account';
COMMENT ON COLUMN users.square_scopes IS 'JSON array of OAuth scopes granted by user';
