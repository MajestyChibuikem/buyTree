-- Make buyer_id nullable for guest checkout
ALTER TABLE orders ALTER COLUMN buyer_id DROP NOT NULL;

-- Add email column for tracking guest orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);

-- Add tracking token for guest order pages
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);
