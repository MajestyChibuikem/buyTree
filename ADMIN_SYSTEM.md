# BuyTree Admin Management System

Complete documentation for the Admin Dashboard and Management System.

---

## 🎯 Overview

The Admin Management System allows platform administrators to:
- Monitor all sellers and their performance
- Track platform-wide orders and revenue
- Approve or suspend sellers
- Resolve disputes
- View analytics and insights

---

## 🔐 Admin Role Setup

### Step 1: Run Database Migration

Run this in **Supabase SQL Editor**:

```sql
-- Migration 008: Add admin role and permissions

-- Add admin role to users table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'admin'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE user_role ADD VALUE 'admin';
    END IF;
END $$;

-- Create admin_actions table for audit logging
CREATE TABLE IF NOT EXISTS admin_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_actions_action_type ON admin_actions(action_type);

-- Add verification status to sellers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='sellers' AND column_name='verification_status'
    ) THEN
        ALTER TABLE sellers ADD COLUMN verification_status VARCHAR(20) DEFAULT 'pending';
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

-- Create platform_metrics table
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

CREATE INDEX IF NOT EXISTS idx_platform_metrics_date ON platform_metrics(metric_date DESC);
```

### Step 2: Create Your First Admin User

In Supabase SQL Editor:

```sql
-- Update an existing user to admin role
UPDATE users
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';

-- Verify
SELECT id, email, role FROM users WHERE role = 'admin';
```

---

## 📡 API Endpoints

All admin endpoints require:
- Valid JWT token (logged in)
- User role = 'admin'

### **Dashboard Metrics**

**GET** `/api/admin/dashboard`

Returns platform overview metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "sellers": {
      "total_sellers": 25,
      "approved_sellers": 20,
      "pending_sellers": 3,
      "suspended_sellers": 2
    },
    "orders": {
      "total_orders": 1543,
      "orders_today": 23,
      "orders_this_week": 156,
      "orders_this_month": 678,
      "total_revenue": "2450000.00",
      "total_commission": "122500.00",
      "commission_this_month": "33900.00"
    },
    "users": {
      "total_users": 543,
      "new_users_this_week": 34,
      "new_users_this_month": 120
    },
    "disputes": {
      "pending_disputes": 5
    },
    "recentOrders": [...]
  }
}
```

---

### **Seller Management**

#### Get All Sellers

**GET** `/api/admin/sellers?page=1&limit=20&status=all&search=`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status`: `all`, `pending`, `approved`, `suspended`
- `search`: Search by shop name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "sellers": [
      {
        "id": 1,
        "shop_name": "John's Electronics",
        "shop_slug": "johns-electronics",
        "verification_status": "approved",
        "email": "john@example.com",
        "total_orders": 145,
        "total_revenue": "450000.00",
        "average_rating": 4.5,
        "created_at": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "pages": 2
    }
  }
}
```

#### Approve Seller

**PUT** `/api/admin/sellers/:sellerId/approve`

**Body:**
```json
{
  "notes": "Verified documents. Approved for selling."
}
```

#### Suspend Seller

**PUT** `/api/admin/sellers/:sellerId/suspend`

**Body:**
```json
{
  "reason": "Multiple customer complaints about fake products"
}
```

---

### **Order Monitoring**

**GET** `/api/admin/orders?page=1&limit=20&status=all&search=`

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: `all`, `pending`, `processing`, `delivered`, etc.
- `search`: Search by order number or buyer email

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 123,
        "order_number": "ORD-20250118-ABC123",
        "total_amount": "15000.00",
        "platform_fee": "750.00",
        "status": "delivered",
        "buyer_name": "Jane Doe",
        "buyer_email": "jane@example.com",
        "shop_name": "John's Electronics",
        "created_at": "2025-01-18T14:20:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### **Revenue Analytics**

**GET** `/api/admin/analytics/revenue?period=30days`

**Query Parameters:**
- `period`: `7days`, `30days`, `90days`, `1year`

**Response:**
```json
{
  "success": true,
  "data": {
    "dailyRevenue": [
      {
        "date": "2025-01-18",
        "order_count": 45,
        "revenue": "125000.00",
        "commission": "6250.00"
      }
    ],
    "topSellers": [
      {
        "id": 1,
        "shop_name": "John's Electronics",
        "total_orders": 145,
        "total_revenue": "450000.00",
        "total_commission": "22500.00"
      }
    ],
    "categoryPerformance": [
      {
        "category": "Electronics & Gadgets",
        "order_count": 234,
        "revenue": "1250000.00"
      }
    ]
  }
}
```

---

## 🎨 Frontend Implementation (To Do)

### Admin Dashboard Components Needed:

1. **AdminDashboard.jsx** - Overview with metrics cards
2. **SellerManagement.jsx** - Table with approve/suspend actions
3. **OrderMonitoring.jsx** - All orders with filters
4. **RevenueAnalytics.jsx** - Charts and graphs
5. **AdminNavigation.jsx** - Admin-specific navigation

### Key Features:

- **Real-time metrics** (refresh every 30 seconds)
- **Search and filters** on all tables
- **Approval workflow** for new sellers
- **Audit log** (track all admin actions)
- **Export to CSV** for reports

---

## 🔒 Security Features

1. **Role-based Access Control (RBAC)**
   - Only users with `role = 'admin'` can access
   - Middleware checks on every request

2. **Audit Logging**
   - All admin actions logged to `admin_actions` table
   - Tracks: who, what, when, target

3. **Rate Limiting**
   - Same limits as other API routes
   - Prevents abuse even from admins

---

## 📊 Seller Verification Status

Sellers can have 4 statuses:

| Status | Description | Actions |
|--------|-------------|---------|
| `pending` | Newly registered, awaiting approval | Admin can approve/reject |
| `approved` | Verified and can sell | Admin can suspend |
| `rejected` | Not approved to sell | Admin can re-approve |
| `suspended` | Temporarily banned | Admin can re-activate |

---

## 🚀 Usage Example

### Admin Workflow:

1. **New Seller Registers**
   - Status: `pending`
   - Admin receives notification

2. **Admin Reviews Seller**
   - Views seller profile
   - Checks documents (if any)
   - Approves or rejects

3. **Approve Seller**
   ```bash
   PUT /api/admin/sellers/123/approve
   Body: { "notes": "Documents verified" }
   ```

4. **Monitor Sales**
   - Dashboard shows seller performance
   - Can suspend if issues arise

5. **Handle Complaints**
   - View order details
   - Contact buyer/seller
   - Suspend seller if needed

---

## 📈 Metrics Tracked

### Platform Health:
- Total sellers (active, pending, suspended)
- Total orders (today, week, month)
- Total revenue and commission
- New users growth
- Order completion rate

### Seller Performance:
- Orders per seller
- Revenue per seller
- Average rating
- Response time

### Revenue Insights:
- Daily/weekly/monthly revenue
- Commission earned
- Top-performing sellers
- Best-selling categories

---

## 🛠️ Future Enhancements (v2)

- [ ] Email notifications to admins (new sellers, disputes)
- [ ] Seller verification documents upload
- [ ] Dispute resolution interface
- [ ] Payout management (approve seller payouts)
- [ ] Fraud detection alerts
- [ ] Customer support ticketing
- [ ] Platform-wide announcements
- [ ] Bulk actions (approve multiple sellers)

---

## 🧪 Testing Admin Features

### 1. Create Admin User
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@test.com';
```

### 2. Test Dashboard
```bash
curl http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 3. Test Seller Approval
```bash
curl -X PUT http://localhost:5000/api/admin/sellers/1/approve \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved for testing"}'
```

---

## 📝 Admin Action Types Logged

- `approve_seller`
- `suspend_seller`
- `reject_seller`
- `reactivate_seller`
- `cancel_order`
- `issue_refund`
- `resolve_dispute`
- `ban_user`

All actions are logged with:
- Admin ID
- Action type
- Target (seller/order/user)
- Timestamp
- Additional details (JSON)

---

## 🔑 Admin Credentials (Development)

**Important:** Change these in production!

For testing, create an admin account:
```sql
INSERT INTO users (email, password, first_name, last_name, role)
VALUES (
  'admin@buytree.test',
  '$2b$12$hashedPasswordHere', -- Use bcrypt to hash
  'Admin',
  'User',
  'admin'
);
```

---

**Admin system is now ready to use!** 🎉

Next steps:
1. Run migration 008 in Supabase
2. Create your first admin user
3. Build frontend admin dashboard
4. Test all endpoints
