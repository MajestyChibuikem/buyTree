-- Add missing columns to sellers table
ALTER TABLE sellers
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;

-- Update existing column names for consistency
DO $$
BEGIN
    -- Check if bank_account_number exists and rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sellers' AND column_name='bank_account_number'
    ) THEN
        ALTER TABLE sellers RENAME COLUMN bank_account_number TO account_number_old;
    END IF;
END $$;

-- Create index on categories for faster filtering
CREATE INDEX IF NOT EXISTS idx_sellers_categories ON sellers USING GIN(categories);
