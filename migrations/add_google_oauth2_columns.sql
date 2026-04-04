-- =====================================================
-- Migration: Add Google OAuth2 columns to company_settings
-- Created: 2026-04-04
-- Description: Add columns for Google Drive OAuth2 configuration
-- =====================================================

-- Check if table exists first
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables 
               WHERE table_name = 'company_settings') THEN
        
        -- Add google_client_id column
        ALTER TABLE company_settings 
        ADD COLUMN IF NOT EXISTS google_client_id VARCHAR(255);
        
        -- Add google_client_secret column
        ALTER TABLE company_settings 
        ADD COLUMN IF NOT EXISTS google_client_secret VARCHAR(255);
        
        -- Add google_refresh_token column (TEXT for long token)
        ALTER TABLE company_settings 
        ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
        
        -- Add google_redirect_uri column with default value
        ALTER TABLE company_settings 
        ADD COLUMN IF NOT EXISTS google_redirect_uri VARCHAR(255) 
        DEFAULT 'https://developers.google.com/oauthplayground';
        
        -- Add google_drive_enabled flag
        ALTER TABLE company_settings 
        ADD COLUMN IF NOT EXISTS google_drive_enabled BOOLEAN DEFAULT false;
        
        RAISE NOTICE '✅ Google OAuth2 columns added successfully';
    ELSE
        RAISE NOTICE '⚠️ Table company_settings does not exist. Creating table with all columns...';
        
        -- Create table if not exists
        CREATE TABLE IF NOT EXISTS company_settings (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) DEFAULT 'Micro-Account',
            tax_id VARCHAR(50) DEFAULT '',
            phone VARCHAR(50),
            email VARCHAR(255),
            address TEXT,
            bank_name VARCHAR(255),
            bank_account_name VARCHAR(255),
            bank_account_number VARCHAR(255),
            bank_branch VARCHAR(255),
            vat_rate NUMERIC DEFAULT 7,
            withholding_tax_rate NUMERIC DEFAULT 3,
            is_vat_registered BOOLEAN DEFAULT true,
            currency VARCHAR(10) DEFAULT 'THB',
            invoice_prefix VARCHAR(20) DEFAULT 'INV',
            quotation_prefix VARCHAR(20) DEFAULT 'QT',
            receipt_prefix VARCHAR(20) DEFAULT 'REC',
            journal_prefix VARCHAR(20) DEFAULT 'GJ',
            invoice_footer TEXT,
            quotation_footer TEXT,
            receipt_footer TEXT,
            rd_client_id VARCHAR(255),
            rd_client_secret VARCHAR(255),
            rd_api_key VARCHAR(255),
            rd_base_url VARCHAR(255) DEFAULT 'https://api-portal.rd.go.th',
            rd_enabled BOOLEAN DEFAULT false,
            -- Google OAuth2 columns
            google_client_id VARCHAR(255),
            google_client_secret VARCHAR(255),
            google_refresh_token TEXT,
            google_redirect_uri VARCHAR(255) DEFAULT 'https://developers.google.com/oauthplayground',
            google_drive_enabled BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Insert default row if table is empty
        INSERT INTO company_settings (name, tax_id, address)
        SELECT 'Micro-Account Professional', '', '123 Accounting Street, Bangkok, Thailand'
        WHERE NOT EXISTS (SELECT 1 FROM company_settings);
        
        RAISE NOTICE '✅ Table company_settings created with all columns';
    END IF;
END $$;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'company_settings'
AND column_name LIKE 'google%'
ORDER BY ordinal_position;
