-- Natro Token Reward System
-- User token balances and wallets
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    solana_address VARCHAR(44) UNIQUE,
    token_balance DECIMAL(18, 2) DEFAULT 0.00,
    total_earned DECIMAL(18, 2) DEFAULT 0.00,
    total_claimed DECIMAL(18, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_session ON user_wallets(session_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(solana_address);

-- Token earning transactions
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES user_wallets(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'earn', 'claim', 'bonus'
    amount DECIMAL(18, 2) NOT NULL,
    action_type VARCHAR(50), -- 'search', 'click', 'daily_bonus', etc.
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_transactions_wallet ON token_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);

-- Token claims (withdrawals)
CREATE TABLE IF NOT EXISTS token_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES user_wallets(id) ON DELETE CASCADE,
    amount DECIMAL(18, 2) NOT NULL,
    solana_address VARCHAR(44) NOT NULL,
    transaction_hash VARCHAR(128),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    error_message TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_claims_wallet ON token_claims(wallet_id);
CREATE INDEX IF NOT EXISTS idx_token_claims_status ON token_claims(status);
CREATE INDEX IF NOT EXISTS idx_token_claims_created_at ON token_claims(created_at DESC);

-- Token earning rates configuration
CREATE TABLE IF NOT EXISTS token_earning_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type VARCHAR(50) UNIQUE NOT NULL,
    tokens_per_action DECIMAL(18, 2) NOT NULL,
    daily_limit INTEGER,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default earning rates
INSERT INTO token_earning_rates (action_type, tokens_per_action, daily_limit, description) VALUES
('search', 0.10, 1000, 'Earn tokens for each search query'),
('click', 0.05, 500, 'Earn tokens for clicking search results'),
('daily_login', 5.00, 1, 'Daily login bonus'),
('first_search', 10.00, 1, 'First search of the day bonus')
ON CONFLICT (action_type) DO NOTHING;
