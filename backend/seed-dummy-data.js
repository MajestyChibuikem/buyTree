require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Sample image URLs (these should be uploaded to Cloudinary first)
// For now, using placeholder URLs - replace with actual Cloudinary URLs after upload
const SAMPLE_IMAGES = {
  electronics: [
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800', // Gadgets
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', // Headphones
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', // Watch
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800', // Sunglasses
  ],
  fashion: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800', // Clothing
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800', // Sneakers
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', // Bag
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800', // Dress
  ],
  books: [
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800', // Books
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800', // Notebook
    'https://images.unsplash.com/photo-1546521343-4eb2c01aa44b?w=800', // Stationery
  ],
  food: [
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800', // Snacks
    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800', // Food
  ],
  beauty: [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', // Skincare
    'https://images.unsplash.com/photo-1631214524020-7e18db3a8f39?w=800', // Makeup
  ],
  sports: [
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800', // Sports
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800', // Gym
  ],
};

// Dummy sellers data
const SELLERS = [
  {
    firstName: 'Hugo',
    lastName: 'Martinez',
    email: 'hugo@student.edu',
    phone: '08012345678',
    shopName: 'Hugo Gadgets',
    shopDescription: 'Your one-stop shop for the latest tech gadgets and accessories',
    categories: ['Electronics & Gadgets'],
    verified: true,
    accountNumber: '1234567890',
    bankCode: '058',
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah@student.edu',
    phone: '08023456789',
    shopName: 'Campus Fashion Hub',
    shopDescription: 'Trendy fashion pieces for the modern student',
    categories: ['Fashion & Apparel'],
    verified: true,
    accountNumber: '2345678901',
    bankCode: '058',
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael@student.edu',
    phone: '08034567890',
    shopName: 'BookWorm Central',
    shopDescription: 'Textbooks, novels, and stationery for every student',
    categories: ['Books & Stationery'],
    verified: false,
    accountNumber: '3456789012',
    bankCode: '058',
  },
  {
    firstName: 'Amina',
    lastName: 'Okafor',
    email: 'amina@student.edu',
    phone: '08045678901',
    shopName: 'Snack Haven',
    shopDescription: 'Delicious snacks and beverages delivered to your dorm',
    categories: ['Food & Snacks'],
    verified: true,
    accountNumber: '4567890123',
    bankCode: '058',
  },
  {
    firstName: 'David',
    lastName: 'Williams',
    email: 'david@student.edu',
    phone: '08056789012',
    shopName: 'Glow Beauty',
    shopDescription: 'Premium beauty and personal care products',
    categories: ['Beauty & Personal Care'],
    verified: false,
    accountNumber: '5678901234',
    bankCode: '058',
  },
  {
    firstName: 'Jessica',
    lastName: 'Taylor',
    email: 'jessica@student.edu',
    phone: '08067890123',
    shopName: 'FitLife Sports',
    shopDescription: 'Sports equipment and fitness gear for active students',
    categories: ['Sports & Fitness'],
    verified: false,
    accountNumber: '6789012345',
    bankCode: '058',
  },
];

// Products for each seller
const PRODUCTS = {
  'Hugo Gadgets': [
    { name: 'Wireless Earbuds Pro', description: 'Premium wireless earbuds with noise cancellation and 24h battery life', price: 25000, quantity: 15, category: 'Electronics & Gadgets', images: 'electronics' },
    { name: 'Smart Watch Series 5', description: 'Fitness tracking smartwatch with heart rate monitor and GPS', price: 45000, quantity: 8, category: 'Electronics & Gadgets', images: 'electronics' },
    { name: 'Portable Power Bank 20000mAh', description: 'Fast charging power bank with dual USB ports', price: 12000, quantity: 25, category: 'Electronics & Gadgets', images: 'electronics' },
    { name: 'Bluetooth Speaker Mini', description: 'Compact waterproof speaker with amazing sound quality', price: 8500, quantity: 20, category: 'Electronics & Gadgets', images: 'electronics' },
    { name: 'USB-C Hub 7-in-1', description: 'Multi-port hub for laptops with HDMI, USB 3.0, and SD card reader', price: 15000, quantity: 12, category: 'Electronics & Gadgets', images: 'electronics' },
  ],
  'Campus Fashion Hub': [
    { name: 'Classic Denim Jacket', description: 'Stylish denim jacket perfect for campus life', price: 18000, quantity: 10, category: 'Fashion & Apparel', images: 'fashion' },
    { name: 'Canvas Sneakers', description: 'Comfortable all-day wear sneakers in multiple colors', price: 12000, quantity: 30, category: 'Fashion & Apparel', images: 'fashion' },
    { name: 'Leather Backpack', description: 'Premium leather backpack with laptop compartment', price: 35000, quantity: 5, category: 'Fashion & Apparel', images: 'fashion' },
    { name: 'Graphic T-Shirt Collection', description: 'Trendy graphic tees with unique designs', price: 5500, quantity: 40, category: 'Fashion & Apparel', images: 'fashion' },
    { name: 'Baseball Cap', description: 'Adjustable baseball cap in various colors', price: 3500, quantity: 25, category: 'Fashion & Apparel', images: 'fashion' },
    { name: 'Ankle Boots', description: 'Fashionable ankle boots for any occasion', price: 22000, quantity: 8, category: 'Fashion & Apparel', images: 'fashion' },
  ],
  'BookWorm Central': [
    { name: 'Engineering Mathematics Textbook', description: 'Comprehensive mathematics textbook for engineering students', price: 8500, quantity: 15, category: 'Books & Stationery', images: 'books' },
    { name: 'Premium Notebook Set (5 pack)', description: 'High-quality ruled notebooks perfect for lectures', price: 3500, quantity: 50, category: 'Books & Stationery', images: 'books' },
    { name: 'Scientific Calculator', description: 'Advanced scientific calculator for exams', price: 6500, quantity: 20, category: 'Books & Stationery', images: 'books' },
    { name: 'Bestseller Novel Collection', description: 'Popular fiction novels for leisure reading', price: 4500, quantity: 12, category: 'Books & Stationery', images: 'books' },
    { name: 'Art Supply Kit', description: 'Complete drawing and sketching kit', price: 12000, quantity: 8, category: 'Books & Stationery', images: 'books' },
  ],
  'Snack Haven': [
    { name: 'Premium Chocolate Mix Pack', description: 'Assorted premium chocolates and candy', price: 2500, quantity: 100, category: 'Food & Snacks', images: 'food' },
    { name: 'Energy Drink (12 pack)', description: 'Stay energized during late night study sessions', price: 4500, quantity: 40, category: 'Food & Snacks', images: 'food' },
    { name: 'Chips Variety Box', description: 'Mix of popular chip flavors', price: 3500, quantity: 60, category: 'Food & Snacks', images: 'food' },
    { name: 'Instant Noodles Bundle', description: 'Quick and easy meals for busy students', price: 2000, quantity: 80, category: 'Food & Snacks', images: 'food' },
    { name: 'Protein Bars (10 pack)', description: 'Healthy protein snacks for fitness enthusiasts', price: 5500, quantity: 30, category: 'Food & Snacks', images: 'food' },
  ],
  'Glow Beauty': [
    { name: 'Skincare Routine Set', description: 'Complete morning and night skincare routine', price: 18000, quantity: 15, category: 'Beauty & Personal Care', images: 'beauty' },
    { name: 'Makeup Starter Kit', description: 'Essential makeup products for beginners', price: 12000, quantity: 10, category: 'Beauty & Personal Care', images: 'beauty' },
    { name: 'Hair Care Bundle', description: 'Shampoo, conditioner, and hair treatment', price: 8500, quantity: 20, category: 'Beauty & Personal Care', images: 'beauty' },
    { name: 'Perfume Collection Mini', description: 'Set of 5 luxury fragrance samples', price: 6500, quantity: 25, category: 'Beauty & Personal Care', images: 'beauty' },
  ],
  'FitLife Sports': [
    { name: 'Yoga Mat Premium', description: 'Extra thick non-slip yoga mat with carrying strap', price: 8500, quantity: 15, category: 'Sports & Fitness', images: 'sports' },
    { name: 'Resistance Bands Set', description: '5 resistance levels for complete workout', price: 5500, quantity: 20, category: 'Sports & Fitness', images: 'sports' },
    { name: 'Water Bottle 1L', description: 'Insulated stainless steel water bottle', price: 4500, quantity: 30, category: 'Sports & Fitness', images: 'sports' },
    { name: 'Gym Gloves', description: 'Breathable workout gloves with wrist support', price: 3500, quantity: 25, category: 'Sports & Fitness', images: 'sports' },
    { name: 'Jump Rope Speed', description: 'Adjustable speed jump rope for cardio', price: 2500, quantity: 35, category: 'Sports & Fitness', images: 'sports' },
  ],
};

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seeding...\n');

    // Start transaction
    await client.query('BEGIN');

    // Skip cleanup to preserve existing data - use unique slugs with timestamp
    const timestamp = Date.now();

    const password = await bcrypt.hash('Password123!', 10);

    // Create sellers
    console.log('📦 Creating sellers...');
    const sellerIds = {};

    for (const seller of SELLERS) {
      // Create user account
      const userResult = await client.query(
        `INSERT INTO users (first_name, last_name, email, phone, password_hash, role, created_at)
         VALUES ($1, $2, $3, $4, $5, 'seller', CURRENT_TIMESTAMP)
         RETURNING id`,
        [seller.firstName, seller.lastName, seller.email, seller.phone, password]
      );
      const userId = userResult.rows[0].id;

      // Create unique slug with timestamp
      const slug = seller.shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${timestamp}`;

      // Create seller account (without Paystack for demo)
      const sellerResult = await client.query(
        `INSERT INTO sellers (
          user_id, shop_name, shop_slug, shop_description, categories,
          bank_name, account_number, bank_code, is_verified, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        RETURNING id`,
        [
          userId,
          seller.shopName,
          slug,
          seller.shopDescription,
          seller.categories,
          'GTBank',
          seller.accountNumber,
          seller.bankCode,
          seller.verified,
        ]
      );

      sellerIds[seller.shopName] = sellerResult.rows[0].id;
      console.log(`✅ Created seller: ${seller.shopName}${seller.verified ? ' (VERIFIED)' : ''}`);
    }

    // Create products
    console.log('\n📱 Creating products...');
    let productCount = 0;

    for (const [shopName, products] of Object.entries(PRODUCTS)) {
      const sellerId = sellerIds[shopName];

      for (const product of products) {
        const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const imageCategory = product.images;
        const imageUrls = SAMPLE_IMAGES[imageCategory].slice(0, 3); // Use 3 images per product

        await client.query(
          `INSERT INTO products (
            seller_id, name, slug, description, price, quantity_available,
            category, image_urls, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
          [
            sellerId,
            product.name,
            productSlug,
            product.description,
            product.price,
            product.quantity,
            product.category,
            imageUrls,
          ]
        );

        productCount++;
      }
      console.log(`✅ Created ${products.length} products for ${shopName}`);
    }

    // Commit transaction
    await client.query('COMMIT');

    console.log('\n✨ Database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Sellers created: ${SELLERS.length}`);
    console.log(`   - Verified sellers: ${SELLERS.filter(s => s.verified).length}`);
    console.log(`   - Products created: ${productCount}`);
    console.log(`\n🔐 All seller accounts use password: Password123!`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run seeding
seedDatabase()
  .then(() => {
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
