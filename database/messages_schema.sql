-- Messages Table for Real-time Chat
-- Run this in Supabase SQL Editor

-- 1. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_deal_id ON messages(deal_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_deal_created ON messages(deal_id, created_at);

-- 3. Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in their deals" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their deals" ON messages;

-- 5. RLS Policies
-- Users can view all messages in deals they're involved with
CREATE POLICY "Users can view messages in their deals" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = messages.deal_id
      AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
    )
  );

-- Users can insert messages only to deals they're involved with
CREATE POLICY "Users can send messages to their deals" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM deals
      WHERE deals.id = messages.deal_id
      AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
    )
  );

-- 6. Grant permissions
GRANT SELECT ON messages TO authenticated;
GRANT INSERT ON messages TO authenticated;

-- 7. Create update trigger for updated_at
DROP TRIGGER IF EXISTS messages_update_timestamp ON messages;
DROP FUNCTION IF EXISTS update_messages_updated_at();

CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_update_timestamp
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_messages_updated_at();

-- 8. Enable Realtime for messages table
-- In Supabase Dashboard: Database > Realtime > Enable for "messages" table
-- Or run this if you have proper permissions:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ✓ Verification
SELECT 'Messages table created successfully!' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'messages';
