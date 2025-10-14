-- Add payment tracking fields to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_id TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add indexes for payment fields
CREATE INDEX IF NOT EXISTS quotes_payment_status_idx ON quotes(payment_status);
CREATE INDEX IF NOT EXISTS quotes_paid_at_idx ON quotes(paid_at);
CREATE INDEX IF NOT EXISTS quotes_deleted_at_idx ON quotes(deleted_at);