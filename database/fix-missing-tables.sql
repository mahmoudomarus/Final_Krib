-- Fix Missing Tables for UAE Rental Platform
-- Run this in Supabase SQL Editor

-- 1. Agent Wallets Table
CREATE TABLE IF NOT EXISTS agent_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'AED',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id)
);

-- 2. Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  balance_after DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  reference_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank_transfer')),
  last_four VARCHAR(4),
  brand VARCHAR(20),
  exp_month INTEGER CHECK (exp_month >= 1 AND exp_month <= 12),
  exp_year INTEGER CHECK (exp_year >= EXTRACT(YEAR FROM NOW())),
  cardholder_name VARCHAR(255),
  bank_name VARCHAR(255),
  account_number VARCHAR(4), -- Only store last 4 digits
  is_default BOOLEAN DEFAULT FALSE,
  stripe_payment_method_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_wallets_agent_id ON agent_wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_agent_id ON wallet_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(user_id, is_default) WHERE is_default = true;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Agent Wallets: Agents can only see their own wallet
CREATE POLICY "Agents can view own wallet" ON agent_wallets
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can update own wallet" ON agent_wallets
  FOR UPDATE USING (agent_id = auth.uid());

-- Wallet Transactions: Agents can only see their own transactions
CREATE POLICY "Agents can view own transactions" ON wallet_transactions
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "System can insert transactions" ON wallet_transactions
  FOR INSERT WITH CHECK (true);

-- Payment Methods: Users can only see their own payment methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payment methods" ON payment_methods
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payment methods" ON payment_methods
  FOR DELETE USING (user_id = auth.uid());

-- 7. Create function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the agent's wallet balance after transaction
  UPDATE agent_wallets 
  SET 
    balance = NEW.balance_after,
    total_spent = CASE WHEN NEW.type = 'debit' THEN total_spent + NEW.amount ELSE total_spent END,
    total_earned = CASE WHEN NEW.type = 'credit' THEN total_earned + NEW.amount ELSE total_earned END,
    updated_at = NOW()
  WHERE agent_id = NEW.agent_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for wallet balance updates
CREATE TRIGGER trigger_update_wallet_balance
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_balance();

-- 9. Create function to ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this payment method as default, unset all others for this user
  IF NEW.is_default = true THEN
    UPDATE payment_methods 
    SET is_default = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for default payment method
CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- 11. Insert initial wallet data for existing agents
INSERT INTO agent_wallets (agent_id, balance, total_spent, total_earned)
SELECT 
  id,
  0.00 as balance,
  0.00 as total_spent, 
  0.00 as total_earned
FROM users 
WHERE is_agent = true
ON CONFLICT (agent_id) DO NOTHING;

-- 12. Add some sample transactions for testing (optional)
-- Uncomment if you want test data
/*
INSERT INTO wallet_transactions (agent_id, type, amount, description, balance_after)
SELECT 
  id,
  'credit',
  500.00,
  'Welcome bonus - Initial credits',
  500.00
FROM users 
WHERE is_agent = true;
*/

-- Success message
SELECT 'Missing tables created successfully! Agent wallets, transactions, and payment methods are now available.' as status; 