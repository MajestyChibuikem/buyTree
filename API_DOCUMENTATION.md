# BuyTree API Documentation

Complete API reference for the BuyTree e-commerce platform.

**Base URL**: `http://localhost:5001/api` (Development)

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [Password Reset](#password-reset)
3. [Sellers](#sellers)
4. [Products](#products)
5. [Cart](#cart)
6. [Orders](#orders)
7. [Reviews](#reviews)
8. [Favorites](#favorites)
9. [Analytics](#analytics)
10. [Upload](#upload)
11. [Admin](#admin)

---

## 🔐 Authentication

All authenticated requests require a JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Register (Sign Up)

**POST** `/auth/signup`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "buyer"
}
```

**Roles:** `buyer`, `seller`, `both`

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer"
  }
}
```

---

### Login

**POST** `/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "buyer"
  }
}
```

---

### Get Current User

**GET** `/auth/me`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer"
  }
}
```

---

## 🔑 Password Reset

### Request Password Reset

**POST** `/password-reset/request`

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

---

### Verify Reset Token

**GET** `/password-reset/verify/:token`

**Response:**
```json
{
  "success": true,
  "valid": true
}
```

---

### Reset Password

**POST** `/password-reset/reset`

**Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 🏪 Sellers

### Get All Banks (for bank account setup)

**GET** `/sellers/banks`

**Response:**
```json
{
  "success": true,
  "banks": [
    {
      "id": 1,
      "name": "Access Bank",
      "code": "044"
    }
  ]
}
```

---

### Register as Seller

**POST** `/sellers/register`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "shopName": "John's Electronics",
  "categories": ["Electronics & Gadgets", "Phones & Tablets"],
  "bankCode": "044",
  "accountNumber": "1234567890"
}
```

**Notes:**
- `categories` - Array of 1-3 category strings
- `bankCode` - Nigerian bank code (e.g., "044" for Access Bank, or "001" for testing)
- Bank account is verified with Paystack automatically
- A Paystack subaccount is created (95% to seller, 5% platform fee)

**Response:**
```json
{
  "success": true,
  "message": "Seller account created successfully",
  "data": {
    "seller": {
      "id": 1,
      "shop_name": "John's Electronics",
      "shop_slug": "johns-electronics",
      "categories": ["Electronics & Gadgets", "Phones & Tablets"]
    },
    "accountName": "JOHN DOE",
    "shopUrl": "/shop/johns-electronics"
  }
}
```

---

### Get All Sellers/Shops

**GET** `/sellers/shops/all?page=1&limit=20`

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "sellers": [
    {
      "id": 1,
      "shopName": "John's Electronics",
      "shopSlug": "johns-electronics",
      "shopDescription": "Best electronics",
      "productsCount": 25,
      "averageRating": 4.5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### Get Seller by Shop Slug

**GET** `/sellers/:shopSlug`

**Example:** `/sellers/johns-electronics`

**Response:**
```json
{
  "success": true,
  "seller": {
    "id": 1,
    "shopName": "John's Electronics",
    "shopSlug": "johns-electronics",
    "shopDescription": "Best electronics in town",
    "phoneNumber": "08012345678",
    "businessAddress": "123 Main St, Lagos",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

---

### Get My Seller Profile

**GET** `/sellers/profile/me`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "seller": {
    "id": 1,
    "shopName": "John's Electronics",
    "shopSlug": "johns-electronics",
    "accountNumber": "1234567890",
    "bankName": "Access Bank"
  }
}
```

---

## 📦 Products

### Get All Products

**GET** `/products?page=1&limit=20&category=&minPrice=&maxPrice=&sortBy=newest`

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page
- `category` - Filter by category
- `minPrice`, `maxPrice` - Price range
- `sortBy` - `newest`, `price_low`, `price_high`, `popular`

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "name": "iPhone 15 Pro",
      "description": "Latest iPhone",
      "price": "450000.00",
      "category": "Electronics & Gadgets",
      "stock": 10,
      "images": ["https://res.cloudinary.com/..."],
      "shopName": "John's Electronics",
      "shopSlug": "johns-electronics",
      "averageRating": 4.5
    }
  ],
  "pagination": {...}
}
```

---

### Search Products

**GET** `/products/search?q=iphone&page=1&limit=20`

**Query Parameters:**
- `q` - Search query
- `page`, `limit` - Pagination

---

### Get Products by Shop

**GET** `/products/shop/:shopSlug?page=1&limit=20`

**Example:** `/products/shop/johns-electronics`

---

### Get Single Product

**GET** `/products/:id`

**Response:**
```json
{
  "success": true,
  "product": {
    "id": 1,
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone with A17 Pro chip",
    "price": "450000.00",
    "category": "Electronics & Gadgets",
    "stock": 10,
    "images": ["https://..."],
    "seller": {
      "shopName": "John's Electronics",
      "shopSlug": "johns-electronics"
    },
    "reviews": [...]
  }
}
```

---

### Create Product (Seller Only)

**POST** `/products`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone",
  "price": 450000,
  "category": "Electronics & Gadgets",
  "stock": 10,
  "images": ["https://res.cloudinary.com/..."]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {...}
}
```

---

### Get My Products (Seller Only)

**GET** `/products/my/products?page=1&limit=20`

**Headers:** `Authorization: Bearer TOKEN`

---

### Update Product (Seller Only)

**PUT** `/products/:id`

**Headers:** `Authorization: Bearer TOKEN`

**Body:** (same as create, but all fields optional)

---

### Delete Product (Seller Only)

**DELETE** `/products/:id`

**Headers:** `Authorization: Bearer TOKEN`

---

## 🛒 Cart

All cart routes require authentication.

### Get Cart

**GET** `/cart`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "cart": {
    "id": 1,
    "userId": 1,
    "items": [
      {
        "id": 1,
        "productId": 5,
        "quantity": 2,
        "product": {
          "name": "iPhone 15 Pro",
          "price": "450000.00",
          "images": ["https://..."]
        },
        "subtotal": "900000.00"
      }
    ],
    "totalItems": 2,
    "totalAmount": "900000.00"
  }
}
```

---

### Add to Cart

**POST** `/cart/add`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "productId": 5,
  "quantity": 2
}
```

---

### Update Cart Item

**PUT** `/cart/update`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "productId": 5,
  "quantity": 3
}
```

---

### Remove from Cart

**DELETE** `/cart/remove/:productId`

**Headers:** `Authorization: Bearer TOKEN`

---

### Clear Cart

**DELETE** `/cart/clear`

**Headers:** `Authorization: Bearer TOKEN`

---

## 📦 Orders

All order routes require authentication.

### Create Order (Checkout)

**POST** `/orders/create`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "orders": [
    {
      "sellerId": 1,
      "items": [
        {
          "productId": 5,
          "quantity": 2,
          "price": 450000
        },
        {
          "productId": 8,
          "quantity": 1,
          "price": 25000
        }
      ]
    }
  ],
  "deliveryDetails": {
    "name": "John Doe",
    "phone": "08012345678",
    "address": "123 Main St, Yaba, Lagos"
  }
}
```

**Notes:**
- `orders` - Array of orders (one per seller, since BuyTree supports multiple sellers in one checkout)
- `sellerId` - ID of the seller
- `items` - Array of products from that seller
- Minimum order value: ₦4,000 per seller
- Platform takes 5% commission automatically via Paystack split payment

**Response:**
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/abc123",
    "reference": "BT-1737287654321-1",
    "totalAmount": 925000
  }
}
```

---

### Verify Payment

**GET** `/orders/verify/:reference`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "order": {...}
}
```

---

### Get User Orders (Buyer)

**GET** `/orders/user?page=1&limit=20&status=all`

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters:**
- `page`, `limit` - Pagination
- `status` - Filter by: `all`, `pending`, `processing`, `delivered`, etc.

---

### Get Order Details

**GET** `/orders/:orderId`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "order": {
    "id": 1,
    "orderNumber": "ORD-20250118-ABC123",
    "status": "processing",
    "totalAmount": "900000.00",
    "deliveryAddress": "123 Main St",
    "items": [...],
    "buyer": {...},
    "seller": {...}
  }
}
```

---

### Confirm Delivery (Buyer)

**POST** `/orders/:orderId/confirm-delivery`

**Headers:** `Authorization: Bearer TOKEN`

---

### Get Seller Dashboard Summary

**GET** `/orders/seller/dashboard-summary`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "pendingOrders": 5,
    "processingOrders": 10,
    "completedOrders": 130,
    "totalRevenue": "2500000.00",
    "recentOrders": [...]
  }
}
```

---

### Get Seller Orders by Status

**GET** `/orders/seller/orders/:status?page=1&limit=20&search=`

**Headers:** `Authorization: Bearer TOKEN`

**Status values:** `pending`, `processing`, `ready_for_pickup`, `in_transit`, `delivered`, `cancelled`

---

### Update Order Status (Seller)

**PUT** `/orders/seller/:orderId/status`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "status": "processing",
  "notes": "Order is being prepared"
}
```

---

### Add Seller Note

**POST** `/orders/seller/:orderId/notes`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "note": "Customer requested extra packaging"
}
```

---

### Get Order Status History

**GET** `/orders/:orderId/history`

**Headers:** `Authorization: Bearer TOKEN`

---

## ⭐ Reviews

### Get Product Reviews

**GET** `/reviews/product/:productId?page=1&limit=20&sortBy=newest`

**Query Parameters:**
- `sortBy` - `newest`, `highest`, `lowest`, `helpful`

**Response:**
```json
{
  "success": true,
  "reviews": [
    {
      "id": 1,
      "rating": 5,
      "comment": "Great product!",
      "buyerName": "John Doe",
      "createdAt": "2025-01-18T10:00:00Z",
      "helpfulCount": 5,
      "sellerResponse": "Thank you!"
    }
  ],
  "stats": {
    "averageRating": 4.5,
    "totalReviews": 50,
    "distribution": {
      "5": 30,
      "4": 15,
      "3": 3,
      "2": 1,
      "1": 1
    }
  }
}
```

---

### Create Review

**POST** `/reviews`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "productId": 5,
  "orderId": 1,
  "rating": 5,
  "comment": "Excellent product, fast delivery!"
}
```

**Note:** Can only review products from completed orders.

---

### Get Reviewable Products

**GET** `/reviews/reviewable-products`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "productId": 5,
      "productName": "iPhone 15 Pro",
      "orderId": 1,
      "orderDate": "2025-01-15T10:00:00Z",
      "hasReviewed": false
    }
  ]
}
```

---

### Get My Reviews

**GET** `/reviews/my-reviews?page=1&limit=20`

**Headers:** `Authorization: Bearer TOKEN`

---

### Update Review

**PUT** `/reviews/:reviewId`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "rating": 4,
  "comment": "Updated review"
}
```

---

### Delete Review

**DELETE** `/reviews/:reviewId`

**Headers:** `Authorization: Bearer TOKEN`

---

### Mark Review as Helpful

**POST** `/reviews/:reviewId/helpful`

**Headers:** `Authorization: Bearer TOKEN`

---

### Add Seller Response

**POST** `/reviews/:reviewId/seller-response`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "response": "Thank you for your feedback!"
}
```

---

## ❤️ Favorites

All favorite routes require authentication.

### Get User Favorites

**GET** `/favorites`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "favorites": [
    {
      "productId": 5,
      "product": {
        "name": "iPhone 15 Pro",
        "price": "450000.00",
        "images": ["https://..."]
      },
      "createdAt": "2025-01-18T10:00:00Z"
    }
  ]
}
```

---

### Add to Favorites

**POST** `/favorites/add`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "productId": 5
}
```

---

### Remove from Favorites

**DELETE** `/favorites/remove/:productId`

**Headers:** `Authorization: Bearer TOKEN`

---

### Check if Product is Favorited

**GET** `/favorites/check/:productId`

**Headers:** `Authorization: Bearer TOKEN`

**Response:**
```json
{
  "success": true,
  "isFavorited": true
}
```

---

### Batch Check Favorites

**POST** `/favorites/batch-check`

**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "productIds": [1, 2, 3, 4, 5]
}
```

**Response:**
```json
{
  "success": true,
  "favorites": {
    "1": true,
    "2": false,
    "3": true,
    "4": false,
    "5": true
  }
}
```

---

## 📊 Analytics

### Get Seller Analytics

**GET** `/analytics/seller?period=30days`

**Headers:** `Authorization: Bearer TOKEN`

**Query Parameters:**
- `period` - `7days`, `30days`, `90days`, `1year`

**Response:**
```json
{
  "success": true,
  "analytics": {
    "revenue": {
      "total": "2500000.00",
      "thisMonth": "500000.00",
      "lastMonth": "450000.00",
      "growth": "+11.1%"
    },
    "orders": {
      "total": 150,
      "thisMonth": 30,
      "pending": 5
    },
    "products": {
      "total": 50,
      "inStock": 45,
      "outOfStock": 5
    },
    "topProducts": [
      {
        "productId": 5,
        "productName": "iPhone 15 Pro",
        "totalSales": 25,
        "revenue": "11250000.00"
      }
    ],
    "revenueByDay": [...]
  }
}
```

---

## 📤 Upload

All upload routes require authentication.

### Upload Single Image

**POST** `/upload/image`

**Headers:**
- `Authorization: Bearer TOKEN`
- `Content-Type: multipart/form-data`

**Body (form-data):**
- `image` - Image file (max 10MB)

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/..."
}
```

---

### Upload Multiple Images

**POST** `/upload/images`

**Headers:**
- `Authorization: Bearer TOKEN`
- `Content-Type: multipart/form-data`

**Body (form-data):**
- `images` - Array of image files (max 5 images, 10MB each)

**Response:**
```json
{
  "success": true,
  "imageUrls": [
    "https://res.cloudinary.com/...",
    "https://res.cloudinary.com/..."
  ]
}
```

---

## 👨‍💼 Admin

All admin routes require authentication AND admin role.

### Get Admin Dashboard

**GET** `/admin/dashboard`

**Headers:** `Authorization: Bearer TOKEN` (admin only)

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
      "total_revenue": "2450000.00",
      "total_commission": "122500.00"
    },
    "users": {
      "total_users": 543,
      "new_users_this_week": 34
    },
    "disputes": {
      "pending_disputes": 5
    },
    "recentOrders": [...]
  }
}
```

---

### Get All Sellers (Admin)

**GET** `/admin/sellers?page=1&limit=20&status=all&search=`

**Headers:** `Authorization: Bearer TOKEN` (admin only)

**Query Parameters:**
- `page`, `limit` - Pagination
- `status` - `all`, `pending`, `approved`, `suspended`
- `search` - Search by shop name or email

**Response:**
```json
{
  "success": true,
  "data": {
    "sellers": [
      {
        "id": 1,
        "shopName": "John's Electronics",
        "shopSlug": "johns-electronics",
        "verificationStatus": "approved",
        "email": "john@example.com",
        "totalOrders": 145,
        "totalRevenue": "450000.00",
        "averageRating": 4.5
      }
    ],
    "pagination": {...}
  }
}
```

---

### Approve Seller

**PUT** `/admin/sellers/:sellerId/approve`

**Headers:** `Authorization: Bearer TOKEN` (admin only)

**Body:**
```json
{
  "notes": "Verified documents. Approved for selling."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller approved successfully"
}
```

---

### Suspend Seller

**PUT** `/admin/sellers/:sellerId/suspend`

**Headers:** `Authorization: Bearer TOKEN` (admin only)

**Body:**
```json
{
  "reason": "Multiple customer complaints about fake products"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Seller suspended successfully"
}
```

---

### Get All Orders (Admin)

**GET** `/admin/orders?page=1&limit=20&status=all&search=`

**Headers:** `Authorization: Bearer TOKEN` (admin only)

**Query Parameters:**
- `page`, `limit` - Pagination
- `status` - Filter by order status
- `search` - Search by order number or buyer email

---

### Get Revenue Analytics (Admin)

**GET** `/admin/analytics/revenue?period=30days`

**Headers:** `Authorization: Bearer TOKEN` (admin only)

**Query Parameters:**
- `period` - `7days`, `30days`, `90days`, `1year`

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
        "shopName": "John's Electronics",
        "totalOrders": 145,
        "totalRevenue": "450000.00",
        "totalCommission": "22500.00"
      }
    ],
    "categoryPerformance": [
      {
        "category": "Electronics & Gadgets",
        "orderCount": 234,
        "revenue": "1250000.00"
      }
    ]
  }
}
```

---

## 🔒 Security & Rate Limiting

### Rate Limits:

- **General API**: 100 requests per 15 minutes per IP
- **Auth endpoints** (`/auth/login`, `/auth/signup`): 5 requests per 15 minutes per IP
- **Password reset**: 3 requests per hour per IP

### Security Headers:

The API uses Helmet.js for security headers including:
- XSS Protection
- Content Security Policy
- CORS enabled for frontend origin

### Password Requirements:

- Minimum 8 characters
- Bcrypt hashing with 12 salt rounds

---

## 📝 Common Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 📌 Notes

- All timestamps are in ISO 8601 format
- All prices are in Nigerian Naira (NGN), formatted as strings with 2 decimal places
- Image uploads go to Cloudinary
- Payment processing uses Paystack
- Database is PostgreSQL (Supabase)

---

**Last Updated:** 2025-01-19
