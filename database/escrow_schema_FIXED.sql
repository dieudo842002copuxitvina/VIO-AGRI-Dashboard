-- Escrow Payment System Schema (CORRECTED)

-- 1. Create/Update Deals Table First (if needed)
-- Check existing structure, add columns if they don't exist
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Add constraint if it doesn't exist
ALTER TABLE deals
ADD CONSTRAINT payment_status_check CHECK (payment_status IN ('unpaid', 'locked', 'released', 'refunded'))
ON CONFLICT DO NOTHING;

-- 2. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_payment_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row if not exists
INSERT INTO system_settings (id, is_payment_enabled)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'payout', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_method TEXT,
  reference_code TEXT UNIQUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_transactions_deal_id ON transactions(deal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- 5. Enable RLS on Transactions Table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can update transactions" ON transactions;

-- 7. Create RLS Policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions" ON transactions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update transactions" ON transactions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 8. Create Audit Trigger
DROP TRIGGER IF EXISTS transactions_update_timestamp ON transactions;
DROP FUNCTION IF EXISTS update_transactions_updated_at();

CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_update_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_transactions_updated_at();

-- 9. Grant Access
GRANT SELECT ON system_settings TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT INSERT ON transactions TO authenticated;
GRANT UPDATE ON transactions TO authenticated;

-- 10. Verify Everything
SELECT 'Deals table columns:' as check_type;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'deals' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Transactions table created' as check_type;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'transactions' AND table_schema = 'public'
) as transactions_exists;

SELECT 'System settings:' as check_type;
SELECT * FROM system_settings WHERE id = 1;
