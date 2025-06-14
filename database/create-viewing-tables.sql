-- Create property_viewings table for managing viewing appointments
CREATE TABLE IF NOT EXISTS property_viewings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration INTEGER DEFAULT 60, -- duration in minutes
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_availability table for managing agent time slots
CREATE TABLE IF NOT EXISTS agent_availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration INTEGER DEFAULT 60, -- duration in minutes
    is_available BOOLEAN DEFAULT true,
    is_booked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, date, time)
);

-- Create agent_wallets table for financial management
CREATE TABLE IF NOT EXISTS agent_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 0.00,
    total_earned DECIMAL(10, 2) DEFAULT 0.00,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'AED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_transactions table for transaction history
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID REFERENCES agent_wallets(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT NOT NULL,
    reference_id TEXT, -- booking_id, promotion_id, etc.
    reference_type TEXT, -- 'booking', 'promotion', 'manual', etc.
    balance_after DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_promotions table for tracking promoted properties
CREATE TABLE IF NOT EXISTS property_promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    promotion_type TEXT NOT NULL CHECK (promotion_type IN ('basic', 'premium', 'elite')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cost_per_week DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    weeks INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    views_gained INTEGER DEFAULT 0,
    leads_gained INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add agent_id column to properties table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'agent_id') THEN
        ALTER TABLE properties ADD COLUMN agent_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_viewings_agent_id ON property_viewings(agent_id);
CREATE INDEX IF NOT EXISTS idx_property_viewings_date ON property_viewings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_property_viewings_status ON property_viewings(status);

CREATE INDEX IF NOT EXISTS idx_agent_availability_agent_date ON agent_availability(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_agent_availability_available ON agent_availability(is_available);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_agent_id ON wallet_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_date ON wallet_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_property_promotions_agent_id ON property_promotions(agent_id);
CREATE INDEX IF NOT EXISTS idx_property_promotions_property_id ON property_promotions(property_id);
CREATE INDEX IF NOT EXISTS idx_property_promotions_status ON property_promotions(status);
CREATE INDEX IF NOT EXISTS idx_property_promotions_dates ON property_promotions(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);

-- Enable Row Level Security (RLS)
ALTER TABLE property_viewings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_promotions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for property_viewings
CREATE POLICY "Users can view own viewings" ON property_viewings
    FOR SELECT USING (auth.uid() = agent_id OR auth.uid() = client_id);

CREATE POLICY "Agents can manage their viewings" ON property_viewings
    FOR ALL USING (auth.uid() = agent_id);

-- Create RLS policies for agent_availability
CREATE POLICY "Agents can manage their availability" ON agent_availability
    FOR ALL USING (auth.uid() = agent_id);

CREATE POLICY "Users can view agent availability" ON agent_availability
    FOR SELECT USING (true);

-- Create RLS policies for agent_wallets
CREATE POLICY "Agents can view own wallet" ON agent_wallets
    FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can update own wallet" ON agent_wallets
    FOR UPDATE USING (auth.uid() = agent_id);

-- Create RLS policies for wallet_transactions
CREATE POLICY "Agents can view own transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = agent_id);

-- Create RLS policies for property_promotions
CREATE POLICY "Agents can manage own promotions" ON property_promotions
    FOR ALL USING (auth.uid() = agent_id);

-- Create functions for automatic wallet creation
CREATE OR REPLACE FUNCTION create_agent_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Create wallet when a user becomes an agent
    IF NEW.is_agent = true AND (OLD.is_agent IS NULL OR OLD.is_agent = false) THEN
        INSERT INTO agent_wallets (agent_id)
        VALUES (NEW.id)
        ON CONFLICT (agent_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic wallet creation
DROP TRIGGER IF EXISTS create_agent_wallet_trigger ON auth.users;
CREATE TRIGGER create_agent_wallet_trigger
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_agent_wallet();

-- Insert sample data for testing (only if tables are empty)
DO $$
BEGIN
    -- Insert default availability for the next 7 days for agent user
    IF NOT EXISTS (SELECT 1 FROM agent_availability LIMIT 1) THEN
        INSERT INTO agent_availability (agent_id, date, time, duration, is_available)
        SELECT 
            (SELECT id FROM auth.users WHERE email = 'agent.mahmoud@krib.ae' LIMIT 1),
            current_date + interval '1 day' * generate_series(0, 6),
            time_val,
            60,
            true
        FROM (VALUES ('09:00'::time), ('10:00'::time), ('11:00'::time), 
                     ('14:00'::time), ('15:00'::time), ('16:00'::time), ('17:00'::time)) AS t(time_val)
        WHERE (SELECT id FROM auth.users WHERE email = 'agent.mahmoud@krib.ae' LIMIT 1) IS NOT NULL;
    END IF;
END $$; 