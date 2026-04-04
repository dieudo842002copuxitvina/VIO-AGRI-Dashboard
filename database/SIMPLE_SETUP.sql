-- SIMPLIFIED ESCROW SETUP (Most reliable)
-- Copy and paste into Supabase SQL Editor

-- 1. Add columns to deals table
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- 2. Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY,
  is_payment_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO system_settings (id, is_payment_enabled)
VALUES (1, false)
ON CONFLICT DO NOTHING;

-- 3. Create transactions table (simplified - no FK constraints first)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  reference_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_transactions_deal_id ON transactions(deal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 5. Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. Add RLS policy
DROP POLICY IF EXISTS "Users view own transactions" ON transactions;
CREATE POLICY "Users view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Grant access
GRANT SELECT ON system_settings TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT INSERT ON transactions TO authenticated;

-- ✓ Done! Verify setup:
SELECT 'Tables created:' as check;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('deals', 'system_settings', 'transactions');
