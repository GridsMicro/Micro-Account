-- Final Licenses Table Creation
-- Exact schema expected by gen-key.ts

DROP TABLE IF EXISTS licenses;

CREATE TABLE licenses (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(64) UNIQUE NOT NULL,
    machine_id VARCHAR(128) NOT NULL,
    license_type VARCHAR(20) NOT NULL CHECK (license_type IN ('TRIAL', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED')),
    max_users INTEGER DEFAULT 1,
    max_companies INTEGER DEFAULT 1,
    max_transactions_per_month INTEGER DEFAULT 1000,
    allowed_features TEXT[],
    verification_hash VARCHAR(128),
    activation_ip INET,
    hardware_fingerprint TEXT,
    audit_log JSONB DEFAULT '[]'::jsonb,
    company_name VARCHAR(255),
    licensee_email VARCHAR(255),
    licensee_phone VARCHAR(50),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT licenses_machine_license_unique UNIQUE (machine_id, license_key),
    CONSTRAINT licenses_valid_dates CHECK (expires_at IS NULL OR expires_at > issued_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_machine_id ON licenses(machine_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at) WHERE expires_at IS NOT NULL;

-- Insert default trial license for testing
INSERT INTO licenses (
    license_key, machine_id, license_type, status, max_users, max_companies,
    max_transactions_per_month, allowed_features, verification_hash, company_name, licensee_email
) VALUES (
    'MICRO-TRIAL-DEFAULT-2026',
    'SYSTEM-INSTALLATION-DEFAULT',
    'TRIAL',
    'ACTIVE',
    1,
    1,
    500,
    ARRAY['basic_journaling', 'standard_reports'],
    'default-trial-hash',
    'Micro-Account Trial Installation',
    'system@micro-account.local'
) ON CONFLICT (license_key) DO NOTHING;

-- Create license_usage table for tracking
CREATE TABLE IF NOT EXISTS license_usage (
    id SERIAL PRIMARY KEY,
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_count INTEGER DEFAULT 0,
    user_count INTEGER DEFAULT 0,
    api_calls INTEGER DEFAULT 0,
    features_used TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT license_usage_unique UNIQUE (license_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_license_usage_date ON license_usage(usage_date);
CREATE INDEX IF NOT EXISTS idx_license_usage_license ON license_usage(license_id);

-- Create license_audit table for complete audit trail
CREATE TABLE IF NOT EXISTS license_audit (
    id SERIAL PRIMARY KEY,
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    machine_id VARCHAR(128),
    status VARCHAR(20) DEFAULT 'SUCCESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_license_audit_license ON license_audit(license_id);
CREATE INDEX IF NOT EXISTS idx_license_audit_action ON license_audit(action);
CREATE INDEX IF NOT EXISTS idx_license_audit_created ON license_audit(created_at);

COMMENT ON TABLE licenses IS 'Licensing table for Micro-Account 5-Journal Engine protection';
COMMENT ON TABLE license_usage IS 'Track license usage to prevent abuse and enforce limits';
COMMENT ON TABLE license_audit IS 'Complete audit trail of all license-related activities';
