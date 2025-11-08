# Order Data Seeding Script

## 🎯 Purpose

This script generates realistic, nuanced order data for testing the Seller Order Management system. It creates orders with natural distribution across:
- Different statuses
- Various time ranges
- Multiple buyers
- Realistic amounts
- Complete order histories

## 📊 What It Creates

### Order Distribution (Per Seller):
- **15-40 orders** per seller (randomized)
- **Status distribution**:
  - 10% Pending (just paid)
  - 15% Processing (being prepared)
  - 12% Ready for Pickup
  - 18% In Transit (shipped)
  - 40% Delivered (completed)
  - 5% Cancelled

### Time Distribution:
- Orders spread across last 3 months
- Natural clustering (more recent orders)
- Realistic time progression between statuses

### Order Details:
- 1-4 items per order
- Total amounts from ₦4,000 to ₦50,000+
- 15 unique buyers with Nigerian names
- 10 realistic campus delivery addresses
- Complete status history for each order
- Payout tracking (T+1 from delivery)

## 🚀 How to Run

### Step 1: Navigate to backend directory
```bash
cd backend
```

### Step 2: Run the seeder
```bash
node seed-order-data.js
```

### Expected Output:
```
🌱 Starting order data seeding...

✅ Found 6 sellers

👥 Creating buyer accounts...
✅ Created/verified 15 buyers

📦 Fetching products for sellers...
✅ Products fetched

🛒 Generating orders...

📊 Creating 23 orders for Hugo Gadgets...
✅ Created 23 orders for Hugo Gadgets
📊 Creating 31 orders for Campus Fashion Hub...
✅ Created 31 orders for Campus Fashion Hub
...

✨ Order seeding complete!

📊 Summary:
   Total orders created: 165

📈 Status distribution:
   pending: 17 (10.3%)
   processing: 25 (15.2%)
   ready_for_pickup: 20 (12.1%)
   in_transit: 30 (18.2%)
   delivered: 66 (40.0%)
   cancelled: 7 (4.2%)

✅ All done! Your sellers now have realistic order data.

💡 Login as a seller and go to "Manage Orders" to see the dashboard!
```

## 📋 Prerequisites

- ✅ Database migration `008_enhance_order_management.sql` must be run
- ✅ Sellers must exist (run `seed-dummy-data.js` first if needed)
- ✅ Products must exist for sellers
- ✅ Backend environment variables configured

## 🧪 What You Can Test

After running the seeder, you can test:

### 1. Performance Summary Cards
- **Needs Action**: Should show pending + processing orders
- **Revenue (30d)**: Should show delivered orders revenue
- **Pending Payouts**: Orders delivered but not paid out yet
- **Recent Activity**: Orders from last 24h and 7 days

### 2. Status Tabs
- Click each tab to see filtered orders
- Count badges should match
- Orders should be in correct status

### 3. Search Functionality
- Search by order number (e.g., "ORD-")
- Search by buyer name (e.g., "Chioma")

### 4. Time Distribution
- Orders should span from today back to 3 months
- Recent orders should be more common

### 5. Order Details
- Each order should have:
  - Complete buyer info
  - Delivery address
  - Order items
  - Status history
  - Correct timestamps

### 6. Workflow Timeline
- View order details
- Timeline should show progression
- Timestamps should be realistic

## 🔄 Re-running the Script

You can safely re-run the script multiple times. It will:
- Create new orders each time
- Reuse existing buyers (won't create duplicates)
- Add more data for testing

**Note**: If you want to start fresh, delete existing orders from the database first:
```sql
DELETE FROM order_items;
DELETE FROM order_status_history;
DELETE FROM orders WHERE order_number LIKE 'ORD-%';
```

## 📝 Customization

You can modify the script to:

### Change order volume:
```javascript
// Line ~175
const numOrders = 15 + Math.floor(Math.random() * 25); // Change to 50 + Math.floor(Math.random() * 50) for more
```

### Adjust status distribution:
```javascript
// Line ~42
const STATUS_DISTRIBUTION = {
  pending: 0.20,        // Increase to 20%
  processing: 0.20,     // Increase to 20%
  ready_for_pickup: 0.10,
  in_transit: 0.15,
  delivered: 0.30,      // Reduce to 30%
  cancelled: 0.05,
};
```

### Change time ranges:
```javascript
// Line ~50
const TIME_RANGES = {
  today: { count: 10 },        // More today
  yesterday: { count: 15 },    // More yesterday
  last_week: { count: 30 },    // More last week
  // ... etc
};
```

## 🎯 Testing Scenarios

### Scenario 1: New Seller
- Should see mostly pending/processing orders
- Low revenue
- High "needs action" count

### Scenario 2: Established Seller
- Mix of all statuses
- Good revenue from delivered orders
- Pending payouts accumulating

### Scenario 3: Active Seller
- Many recent orders (last 24h)
- Multiple orders in transit
- Regular delivery completion

## 💡 Tips

1. **Login as different sellers** to see varying data
2. **Test status updates** on pending/processing orders
3. **Check email notifications** (should be logged in console)
4. **Verify payout calculations** on delivered orders
5. **Test search** with various buyer names and order numbers
6. **Check mobile responsiveness** with realistic data

## 🐛 Troubleshooting

### "No sellers found"
- Run `seed-dummy-data.js` first to create sellers

### "No products found for seller"
- Make sure sellers have products
- Check products aren't soft-deleted (deleted_at IS NULL)

### Orders not showing in dashboard
- Verify `payment_status = 'paid'`
- Check seller ID matches logged-in user
- Refresh the page

### Performance slow with many orders
- This is expected with 100+ orders
- Tests the pagination system
- Verifies performance optimizations working

## ✅ Success Criteria

After seeding, you should see:
- ✅ Performance cards with realistic numbers
- ✅ Orders distributed across all status tabs
- ✅ Search functionality working
- ✅ Pagination working (if 20+ orders)
- ✅ Recent orders appear first
- ✅ Complete order details
- ✅ WhatsApp links working
- ✅ Status timeline showing progression

## 🚀 Ready to Test!

Run the script and experience the Seller Order Management dashboard with realistic data that simulates a thriving marketplace!
