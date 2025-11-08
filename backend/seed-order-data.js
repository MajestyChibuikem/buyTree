const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Realistic Nigerian buyer names
const BUYERS = [
  { firstName: 'Chioma', lastName: 'Okonkwo', email: 'chioma.okonkwo@gmail.com', phone: '08012345678' },
  { firstName: 'Tunde', lastName: 'Adebayo', email: 'tunde.adebayo@yahoo.com', phone: '08123456789' },
  { firstName: 'Amina', lastName: 'Mohammed', email: 'amina.mohammed@outlook.com', phone: '08098765432' },
  { firstName: 'Emeka', lastName: 'Nwankwo', email: 'emeka.nwankwo@gmail.com', phone: '07012345678' },
  { firstName: 'Blessing', lastName: 'Eze', email: 'blessing.eze@yahoo.com', phone: '07098765432' },
  { firstName: 'Yusuf', lastName: 'Ibrahim', email: 'yusuf.ibrahim@gmail.com', phone: '08134567890' },
  { firstName: 'Ngozi', lastName: 'Okafor', email: 'ngozi.okafor@outlook.com', phone: '08145678901' },
  { firstName: 'Segun', lastName: 'Williams', email: 'segun.williams@gmail.com', phone: '07023456789' },
  { firstName: 'Fatima', lastName: 'Bello', email: 'fatima.bello@yahoo.com', phone: '08156789012' },
  { firstName: 'Chukwudi', lastName: 'Obi', email: 'chukwudi.obi@gmail.com', phone: '07034567890' },
  { firstName: 'Adaeze', lastName: 'Nnamdi', email: 'adaeze.nnamdi@outlook.com', phone: '08167890123' },
  { firstName: 'Kunle', lastName: 'Ajayi', email: 'kunle.ajayi@gmail.com', phone: '07045678901' },
  { firstName: 'Hadiza', lastName: 'Usman', email: 'hadiza.usman@yahoo.com', phone: '08178901234' },
  { firstName: 'Ifeanyi', lastName: 'Okeke', email: 'ifeanyi.okeke@gmail.com', phone: '07056789012' },
  { firstName: 'Chiamaka', lastName: 'Nnaji', email: 'chiamaka.nnaji@outlook.com', phone: '08189012345' },
];

// Realistic campus delivery addresses
const ADDRESSES = [
  'Room 204, Block A, Eni Njoku Hall, University of Lagos',
  'Room 312, Fagunwa Hall, OAU Ile-Ife',
  'Flat 5, Moremi Hall, University of Ibadan',
  'Room 108, Bello Hall, ABU Zaria',
  'Block C, Room 201, Makama Bida Hall, UNILAG',
  'Room 405, Sodeinde Hall, UNILORIN',
  'Flat 12, Queen Amina Hall, UNIBEN',
  'Room 203, Awo Hall, OAU',
  'Block B, Room 301, Zik Hall, UNIZIK',
  'Room 506, Balewa Hall, UI',
];

// Order status distribution (realistic percentages)
const STATUS_DISTRIBUTION = {
  pending: 0.10,        // 10% - just paid, needs processing
  processing: 0.15,     // 15% - being prepared
  ready_for_pickup: 0.12, // 12% - ready to ship
  in_transit: 0.18,     // 18% - shipped
  delivered: 0.40,      // 40% - completed successfully
  cancelled: 0.05,      // 5% - cancelled orders
};

// Time ranges for realistic distribution
const TIME_RANGES = {
  today: { count: 5, label: 'Today' },
  yesterday: { count: 8, label: 'Yesterday' },
  last_3_days: { count: 12, label: 'Last 3 days' },
  last_week: { count: 20, label: 'Last week' },
  last_2_weeks: { count: 15, label: 'Last 2 weeks' },
  last_month: { count: 25, label: 'Last month' },
  last_3_months: { count: 15, label: 'Last 3 months' },
};

// Helper: Get random item from array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper: Get random date in range
const getRandomDate = (daysAgo) => {
  const now = new Date();
  const randomHours = Math.floor(Math.random() * 24);
  const randomMinutes = Math.floor(Math.random() * 60);
  const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  date.setHours(randomHours, randomMinutes, 0, 0);
  return date;
};

// Helper: Distribute statuses based on percentages
const getRandomStatus = () => {
  const rand = Math.random();
  let cumulative = 0;

  for (const [status, percentage] of Object.entries(STATUS_DISTRIBUTION)) {
    cumulative += percentage;
    if (rand <= cumulative) {
      return status;
    }
  }

  return 'delivered'; // Fallback
};

// Helper: Get status-appropriate dates
const getStatusDates = (createdAt, status) => {
  const dates = {
    ready_for_pickup_at: null,
    shipped_at: null,
    delivered_at: null,
  };

  const created = new Date(createdAt);

  if (['processing', 'ready_for_pickup', 'in_transit', 'delivered'].includes(status)) {
    // Add 1-3 hours to processing
    const processingTime = created.getTime() + ((1 + Math.random() * 2) * 60 * 60 * 1000);

    if (['ready_for_pickup', 'in_transit', 'delivered'].includes(status)) {
      dates.ready_for_pickup_at = new Date(processingTime + ((1 + Math.random() * 4) * 60 * 60 * 1000));

      if (['in_transit', 'delivered'].includes(status)) {
        dates.shipped_at = new Date(dates.ready_for_pickup_at.getTime() + ((2 + Math.random() * 8) * 60 * 60 * 1000));

        if (status === 'delivered') {
          dates.delivered_at = new Date(dates.shipped_at.getTime() + ((12 + Math.random() * 36) * 60 * 60 * 1000));
        }
      }
    }
  }

  return dates;
};

// Helper: Get payout status based on order status and dates
const getPayoutStatus = (status, deliveredAt) => {
  if (status !== 'delivered' || !deliveredAt) {
    return 'pending';
  }

  const now = new Date();
  const delivered = new Date(deliveredAt);
  const daysSinceDelivery = (now - delivered) / (1000 * 60 * 60 * 24);

  if (daysSinceDelivery >= 1) {
    return 'completed';
  } else {
    return 'scheduled';
  }
};

// Helper: Get payout date (T+1 from delivery)
const getPayoutDate = (deliveredAt) => {
  if (!deliveredAt) return null;

  const payout = new Date(deliveredAt);
  payout.setDate(payout.getDate() + 1);
  return payout;
};

async function seedOrders() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting order data seeding...\n');

    // Get all sellers
    const sellersResult = await client.query('SELECT id, shop_name FROM sellers');
    const sellers = sellersResult.rows;

    if (sellers.length === 0) {
      console.log('❌ No sellers found. Please run seed-dummy-data.js first.');
      return;
    }

    console.log(`✅ Found ${sellers.length} sellers\n`);

    // Create buyers if they don't exist
    console.log('👥 Creating buyer accounts...');
    const createdBuyers = [];

    for (const buyer of BUYERS) {
      const hashedPassword = '$2a$10$YourHashedPasswordHere'; // Use bcrypt in production

      const result = await client.query(
        `INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, 'buyer')
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id, first_name, last_name, email, phone`,
        [buyer.firstName, buyer.lastName, buyer.email, buyer.phone, hashedPassword]
      );

      createdBuyers.push(result.rows[0]);
    }

    console.log(`✅ Created/verified ${createdBuyers.length} buyers\n`);

    // Get all products for each seller
    console.log('📦 Fetching products for sellers...');
    const sellerProducts = {};

    for (const seller of sellers) {
      const productsResult = await client.query(
        `SELECT id, name, price FROM products
         WHERE seller_id = $1 AND deleted_at IS NULL
         LIMIT 10`,
        [seller.id]
      );

      sellerProducts[seller.id] = productsResult.rows;
    }

    console.log('✅ Products fetched\n');

    // Generate orders
    console.log('🛒 Generating orders...\n');
    let totalOrders = 0;
    const statusCounts = {};

    for (const seller of sellers) {
      const products = sellerProducts[seller.id];

      if (!products || products.length === 0) {
        console.log(`⚠️  Skipping ${seller.shop_name} - no products found`);
        continue;
      }

      // Calculate number of orders for this seller (15-40 orders per seller)
      const numOrders = 15 + Math.floor(Math.random() * 25);

      console.log(`📊 Creating ${numOrders} orders for ${seller.shop_name}...`);

      for (let i = 0; i < numOrders; i++) {
        // Random buyer
        const buyer = getRandomItem(createdBuyers);

        // Random time range
        const timeRangeKeys = Object.keys(TIME_RANGES);
        const timeRange = getRandomItem(timeRangeKeys);
        const daysAgo = {
          today: Math.random(),
          yesterday: 1 + Math.random(),
          last_3_days: Math.random() * 3,
          last_week: Math.random() * 7,
          last_2_weeks: 7 + Math.random() * 7,
          last_month: 14 + Math.random() * 16,
          last_3_months: 30 + Math.random() * 60,
        }[timeRange];

        const createdAt = getRandomDate(daysAgo);

        // Random status
        const status = getRandomStatus();
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        // Status dates
        const statusDates = getStatusDates(createdAt, status);

        // Random number of items (1-4 items per order)
        const numItems = 1 + Math.floor(Math.random() * 3);
        const orderItems = [];
        let totalAmount = 0;

        for (let j = 0; j < numItems; j++) {
          const product = getRandomItem(products);
          const quantity = 1 + Math.floor(Math.random() * 2); // 1-2 items each
          const subtotal = product.price * quantity;

          orderItems.push({
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            quantity,
            subtotal,
          });

          totalAmount += subtotal;
        }

        // Ensure minimum order value
        if (totalAmount < 4000) {
          totalAmount = 4000 + Math.floor(Math.random() * 2000);
          orderItems[0].subtotal = totalAmount; // Adjust first item
        }

        // Calculate fees
        const platformFee = totalAmount * 0.05;
        const sellerAmount = totalAmount - platformFee;

        // Delivery details
        const deliveryAddress = getRandomItem(ADDRESSES);
        const estimatedDeliveryDate = new Date(createdAt);
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 7);

        // Payout details
        const payoutStatus = getPayoutStatus(status, statusDates.delivered_at);
        const payoutDate = statusDates.delivered_at ? getPayoutDate(statusDates.delivered_at) : null;

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${seller.id}-${i}`;
        const paystackRef = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Insert order
        const orderResult = await client.query(
          `INSERT INTO orders (
            order_number, buyer_id, seller_id, total_amount, platform_fee, seller_amount,
            status, payment_status, paystack_reference,
            delivery_name, delivery_phone, delivery_address,
            estimated_delivery_date, notes,
            ready_for_pickup_at, shipped_at, delivered_at,
            payout_date, payout_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
          RETURNING id`,
          [
            orderNumber,
            buyer.id,
            seller.id,
            totalAmount,
            platformFee,
            sellerAmount,
            status,
            'paid', // All seeded orders are paid
            paystackRef,
            `${buyer.first_name} ${buyer.last_name}`,
            buyer.phone,
            deliveryAddress,
            estimatedDeliveryDate,
            Math.random() > 0.7 ? 'Please handle with care' : null, // 30% have notes
            statusDates.ready_for_pickup_at,
            statusDates.shipped_at,
            statusDates.delivered_at,
            payoutDate,
            payoutStatus,
            createdAt,
            createdAt,
          ]
        );

        const orderId = orderResult.rows[0].id;

        // Insert order items
        for (const item of orderItems) {
          await client.query(
            `INSERT INTO order_items (
              order_id, product_id, product_name, product_price, quantity, subtotal
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [orderId, item.productId, item.productName, item.productPrice, item.quantity, item.subtotal]
          );
        }

        // Create status history entries based on current status
        const statusProgression = {
          pending: ['pending'],
          processing: ['pending', 'processing'],
          ready_for_pickup: ['pending', 'processing', 'ready_for_pickup'],
          in_transit: ['pending', 'processing', 'ready_for_pickup', 'in_transit'],
          delivered: ['pending', 'processing', 'ready_for_pickup', 'in_transit', 'delivered'],
          cancelled: ['pending', 'cancelled'],
        };

        const statuses = statusProgression[status] || ['pending'];
        let historyDate = new Date(createdAt);

        for (let k = 0; k < statuses.length; k++) {
          const currentStatus = statuses[k];
          const prevStatus = k > 0 ? statuses[k - 1] : null;

          // Add some time between status changes
          if (k > 0) {
            historyDate = new Date(historyDate.getTime() + ((1 + Math.random() * 5) * 60 * 60 * 1000));
          }

          await client.query(
            `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes, created_at)
             VALUES ($1, $2, $3, NULL, $4, $5)`,
            [
              orderId,
              prevStatus,
              currentStatus,
              `System generated - ${currentStatus}`,
              historyDate,
            ]
          );
        }

        totalOrders++;
      }

      console.log(`✅ Created ${numOrders} orders for ${seller.shop_name}`);
    }

    console.log('\n✨ Order seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total orders created: ${totalOrders}`);
    console.log('\n📈 Status distribution:');
    for (const [status, count] of Object.entries(statusCounts)) {
      console.log(`   ${status}: ${count} (${((count / totalOrders) * 100).toFixed(1)}%)`);
    }
    console.log('\n✅ All done! Your sellers now have realistic order data.\n');
    console.log('💡 Login as a seller and go to "Manage Orders" to see the dashboard!\n');

  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeder
seedOrders().catch(console.error);
