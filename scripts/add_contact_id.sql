-- Add contact_id column to quotations table if it doesn't exist
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id);

-- Show current columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quotations' 
ORDER BY ordinal_position;
