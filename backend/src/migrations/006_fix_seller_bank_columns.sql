-- Fix sellers table bank columns (safe - checks if columns exist)

-- Only modify columns if they exist
DO $$
BEGIN
    -- Check and modify bank_account_number if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='sellers' AND column_name='bank_account_number') THEN
        ALTER TABLE sellers ALTER COLUMN bank_account_number DROP NOT NULL;

        -- Copy data if needed
        UPDATE sellers SET bank_account_number = account_number
        WHERE bank_account_number IS NULL AND account_number IS NOT NULL;
    END IF;

    -- Check and modify bank_code if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='sellers' AND column_name='bank_code') THEN
        ALTER TABLE sellers ALTER COLUMN bank_code DROP NOT NULL;
        UPDATE sellers SET bank_code = '001' WHERE bank_code IS NULL;
    END IF;

    -- Check and modify bank_name if exists
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='sellers' AND column_name='bank_name') THEN
        ALTER TABLE sellers ALTER COLUMN bank_name DROP NOT NULL;
        UPDATE sellers SET bank_name = 'Test Bank' WHERE bank_name IS NULL;
    END IF;
END $$;
