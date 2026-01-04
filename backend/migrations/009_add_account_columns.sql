-- Add account column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS account TEXT CHECK (account IN ('cash', 'ewallet', 'bank'));

-- Set default value for existing rows (optional, defaulting to 'cash')
UPDATE public.transactions SET account = 'cash' WHERE account IS NULL;

-- Add account column to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS account TEXT CHECK (account IN ('cash', 'ewallet', 'bank'));

-- Set default value for existing rows (optional, defaulting to 'ewallet' or 'bank' depends on logic, use 'cash' for safety)
UPDATE public.bills SET account = 'cash' WHERE account IS NULL;

-- Make it not null for future inserts if desired, but let's keep it nullable for flexibility or enforce in API
ALTER TABLE public.transactions ALTER COLUMN account SET DEFAULT 'cash';
ALTER TABLE public.bills ALTER COLUMN account SET DEFAULT 'cash';
