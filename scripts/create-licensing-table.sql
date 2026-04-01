-- =====================================================
-- Micro-Account: Licensing & Security Foundation
-- Protects the unique 5-Journal Engine IP
-- =====================================================

CREATE TABLE IF NOT EXISTS licenses (
    id SERIAL PRIMARY KEY,
    license_key VARCHAR(64) UNIQUE NOT NULL,
    machine_id VARCHAR(128) NOT NULL,
    license_type VARCHAR(20) NOT NULL CHECK (license_type IN ('TRIAL', 'STANDARD', 'PROFESSIONAL', 'ENTERPRISE')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED')),
    
    -- License Limits & Features
    max_users INTEGER DEFAULT 1,
    max_companies INTEGER DEFAULT 1,
    max_transactions_per_month INTEGER DEFAULT 1000,
    allowed_features TEXT[], -- ['basic_journaling', 'advanced_reports', 'multi_company', 'api_access', 'custom_branding']
    
    -- Timestamps
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Security & Audit
    verification_hash VARCHAR(128), -- SHA-256 hash of key + machine_id + salt
    activation_ip INET,
    hardware_fingerprint TEXT, -- Additional hardware identifiers
    audit_log JSONB DEFAULT '[]'::jsonb, -- Track license usage
    
    -- Business Details
    company_name VARCHAR(255),
    licensee_email VARCHAR(255),
    licensee_phone VARCHAR(50),
    
    -- Constraints
    CONSTRAINT licenses_machine_license_unique UNIQUE (machine_id, license_key),
    CONSTRAINT licenses_valid_dates CHECK (expires_at IS NULL OR expires_at > issued_at)
);

-- Indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_licenses_key ON licenses(license_key);
CREATE INDEX IF NOT EXISTS idx_licenses_machine_id ON licenses(machine_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_expires_at ON licenses(expires_at) WHERE expires_at IS NOT NULL;

-- License Usage Tracking Table
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

-- License Audit Log Table
CREATE TABLE IF NOT EXISTS license_audit (
    id SERIAL PRIMARY KEY,
    license_id INTEGER REFERENCES licenses(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'ACTIVATION', 'VERIFICATION', 'SUSPENSION', 'EXPIRY', 'FEATURE_ACCESS'
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    machine_id VARCHAR(128),
    status VARCHAR(20) DEFAULT 'SUCCESS', -- 'SUCCESS', 'FAILED', 'BLOCKED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_license_audit_license ON license_audit(license_id);
CREATE INDEX IF NOT EXISTS idx_license_audit_action ON license_audit(action);
CREATE INDEX IF NOT EXISTS idx_license_audit_created ON license_audit(created_at);

-- Default License Features Configuration
INSERT INTO licenses (
    license_key, machine_id, license_type, status, max_users, max_companies, 
    max_transactions_per_month, allowed_features, company_name, licensee_email,
    issued_at, expires_at
) VALUES (
    'MICRO-ACCOUNT-TRIAL-2026-DEFAULT', 
    'SYSTEM-INSTALLATION-DEFAULT', 
    'TRIAL', 
    'ACTIVE', 
    1, 
    1, 
    500,
    ARRAY['basic_journaling', 'standard_reports'],
    'Micro-Account Trial Installation',
    'system@micro-account.local',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '30 days'
) ON CONFLICT (license_key) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE licenses IS 'Licensing table for Micro-Account 5-Journal Engine protection';
COMMENT ON COLUMN licenses.license_key IS 'Unique license key for activation';
COMMENT ON COLUMN licenses.machine_id IS 'Hardware fingerprint for machine binding';
COMMENT ON COLUMN licenses.verification_hash IS 'SHA-256 hash for tamper protection';
COMMENT ON COLUMN licenses.audit_log IS 'JSON log of all license activities and violations';
COMMENT ON TABLE license_usage IS 'Track license usage to prevent abuse and enforce limits';
COMMENT ON TABLE license_audit IS 'Complete audit trail of all license-related activities';
