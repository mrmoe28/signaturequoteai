-- Add IP tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS registration_ip TEXT,
ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

-- Create index for faster IP lookups
CREATE INDEX IF NOT EXISTS users_registration_ip_idx ON users(registration_ip);
CREATE INDEX IF NOT EXISTS users_last_login_ip_idx ON users(last_login_ip);

-- Comment on columns
COMMENT ON COLUMN users.registration_ip IS 'IP address used during account registration';
COMMENT ON COLUMN users.last_login_ip IS 'IP address of most recent login';
