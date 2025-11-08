-- Fix sellers table bank columns
-- Make old columns nullable or drop them
ALTER TABLE sellers
ALTER COLUMN bank_account_number DROP NOT NULL,
ALTER COLUMN bank_code DROP NOT NULL,
ALTER COLUMN bank_name DROP NOT NULL;

-- Set default values for old columns to avoid conflicts
UPDATE sellers SET bank_account_number = account_number WHERE bank_account_number IS NULL AND account_number IS NOT NULL;
UPDATE sellers SET bank_code = '001' WHERE bank_code IS NULL;
UPDATE sellers SET bank_name = 'Test Bank' WHERE bank_name IS NULL;
