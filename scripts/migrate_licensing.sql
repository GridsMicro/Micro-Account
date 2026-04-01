CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50) NOT NULL DEFAULT 'FREE',
  max_users INTEGER NOT NULL DEFAULT 1,
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'Active',
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_id INTEGER;

DO $$
DECLARE
  default_company_id INTEGER;
  default_company_name TEXT;
BEGIN
  SELECT name INTO default_company_name FROM company_settings LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM companies) THEN
    INSERT INTO companies (name, plan_type, max_users, subscription_status, expiry_date)
    VALUES (COALESCE(default_company_name, 'Microtronic Thailand'), 'FREE', 1, 'Active', NULL);
  END IF;

  SELECT id INTO default_company_id FROM companies ORDER BY id ASC LIMIT 1;

  IF default_company_id IS NOT NULL THEN
    UPDATE users
    SET company_id = default_company_id
    WHERE company_id IS NULL;
  END IF;
END $$;
