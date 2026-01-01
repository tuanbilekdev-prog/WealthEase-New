-- Dummy Data for Testing
-- Run this SQL in Supabase SQL Editor after running 001_initial_schema.sql
-- Replace 'test-user-id' with actual user IDs from your JWT tokens

-- Insert test user
INSERT INTO users (id, name, email, role, theme)
VALUES 
  ('test-user-1', 'Test User', 'test@example.com', 'user', 'light')
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (user_id, type, amount, name, category, description, date)
VALUES 
  ('test-user-1', 'income', 5000000, 'Salary', 'Salary', 'Monthly salary payment', NOW() - INTERVAL '30 days'),
  ('test-user-1', 'income', 2000000, 'Freelance Project', 'Business', 'Web development project', NOW() - INTERVAL '15 days'),
  ('test-user-1', 'expense', 500000, 'Grocery Shopping', 'Groceries', 'Weekly grocery shopping', NOW() - INTERVAL '7 days'),
  ('test-user-1', 'expense', 150000, 'Internet Bill', 'Utilities', 'Monthly internet subscription', NOW() - INTERVAL '5 days'),
  ('test-user-1', 'expense', 200000, 'Restaurant', 'Food & Drinks', 'Dinner with friends', NOW() - INTERVAL '3 days'),
  ('test-user-1', 'income', 1000000, 'Investment Return', 'Investment', 'Stock dividend', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Insert sample bills
INSERT INTO bills (user_id, bill_name, amount, due_date, category, description, completed)
VALUES 
  ('test-user-1', 'Electricity Bill', 300000, NOW() + INTERVAL '5 days', 'utilities', 'Monthly electricity payment', false),
  ('test-user-1', 'Netflix Subscription', 149000, NOW() + INTERVAL '10 days', 'subscription', 'Monthly streaming service', false),
  ('test-user-1', 'Rent Payment', 2000000, NOW() + INTERVAL '15 days', 'rent', 'Monthly apartment rent', false),
  ('test-user-1', 'Phone Bill', 100000, NOW() - INTERVAL '2 days', 'utilities', 'Monthly phone plan', true),
  ('test-user-1', 'Gym Membership', 200000, NOW() - INTERVAL '5 days', 'subscription', 'Monthly gym fee', true)
ON CONFLICT DO NOTHING;

-- Note: Balance will be automatically calculated by the trigger when transactions are inserted
-- You can verify the balance with:
-- SELECT * FROM balance WHERE user_id = 'test-user-1';

