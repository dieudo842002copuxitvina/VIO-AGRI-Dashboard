-- Escrow Payment System Schema

-- 1. System Settings Table
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

-- 2. Update deals table with payment fields
ALTER TABLE deals
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'locked', 'released', 'refunded'));

-- 3. Create transactions table
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

-- Create index on deal_id and user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_deal_id ON transactions(deal_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- 4. Enable RLS on transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for transactions
-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create transactions (will be handled by functions/triggers)
CREATE POLICY "Service role can insert transactions" ON transactions
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own transaction status (for status polling)
CREATE POLICY "Service role can update transactions" ON transactions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Audit trigger for updated_at
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

-- 7. Grant access to authenticated users
GRANT SELECT ON system_settings TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT INSERT ON transactions TO authenticated;
GRANT UPDATE ON transactions TO authenticated;
