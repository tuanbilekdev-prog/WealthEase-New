-- WealthEase Database Schema
-- Run this SQL in Supabase SQL Editor

-- Table: users
-- Stores user profile information
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: transactions
-- Stores all financial transactions (income/expense)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: bills
-- Stores bill reminders and tracking
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bill_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  due_date TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('utilities', 'subscription', 'rent', 'food', 'others')),
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: balance
-- Stores current balance for each user (calculated from transactions)
-- This is a denormalized table for quick access
CREATE TABLE IF NOT EXISTS balance (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_balance DECIMAL(10, 2) DEFAULT 0,
  total_income DECIMAL(10, 2) DEFAULT 0,
  total_expense DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_completed ON bills(completed);
CREATE INDEX IF NOT EXISTS idx_bills_user_completed ON bills(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);

-- Function to update balance when transaction is added
CREATE OR REPLACE FUNCTION update_balance_on_transaction()
RETURNS TRIGGER AS $$
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

-- Trigger to auto-update balance on transaction insert
DROP TRIGGER IF EXISTS trigger_update_balance ON transactions;
CREATE TRIGGER trigger_update_balance
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_balance_on_transaction();

-- Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true); -- For now, allow all reads (adjust based on auth)

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (true); -- Adjust with auth check

-- Policy: Users can read their own transactions
CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (true); -- Adjust with auth check

-- Policy: Users can insert their own bills
CREATE POLICY "Users can insert own bills" ON bills
  FOR INSERT WITH CHECK (true); -- Adjust with auth check

-- Policy: Users can read their own bills
CREATE POLICY "Users can read own bills" ON bills
  FOR SELECT USING (true); -- Adjust with auth check

-- Policy: Users can update their own bills
CREATE POLICY "Users can update own bills" ON bills
  FOR UPDATE USING (true); -- Adjust with auth check

-- Policy: Users can read their own balance
CREATE POLICY "Users can read own balance" ON balance
  FOR SELECT USING (true); -- Adjust with auth check

-- Policy: Users can update their own balance
CREATE POLICY "Users can update own balance" ON balance
  FOR UPDATE USING (true); -- Adjust with auth check

