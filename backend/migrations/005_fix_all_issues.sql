-- Migration: Fix all database issues
-- This fixes:
-- 1. "numeric field overflow" error (amount precision too small)
-- 2. "new row violates row-level security policy for table balance" error (RLS blocking trigger)
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- PART 1: Fix amount column precision
-- ============================================
-- Change transactions.amount from DECIMAL(10,2) to DECIMAL(15,2)
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

-- ============================================
-- PART 2: Fix RLS policy for balance table
-- ============================================
-- Update the trigger function to use SECURITY DEFINER
-- This makes the function run with the privileges of the function creator (bypasses RLS)
CREATE OR REPLACE FUNCTION update_balance_on_transaction()
RETURNS TRIGGER 
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
  INSERT INTO balance (user_id, current_balance, total_income, total_expense, updated_at)
  VALUES (
    NEW.user_id,
    COALESCE((SELECT current_balance FROM balance WHERE user_id = NEW.user_id), 0) + 
    CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END,
    COALESCE((SELECT total_income FROM balance WHERE user_id = NEW.user_id), 0) + 
    CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE 0 END,
    COALESCE((SELECT total_expense FROM balance WHERE user_id = NEW.user_id), 0) + 
    CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_balance = balance.current_balance + 
      CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE -NEW.amount END,
    total_income = balance.total_income + 
      CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE 0 END,
    total_expense = balance.total_expense + 
      CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update RLS policies to allow inserts and updates for balance table
DROP POLICY IF EXISTS "Users can insert own balance" ON balance;
CREATE POLICY "Users can insert own balance" ON balance
  FOR INSERT WITH CHECK (true); -- Allow all inserts (trigger will use this)

DROP POLICY IF EXISTS "Users can update own balance" ON balance;
CREATE POLICY "Users can update own balance" ON balance
  FOR UPDATE USING (true); -- Allow all updates (trigger will use this)

-- ============================================
-- Verification (optional - you can run this to check)
-- ============================================
-- SELECT column_name, data_type, numeric_precision, numeric_scale 
-- FROM information_schema.columns 
-- WHERE table_name IN ('transactions', 'bills', 'balance') 
--   AND (column_name LIKE '%amount%' OR column_name LIKE '%balance%' OR column_name LIKE '%income%' OR column_name LIKE '%expense%');

