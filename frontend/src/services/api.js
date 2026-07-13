import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- GLOBAL IN-MEMORY CACHE FOR GET REQUESTS ---
// This solves the "slow loading when switching pages" by caching GET responses
// and instantly clearing the cache on any mutation (POST, PUT, DELETE).
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cachedGet = async (url, config = {}) => {
  // Use the full URL string as the cache key
  const key = url;
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < CACHE_TTL) {
      // Simulate an axios response wrapper
      return data;
    }
  }
  const response = await api.get(url, config);
  cache.set(key, { data: response, timestamp: Date.now() });
  return response;
};

// Any mutation clears the global cache so the next GET fetches fresh data
const mutate = async (method, url, data, config = {}) => {
  cache.clear();
  return await api[method](url, data, config);
};


// Auth endpoints
export const authService = {
  signup: async (userData) => {
    const response = await mutate('post', '/auth/signup', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await mutate('post', '/auth/login', credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await cachedGet('/auth/me');
    return response.data;
  },
};

// Seller endpoints
export const sellerService = {
  registerSeller: async (sellerData) => {
    const response = await mutate('post', '/sellers/register', sellerData);
    return response.data;
  },

  getSellerProfile: async () => {
    const response = await cachedGet('/sellers/profile/me');
    return response.data;
  },

  getBanks: async () => {
    const response = await cachedGet('/sellers/banks');
    return response.data;
  },

  getSellerBySlug: async (shopSlug) => {
    const response = await cachedGet(`/sellers/${shopSlug}`);
    return response.data;
  },

  getAllShops: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await cachedGet(`/sellers/shops/all?${queryParams}`);
    return response.data;
  },
};

// Product endpoints
export const productService = {
  createProduct: async (productData) => {
    const response = await mutate('post', '/products', productData);
    return response.data;
  },

  getProducts: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await cachedGet(`/products?${queryParams}`);
    return response.data;
  },

  getProductById: async (id) => {
    const response = await cachedGet(`/products/${id}`);
    return response.data;
  },

  trackProductView: async (id) => {
    const response = await mutate('post', `/products/${id}/view`);
    return response.data;
  },

  getMyProducts: async () => {
    const response = await cachedGet('/products/my/products');
    return response.data;
  },

  getProductsByShopSlug: async (shopSlug, filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await cachedGet(`/products/shop/${shopSlug}?${queryParams}`);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await mutate('put', `/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await mutate('delete', `/products/${id}`);
    return response.data;
  },

  searchProducts: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await cachedGet(`/products/search?${queryParams}`);
    return response.data;
  },
};

// Upload endpoints
export const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await mutate('post', '/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadMultipleImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const response = await mutate('post', '/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Cart endpoints
export const cartService = {
  getCart: async () => {
    const response = await cachedGet('/cart');
    return response.data;
  },

  addToCart: async (productId, quantity) => {
    const response = await mutate('post', '/cart/add', { productId, quantity });
    return response.data;
  },

  updateCartItem: async (productId, quantity) => {
    const response = await mutate('put', '/cart/update', { productId, quantity });
    return response.data;
  },

  removeFromCart: async (productId) => {
    const response = await mutate('delete', `/cart/remove/${productId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await mutate('delete', '/cart/clear');
    return response.data;
  },
};

// Order endpoints
export const orderService = {
  // Buyer endpoints
  createOrder: async (orderData) => {
    const response = await mutate('post', '/orders/create', orderData);
    return response.data;
  },

  verifyPayment: async (reference) => {
    const response = await cachedGet(`/orders/verify/${reference}`);
    return response.data;
  },

  getUserOrders: async () => {
    const response = await cachedGet('/orders/user');
    return response.data;
  },

  getUserOrdersByShop: async (shopSlug) => {
    const response = await cachedGet(`/orders/user/shop/${shopSlug}`);
    return response.data;
  },

  confirmDelivery: async (orderId, feedbackData = {}) => {
    const response = await mutate('post', `/orders/${orderId}/confirm-delivery`, feedbackData);
    return response.data;
  },

  // Shared endpoints (buyer and seller)
  getOrderDetails: async (orderId) => {
    const response = await cachedGet(`/orders/${orderId}`);
    return response.data;
  },

  getOrderHistory: async (orderId) => {
    const response = await cachedGet(`/orders/${orderId}/history`);
    return response.data;
  },

  // Seller endpoints - Dashboard & Management
  getSellerDashboardSummary: async () => {
    const response = await cachedGet('/orders/seller/dashboard-summary');
    return response.data;
  },

  getSellerOrders: async () => {
    const response = await cachedGet('/orders/seller/orders');
    return response.data;
  },

  getSellerOrdersByStatus: async (status, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await cachedGet(`/orders/seller/orders/${status}?${queryParams}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, statusData) => {
    const response = await mutate('put', `/orders/seller/${orderId}/status`, statusData);
    return response.data;
  },

  addSellerNote: async (orderId, note) => {
    const response = await mutate('post', `/orders/seller/${orderId}/notes`, { note });
    return response.data;
  },

  getSellerNotes: async (orderId) => {
    const response = await cachedGet(`/orders/seller/${orderId}/notes`);
    return response.data;
  },
};

// Analytics endpoints
export const analyticsService = {
  getSellerAnalytics: async () => {
    const response = await cachedGet('/analytics/seller');
    return response.data;
  },

  getProductViewAnalytics: async (period = '30') => {
    const response = await cachedGet(`/analytics/seller/views?period=${period}`);
    return response.data;
  },
};

// Review endpoints
export const reviewService = {
  createReview: async (reviewData) => {
    const response = await mutate('post', '/reviews', reviewData);
    return response.data;
  },

  getProductReviews: async (productId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await cachedGet(`/reviews/product/${productId}?${queryParams}`);
    return response.data;
  },

  getMyReviews: async () => {
    const response = await cachedGet('/reviews/my-reviews');
    return response.data;
  },

  getReviewableProducts: async () => {
    const response = await cachedGet('/reviews/reviewable-products');
    return response.data;
  },

  updateReview: async (reviewId, reviewData) => {
    const response = await mutate('put', `/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await mutate('delete', `/reviews/${reviewId}`);
    return response.data;
  },

  markReviewHelpful: async (reviewId) => {
    const response = await mutate('post', `/reviews/${reviewId}/helpful`);
    return response.data;
  },

  addSellerResponse: async (reviewId, responseText) => {
    const response = await mutate('post', `/reviews/${reviewId}/seller-response`, { response: responseText });
    return response.data;
  },
};

// Favorite endpoints
export const favoriteService = {
  getUserFavorites: async () => {
    const response = await cachedGet('/favorites');
    return response.data;
  },

  addFavorite: async (productId) => {
    const response = await mutate('post', '/favorites/add', { productId });
    return response.data;
  },

  removeFavorite: async (productId) => {
    const response = await mutate('delete', `/favorites/remove/${productId}`);
    return response.data;
  },

  checkFavorite: async (productId) => {
    const response = await cachedGet(`/favorites/check/${productId}`);
    return response.data;
  },

  batchCheckFavorites: async (productIds) => {
    const response = await mutate('post', '/favorites/batch-check', { productIds });
    return response.data;
  },
};

// AI endpoints
export const aiService = {
  chat: async (messages, shopSlug) => {
    const response = await mutate('post', '/ai/chat', { messages, shopSlug });
    return response.data;
  },

  generateDescription: async ({ name, price, category }) => {
    const response = await mutate('post', '/ai/generate-description', { name, price, category });
    return response.data;
  },

  suggestCategory: async ({ name, description }) => {
    const response = await mutate('post', '/ai/suggest-category', { name, description });
    return response.data;
  },
};

export default api;
