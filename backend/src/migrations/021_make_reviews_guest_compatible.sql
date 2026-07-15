-- Make buyer_id nullable in reviews table for guest reviews
ALTER TABLE reviews ALTER COLUMN buyer_id DROP NOT NULL;

-- Add display_name column for guest reviews (optional custom name)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);

-- Drop the old unique constraint involving buyer_id
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_buyer_id_order_id_key;

-- Add new unique constraint to ensure one review per product per order
ALTER TABLE reviews ADD CONSTRAINT reviews_product_id_order_id_key UNIQUE (product_id, order_id);
