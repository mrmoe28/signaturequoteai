-- Migration: Add customers table and migrate customer data from quotes
-- Created: 2025-10-14

-- Step 1: Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  country TEXT DEFAULT 'USA',
  notes TEXT,
  is_active TEXT DEFAULT 'true' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create indexes for customers table
CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);
CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(name);
CREATE INDEX IF NOT EXISTS customers_company_idx ON customers(company);
CREATE INDEX IF NOT EXISTS customers_is_active_idx ON customers(is_active);

-- Step 3: Migrate existing customer data from quotes to customers table
-- This creates unique customers based on email (if exists) or name+company combination
INSERT INTO customers (name, company, email, phone, country, created_at, updated_at)
SELECT DISTINCT ON (COALESCE(customer_email, customer_name || COALESCE(customer_company, '')))
  COALESCE(customer_name, 'Unknown Customer') as name,
  customer_company as company,
  customer_email as email,
  customer_phone as phone,
  'USA' as country,
  NOW() as created_at,
  NOW() as updated_at
FROM quotes
WHERE customer_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM customers
    WHERE (customers.email = quotes.customer_email AND quotes.customer_email IS NOT NULL)
       OR (customers.name = quotes.customer_name AND customers.company = quotes.customer_company)
  )
ON CONFLICT DO NOTHING;

-- Step 4: Add customer_id column to quotes table (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN customer_id UUID;
  END IF;
END $$;

-- Step 5: Populate customer_id in quotes table by matching customer data
UPDATE quotes q
SET customer_id = c.id
FROM customers c
WHERE q.customer_id IS NULL
  AND (
    (c.email = q.customer_email AND q.customer_email IS NOT NULL)
    OR (c.name = q.customer_name AND (c.company = q.customer_company OR (c.company IS NULL AND q.customer_company IS NULL)))
  );

-- Step 6: For any quotes that still don't have a customer_id, create a customer for them
DO $$
DECLARE
  quote_record RECORD;
  new_customer_id UUID;
BEGIN
  FOR quote_record IN
    SELECT id, customer_name, customer_company, customer_email, customer_phone
    FROM quotes
    WHERE customer_id IS NULL AND customer_name IS NOT NULL
  LOOP
    INSERT INTO customers (name, company, email, phone, country, created_at, updated_at)
    VALUES (
      COALESCE(quote_record.customer_name, 'Unknown Customer'),
      quote_record.customer_company,
      quote_record.customer_email,
      quote_record.customer_phone,
      'USA',
      NOW(),
      NOW()
    )
    RETURNING id INTO new_customer_id;

    UPDATE quotes SET customer_id = new_customer_id WHERE id = quote_record.id;
  END LOOP;
END $$;

-- Step 7: Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'quotes_customer_id_fkey' AND table_name = 'quotes'
  ) THEN
    ALTER TABLE quotes
    ADD CONSTRAINT quotes_customer_id_fkey
    FOREIGN KEY (customer_id) REFERENCES customers(id);
  END IF;
END $$;

-- Step 8: Create index on customer_id
CREATE INDEX IF NOT EXISTS quotes_customer_id_idx ON quotes(customer_id);

-- Step 9: Make customer_id NOT NULL (after all quotes have customer_id)
ALTER TABLE quotes ALTER COLUMN customer_id SET NOT NULL;

-- Step 10: Drop old customer columns from quotes table
ALTER TABLE quotes DROP COLUMN IF EXISTS customer_company;
ALTER TABLE quotes DROP COLUMN IF EXISTS customer_name;
ALTER TABLE quotes DROP COLUMN IF EXISTS customer_email;
ALTER TABLE quotes DROP COLUMN IF EXISTS customer_phone;
ALTER TABLE quotes DROP COLUMN IF EXISTS customer_ship_to;

-- Migration complete
