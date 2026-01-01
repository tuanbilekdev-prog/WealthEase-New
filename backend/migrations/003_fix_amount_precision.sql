-- Migration: Fix amount column precision to support larger values
-- This fixes the "numeric field overflow" error for amounts >= 100,000,000
-- Run this SQL in Supabase SQL Editor

-- Change transactions.amount from DECIMAL(10,2) to DECIMAL(15,2)
-- This allows values up to 999,999,999,999,999.99 (999 trillion)
ALTER TABLE transactions 
  ALTER COLUMN amount TYPE DECIMAL(15, 2);

-- Change bills.amount from DECIMAL(10,2) to DECIMAL(15,2)
ALTER TABLE bills 
  ALTER COLUMN amount TYPE DECIMAL(15, 2);

-- Change balance columns from DECIMAL(10,2) to DECIMAL(15,2)
ALTER TABLE balance 
  ALTER COLUMN current_balance TYPE DECIMAL(15, 2),
  ALTER COLUMN total_income TYPE DECIMAL(15, 2),
  ALTER COLUMN total_expense TYPE DECIMAL(15, 2);

-- Verify the changes
-- You can run this query to check:
-- SELECT column_name, data_type, numeric_precision, numeric_scale 
-- FROM information_schema.columns 
-- WHERE table_name IN ('transactions', 'bills', 'balance') 
--   AND column_name LIKE '%amount%' OR column_name LIKE '%balance%' OR column_name LIKE '%income%' OR column_name LIKE '%expense%';

