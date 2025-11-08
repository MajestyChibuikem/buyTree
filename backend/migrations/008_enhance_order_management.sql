-- Migration: Enhanced Order Management System
-- Purpose: Add fields and tables for enterprise-grade seller order management
-- Date: 2025-01-19

-- Add order status history tracking (audit trail)
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INTEGER REFERENCES users(id), -- NULL for system changes
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- Add seller notes table (internal notes for order fulfillment)
CREATE TABLE IF NOT EXISTS order_seller_notes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_seller_notes_order_id ON order_seller_notes(order_id);
CREATE INDEX idx_order_seller_notes_seller_id ON order_seller_notes(seller_id);

-- Add notification preferences table for sellers
CREATE TABLE IF NOT EXISTS seller_notification_preferences (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER UNIQUE NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  email_new_order BOOLEAN DEFAULT TRUE,
  email_order_cancelled BOOLEAN DEFAULT TRUE,
  email_delivery_confirmed BOOLEAN DEFAULT TRUE,
  email_payout_ready BOOLEAN DEFAULT TRUE,
  email_low_stock BOOLEAN DEFAULT TRUE,
  email_dispute_created BOOLEAN DEFAULT TRUE,
  sms_new_order BOOLEAN DEFAULT FALSE, -- SMS costs money, default off
  sms_order_cancelled BOOLEAN DEFAULT FALSE,
  sms_delivery_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add order cancellation tracking
CREATE TABLE IF NOT EXISTS order_cancellations (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  cancelled_by INTEGER NOT NULL REFERENCES users(id),
  cancelled_by_role VARCHAR(20) NOT NULL, -- buyer, seller, admin, system
  cancellation_reason TEXT NOT NULL,
  refund_initiated BOOLEAN DEFAULT FALSE,
  refund_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_cancellations_order_id ON order_cancellations(order_id);
CREATE INDEX idx_order_cancellations_created_at ON order_cancellations(created_at DESC);

-- Add additional fields to orders table if they don't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_status_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_for_pickup_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_notified_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_notified_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_deadline TIMESTAMP; -- 30 minutes from creation
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add composite indexes for seller dashboard queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_orders_seller_status_created ON orders(seller_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_seller_payment_status ON orders(seller_id, payment_status);

-- Add function to automatically update order status timestamp
CREATE OR REPLACE FUNCTION update_order_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_status_update = CURRENT_TIMESTAMP;
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for order status updates
DROP TRIGGER IF EXISTS trg_update_order_status_timestamp ON orders;
CREATE TRIGGER trg_update_order_status_timestamp
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_status_timestamp();

-- Add function to automatically track status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NULL); -- NULL means system change, override in app for user changes
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for status history tracking
DROP TRIGGER IF EXISTS trg_track_order_status_change ON orders;
CREATE TRIGGER trg_track_order_status_change
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION track_order_status_change();

-- Add function to set cancellation deadline on order creation
CREATE OR REPLACE FUNCTION set_cancellation_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- Set cancellation deadline to 30 minutes after order creation
  NEW.cancellation_deadline = NEW.created_at + INTERVAL '30 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for cancellation deadline
DROP TRIGGER IF EXISTS trg_set_cancellation_deadline ON orders;
CREATE TRIGGER trg_set_cancellation_deadline
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_cancellation_deadline();

-- Create view for seller dashboard summary (performance optimization)
CREATE OR REPLACE VIEW seller_order_dashboard_summary AS
SELECT
  seller_id,
  COUNT(*) FILTER (WHERE status = 'pending' AND payment_status = 'paid') as pending_orders,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_orders,
  COUNT(*) FILTER (WHERE status = 'ready_for_pickup') as ready_for_pickup_orders,
  COUNT(*) FILTER (WHERE status = 'in_transit') as in_transit_orders,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours') as orders_last_24h,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as orders_last_7days,
  SUM(total_amount) FILTER (WHERE status = 'delivered' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_last_30days,
  SUM(seller_amount) FILTER (WHERE payout_status = 'completed') as total_payouts_completed,
  SUM(seller_amount) FILTER (WHERE payout_status = 'pending' OR payout_status = 'scheduled') as pending_payouts
FROM orders
WHERE payment_status = 'paid'
GROUP BY seller_id;

-- Add comments for documentation
COMMENT ON TABLE order_status_history IS 'Audit trail for all order status changes';
COMMENT ON TABLE order_seller_notes IS 'Internal notes sellers can add to orders for fulfillment tracking';
COMMENT ON TABLE seller_notification_preferences IS 'Seller preferences for email and SMS notifications';
COMMENT ON TABLE order_cancellations IS 'Tracking of all order cancellations with reasons and refund status';
COMMENT ON VIEW seller_order_dashboard_summary IS 'Materialized summary of seller orders for fast dashboard loading';

-- Migration complete
-- Run this SQL in your Supabase SQL Editor
