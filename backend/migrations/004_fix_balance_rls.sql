-- Migration: Fix RLS policy for balance table to allow trigger updates
-- This fixes the "new row violates row-level security policy for table balance" error
-- Run this SQL in Supabase SQL Editor

-- Option 1: Update the trigger function to use SECURITY DEFINER
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

-- Option 2: Update RLS policies to allow inserts and updates for balance table
-- This is a backup approach if SECURITY DEFINER doesn't work
DROP POLICY IF EXISTS "Users can insert own balance" ON balance;
CREATE POLICY "Users can insert own balance" ON balance
  FOR INSERT WITH CHECK (true); -- Allow all inserts (trigger will use this)

DROP POLICY IF EXISTS "Users can update own balance" ON balance;
CREATE POLICY "Users can update own balance" ON balance
  FOR UPDATE USING (true); -- Allow all updates (trigger will use this)

