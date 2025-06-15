-- Create viewing_requests table for guest viewing requests
CREATE TABLE IF NOT EXISTS viewing_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL,
    property_title VARCHAR(255),
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(20) NOT NULL,
    requested_date DATE NOT NULL,
    requested_time TIME NOT NULL,
    message TEXT,
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_viewing_requests_agent_id ON viewing_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_status ON viewing_requests(status);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_date ON viewing_requests(requested_date);
CREATE INDEX IF NOT EXISTS idx_viewing_requests_created_at ON viewing_requests(created_at);

-- Enable Row Level Security
ALTER TABLE viewing_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Agents can view their viewing requests" ON viewing_requests
    FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Agents can update their viewing requests" ON viewing_requests
    FOR UPDATE USING (agent_id = auth.uid());

-- Allow public insert for guest requests (no auth required)
CREATE POLICY "Anyone can create viewing requests" ON viewing_requests
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE viewing_requests IS 'Guest requests for property viewings sent to agents/listers'; 