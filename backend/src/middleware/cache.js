const NodeCache = require('node-cache');

// Create cache instance
// stdTTL: default time-to-live in seconds (5 minutes = 300s)
// checkperiod: how often to check for expired keys (1 minute = 60s)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (default: 5 minutes)
 */
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query params
    const key = req.originalUrl || req.url;

    // Try to get cached response
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      // Cache hit - return cached data
      console.log(`✅ Cache HIT: ${key}`);
      return res.json(cachedResponse);
    }

    // Cache miss - continue to route handler
    console.log(`❌ Cache MISS: ${key}`);

    // Store original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to cache the response
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode === 200 && body.success) {
        cache.set(key, body, duration);
        console.log(`💾 Cached: ${key} (${duration}s TTL)`);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache for specific pattern or all
 * @param {string} pattern - Pattern to match keys (optional)
 */
const clearCache = (pattern = null) => {
  if (pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));
    cache.del(matchingKeys);
    console.log(`🗑️ Cleared ${matchingKeys.length} cache entries matching: ${pattern}`);
    return matchingKeys.length;
  } else {
    cache.flushAll();
    console.log('🗑️ Cleared all cache');
    return true;
  }
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize,
  };
};

module.exports = {
  cacheMiddleware,
  clearCache,
  getCacheStats,
  cache,
};
