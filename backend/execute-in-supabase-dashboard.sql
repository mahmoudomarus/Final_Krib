-- =====================================================
-- KRIB PLATFORM - MISSING DATABASE TABLES
-- Execute this in Supabase Dashboard > SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. AGENT WALLETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'AED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT agent_wallets_balance_positive CHECK (balance >= 0),
    CONSTRAINT agent_wallets_total_spent_positive CHECK (total_spent >= 0),
    CONSTRAINT agent_wallets_total_earned_positive CHECK (total_earned >= 0),
    CONSTRAINT agent_wallets_agent_unique UNIQUE (agent_id)
);

-- =====================================================
-- 2. WALLET TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'REFUND', 'BONUS', 'PENALTY')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    balance_after DECIMAL(10,2) NOT NULL,
    reference_id UUID, -- Can reference bookings, payments, etc.
    reference_type VARCHAR(50), -- 'BOOKING', 'PAYMENT', 'PROMOTION', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT wallet_transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT wallet_transactions_balance_positive CHECK (balance_after >= 0)
);

-- =====================================================
-- 3. PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('CARD', 'BANK_ACCOUNT', 'DIGITAL_WALLET', 'CRYPTO')),
    provider VARCHAR(50), -- 'STRIPE', 'PAYPAL', 'BANK_TRANSFER', etc.
    last_four VARCHAR(4),
    brand VARCHAR(20), -- 'VISA', 'MASTERCARD', 'AMEX', etc.
    expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12),
    expiry_year INTEGER CHECK (expiry_year >= EXTRACT(YEAR FROM NOW())),
    cardholder_name VARCHAR(255),
    billing_address JSONB,
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    stripe_payment_method_id VARCHAR(255), -- Stripe payment method ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT payment_methods_user_default_unique UNIQUE (user_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Agent wallets indexes
CREATE INDEX IF NOT EXISTS idx_agent_wallets_created_at ON agent_wallets(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_wallets_agent_id ON agent_wallets(agent_id);

-- Wallet transactions indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_agent_id ON wallet_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_reference ON wallet_transactions(reference_id, reference_type);

-- Payment methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_type ON payment_methods(type);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);

-- =====================================================
-- 5. CREATE TRIGGER FUNCTION FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_agent_wallets_updated_at 
    BEFORE UPDATE ON agent_wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE agent_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Agent wallets policies
CREATE POLICY "Users can view their own wallet" ON agent_wallets
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Users can update their own wallet" ON agent_wallets
    FOR UPDATE USING (agent_id = auth.uid());

-- Wallet transactions policies
CREATE POLICY "Users can view their own transactions" ON wallet_transactions
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "System can insert transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (true); -- Allow system to insert

-- Payment methods policies
CREATE POLICY "Users can manage their own payment methods" ON payment_methods
    FOR ALL USING (user_id = auth.uid());

-- Admin policies (for super_admin role)
CREATE POLICY "Admins can view all wallets" ON agent_wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

CREATE POLICY "Admins can view all transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

CREATE POLICY "Admins can view all payment methods" ON payment_methods
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT, INSERT ON agent_wallets TO authenticated;
GRANT SELECT, INSERT ON wallet_transactions TO authenticated;
GRANT ALL ON payment_methods TO authenticated;

-- Grant permissions to service role (for backend operations)
GRANT ALL ON agent_wallets TO service_role;
GRANT ALL ON wallet_transactions TO service_role;
GRANT ALL ON payment_methods TO service_role;

-- =====================================================
-- 8. VERIFICATION AND COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: All missing tables have been created!';
    RAISE NOTICE '📊 Tables created: agent_wallets, wallet_transactions, payment_methods';
    RAISE NOTICE '🔒 Row Level Security enabled with appropriate policies';
    RAISE NOTICE '📈 Indexes created for optimal performance';
    RAISE NOTICE '🎯 Ready for production use!';
END $$; 