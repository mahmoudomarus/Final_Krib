-- Add agent/company specific fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_registration_number VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS business_license VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_website VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_license_number VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specializations TEXT[]; -- Array of specializations
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_logo VARCHAR(255);

-- Add host specific fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_response_rate DECIMAL(3,2); -- 0.00 to 1.00
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_response_time VARCHAR(50); -- "within an hour", "within a day", etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS host_languages TEXT[]; -- Languages spoken by host

-- Add guest specific fields  
ALTER TABLE users ADD COLUMN IF NOT EXISTS guest_preferences JSONB; -- Travel preferences, interests, etc.
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100);

-- Add profile completion tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_type VARCHAR(20) DEFAULT 'guest' CHECK (profile_type IN ('guest', 'host', 'agent'));

-- Update profile_type based on existing flags
UPDATE users SET profile_type = 
  CASE 
    WHEN is_agent = true THEN 'agent'
    WHEN is_host = true THEN 'host'
    ELSE 'guest'
  END;

-- Add comments for documentation
COMMENT ON COLUMN users.company_name IS 'Company name for agents';
COMMENT ON COLUMN users.agent_license_number IS 'Real estate agent license number';
COMMENT ON COLUMN users.specializations IS 'Array of agent specializations (residential, commercial, etc.)';
COMMENT ON COLUMN users.host_response_rate IS 'Host response rate as decimal (0.95 = 95%)';
COMMENT ON COLUMN users.guest_preferences IS 'JSON object with guest travel preferences';
COMMENT ON COLUMN users.profile_type IS 'User profile type: guest, host, or agent'; 