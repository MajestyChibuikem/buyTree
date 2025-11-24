-- Migration 008: Add admin role and permissions

-- Note: role column is VARCHAR(20), not an enum
-- Admin role can be set directly: UPDATE users SET role = 'admin' WHERE email = 'your-email'
-- Valid roles: 'buyer', 'seller', 'both', 'admin'

-- Create admin_actions table for audit logging
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'approve_seller', 'suspend_seller', 'cancel_order', 'resolve_dispute'
    target_type VARCHAR(50) NOT NULL, -- 'seller', 'order', 'user'
    target_id INTEGER NOT NULL,
    details JSONB, -- Additional action details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for admin_actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);

-- Add verification status to sellers (for admin approval)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sellers' AND column_name='verification_status'
    ) THEN
        ALTER TABLE sellers ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';
        -- 'pending', 'approved', 'rejected', 'suspended'
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sellers' AND column_name='admin_notes'
    ) THEN
        ALTER TABLE sellers ADD COLUMN admin_notes TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sellers' AND column_name='verified_at'
    ) THEN
        ALTER TABLE sellers ADD COLUMN verified_at TIMESTAMP;
    END IF;
END $$;

-- Create platform_metrics table for tracking
CREATE TABLE IF NOT EXISTS platform_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL UNIQUE,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    platform_commission DECIMAL(10, 2) DEFAULT 0,
    active_sellers INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for platform_metrics
CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON platform_metrics(metric_date DESC);

-- Verify tables were created
SELECT 'Admin system tables created successfully!' AS message;
