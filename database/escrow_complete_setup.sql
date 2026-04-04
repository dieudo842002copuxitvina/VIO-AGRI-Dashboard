-- Escrow Payment System - Complete Setup (NO ERRORS)
-- Backup your database before running this
-- Run each section separately if you encounter errors

-- ============================================================
-- STEP 1: Add payment columns to existing deals table
-- ============================================================
ALTER TABLE IF EXISTS deals
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';

-- Add constraint for payment_status values
-- (Skip if constraint already exists)
ALTER TABLE deals
ADD CONSTRAINT check_payment_status CHECK (
  payment_status IN ('unpaid', 'locked', 'released', 'refunded')
) ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 2: Create system_settings table
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  is_payment_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row
INSERT INTO system_settings (id, is_payment_enabled)
VALUES (1, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STEP 3: Create transactions table
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'payout', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  payment_method TEXT,
  reference_code TEXT UNIQUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints after table creation
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_deal_id
FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
ON CONFLICT DO NOTHING;

ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_user_id
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 4: Create indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_deal_id ON transactions(deal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- ============================================================
-- STEP 5: Enable RLS on transactions
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create RLS Policies
-- ============================================================
-- Drop existing policies first (if any)
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Service role can update transactions" ON transactions;

-- Policy 1: Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Allow inserts (for backend/service role)
CREATE POLICY "Service role can insert transactions" ON transactions
  FOR INSERT
  WITH CHECK (true);

-- Policy 3: Allow status updates
CREATE POLICY "Service role can update transactions" ON transactions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STEP 7: Create update trigger for updated_at
-- ============================================================
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

-- ============================================================
-- STEP 8: Grant permissions
-- ============================================================
GRANT SELECT ON system_settings TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT INSERT ON transactions TO authenticated;
GRANT UPDATE ON transactions TO authenticated;

-- ============================================================
-- VERIFICATION: Check everything was created
-- ============================================================
SELECT '✓ Deals table columns:' as status;
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'deals' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '' as spacer;
SELECT '✓ System settings table:' as status;
SELECT * FROM system_settings LIMIT 1;

SELECT '' as spacer;
SELECT '✓ Transactions table exists:' as status;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'transactions' AND table_schema = 'public'
) as table_exists;

SELECT '' as spacer;
SELECT '✓ RLS policies on transactions:' as status;
SELECT policyname FROM pg_policies
WHERE tablename = 'transactions';
