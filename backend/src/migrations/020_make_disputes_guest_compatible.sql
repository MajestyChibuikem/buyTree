-- Make buyer_id nullable in disputes table for guest disputes
ALTER TABLE disputes ALTER COLUMN buyer_id DROP NOT NULL;
