-- Create agent wallets table
CREATE TABLE IF NOT EXISTS agent_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    total_spent DECIMAL(12,2) DEFAULT 0.00,
    total_earned DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'AED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id)
);

-- Create wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    stripe_payment_intent_id VARCHAR(255),
    reference_type VARCHAR(50),
    reference_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property promotions table
CREATE TABLE IF NOT EXISTS property_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    promotion_type VARCHAR(20) NOT NULL CHECK (promotion_type IN ('basic', 'premium', 'elite')),
    cost_per_week DECIMAL(10,2) NOT NULL,
    weeks_duration INTEGER NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    views_generated INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_wallets_agent_id ON agent_wallets(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_agent_id ON wallet_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_promotions_property_id ON property_promotions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_promotions_agent_id ON property_promotions(agent_id);
CREATE INDEX IF NOT EXISTS idx_property_promotions_status ON property_promotions(status);
CREATE INDEX IF NOT EXISTS idx_property_promotions_dates ON property_promotions(start_date, end_date);

-- Add agent_id column to properties table if it doesn't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);

-- Create RLS policies for agent wallets
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own wallet" ON agent_wallets
    FOR SELECT
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can update own wallet" ON agent_wallets
    FOR UPDATE
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert own wallet" ON agent_wallets
    FOR INSERT
    WITH CHECK (agent_id = auth.uid());

-- Create RLS policies for wallet transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own transactions" ON wallet_transactions
    FOR SELECT
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert own transactions" ON wallet_transactions
    FOR INSERT
    WITH CHECK (agent_id = auth.uid());

-- Create RLS policies for property promotions
ALTER TABLE property_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own promotions" ON property_promotions
    FOR SELECT
    USING (agent_id = auth.uid());

CREATE POLICY "Agents can manage own promotions" ON property_promotions
    FOR ALL
    USING (agent_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_agent_wallets_updated_at 
    BEFORE UPDATE ON agent_wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_promotions_updated_at 
    BEFORE UPDATE ON property_promotions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
-- Insert a sample agent wallet for the logged-in agent
INSERT INTO agent_wallets (agent_id, balance, total_spent, total_earned, currency)
SELECT id, 2500.00, 750.00, 4250.00, 'AED'
FROM users 
WHERE is_agent = true 
AND NOT EXISTS (SELECT 1 FROM agent_wallets WHERE agent_id = users.id)
LIMIT 1;

-- Insert sample wallet transactions
WITH sample_agent AS (
    SELECT id as agent_id FROM users WHERE is_agent = true LIMIT 1
)
INSERT INTO wallet_transactions (agent_id, type, amount, description, balance_after)
SELECT 
    sa.agent_id,
    'credit',
    1000.00,
    'Commission from November bookings',
    2500.00
FROM sample_agent sa
WHERE NOT EXISTS (
    SELECT 1 FROM wallet_transactions wt WHERE wt.agent_id = sa.agent_id
);

-- Assign some properties to agents for demo
UPDATE properties 
SET agent_id = (
    SELECT id FROM users WHERE is_agent = true LIMIT 1
)
WHERE agent_id IS NULL 
AND id IN (
    SELECT id FROM properties ORDER BY created_at DESC LIMIT 5
); 