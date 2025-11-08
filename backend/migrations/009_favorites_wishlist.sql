-- Migration 009: Favorite Products / Wishlist Feature
-- Allows buyers to save products they're interested in

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure user can't favorite same product twice
  UNIQUE(user_id, product_id)
);

-- Create index for fast user favorites lookup
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);

-- Create index for product popularity tracking
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);

-- Create composite index for checking if user favorited a product
CREATE INDEX IF NOT EXISTS idx_favorites_user_product ON favorites(user_id, product_id);

-- Add favorites_count to products table for quick access
ALTER TABLE products ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;

-- Create function to update favorites count
CREATE OR REPLACE FUNCTION update_product_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE products SET favorites_count = favorites_count + 1 WHERE id = NEW.product_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE products SET favorites_count = GREATEST(0, favorites_count - 1) WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update favorites count
DROP TRIGGER IF EXISTS trigger_update_favorites_count ON favorites;
CREATE TRIGGER trigger_update_favorites_count
  AFTER INSERT OR DELETE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_product_favorites_count();

-- Initialize favorites_count for existing products
UPDATE products p
SET favorites_count = (
  SELECT COUNT(*)
  FROM favorites f
  WHERE f.product_id = p.id
);

COMMENT ON TABLE favorites IS 'User favorite products (wishlist)';
COMMENT ON COLUMN products.favorites_count IS 'Cached count of users who favorited this product';
