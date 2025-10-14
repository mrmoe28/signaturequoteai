-- Migration: Fix quotes table column name from 'overall' to 'total' if needed
-- This handles legacy databases that might have used 'overall' instead of 'total'

-- Check if 'overall' column exists and rename it to 'total' if so
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'quotes' 
    AND column_name = 'overall'
  ) THEN
    ALTER TABLE quotes RENAME COLUMN overall TO total;
    RAISE NOTICE 'Renamed column overall to total in quotes table';
  ELSE
    RAISE NOTICE 'Column overall does not exist, skipping rename';
  END IF;
END$$;

