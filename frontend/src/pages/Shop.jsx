import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { productService, sellerService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productCache, shopCache } from '../utils/cache';
import ShopSEO from '../components/SEO/ShopSEO';
import ChatWidget from '../components/common/ChatWidget';
import { motion as Motion, useScroll, useTransform } from 'framer-motion';

const CATEGORIES = [
  'All',
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Books & Stationery',
  'Food & Snacks',
  'Beauty & Personal Care',
  'Sports & Fitness',
  'Home & Living',
  'Art & Crafts',
];

// --- Reusable Scroll Reveal Component ---
const FadeInScroll = ({ children, className }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 95%', 'start 65%']
  });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <Motion.div ref={ref} style={{ opacity, y, willChange: 'transform, opacity' }} className={className}>
      {children}
    </Motion.div>
  );
};

export default function Shop() {
  const { shopSlug } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentShopItemCount } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  useEffect(() => {
    fetchShopData();
  }, [shopSlug, selectedCategory, searchQuery, minPrice, maxPrice]);

  const fetchShopData = async (forceRefresh = false) => {
    setError('');

    try {
      const filters = {};
      if (selectedCategory && selectedCategory !== 'All') filters.category = selectedCategory;
      if (searchQuery) filters.search = searchQuery;
      if (minPrice) filters.minPrice = minPrice;
      if (maxPrice) filters.maxPrice = maxPrice;

      const shopCacheKey = `shop_${shopSlug}`;
      const productsCacheKey = `products_${shopSlug}_${JSON.stringify(filters)}`;

      if (!forceRefresh) {
        const cachedShop = shopCache.get(shopCacheKey);
        const cachedProducts = productCache.get(productsCacheKey);

        if (cachedShop && cachedProducts) {
          setShop(cachedShop);
          setProducts(cachedProducts);
          setLoading(false);

          const params = {};
          if (selectedCategory !== 'All') params.category = selectedCategory;
          if (searchQuery) params.search = searchQuery;
          if (minPrice) params.minPrice = minPrice;
          if (maxPrice) params.maxPrice = maxPrice;
          setSearchParams(params);

          fetchShopDataFromServer(shopCacheKey, productsCacheKey, filters, true);
          return;
        }
      }

      setLoading(true);
      await fetchShopDataFromServer(shopCacheKey, productsCacheKey, filters, false);
    } catch (err) {
      console.error('Error fetching shop data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load shop');
      setLoading(false);
    }
  };

  const fetchShopDataFromServer = async (shopCacheKey, productsCacheKey, filters, isBackgroundRefresh) => {
    try {
      const shopResponse = await sellerService.getSellerBySlug(shopSlug);
      const shopData = shopResponse.data.seller;

      shopCache.set(shopCacheKey, shopData, 30 * 60 * 1000);
      if (!isBackgroundRefresh) {
        setShop(shopData);
      }

      const productsResponse = await productService.getProductsByShopSlug(shopSlug, filters);
      const productsData = productsResponse.data.products;

      productCache.set(productsCacheKey, productsData, 10 * 60 * 1000);
      if (!isBackgroundRefresh) {
        setProducts(productsData);

        const params = {};
        if (selectedCategory !== 'All') params.category = selectedCategory;
        if (searchQuery) params.search = searchQuery;
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        setSearchParams(params);

        setLoading(false);
      }
    } catch (err) {
      if (!isBackgroundRefresh) {
        console.error('Error fetching shop data from server:', err);
        throw err;
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchShopData();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const copyShopLink = () => {
    const shopUrl = `${window.location.origin}/shop/${shopSlug}`;
    navigator.clipboard.writeText(shopUrl);
    alert('Shop link copied to clipboard!');
  };

  if (loading && !shop) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-cinematic">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cinematic-dark mx-auto"></div>
          <p className="mt-4 text-zinc-500 font-bold tracking-widest uppercase text-xs">Loading shop...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-cinematic">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-red-500 text-6xl font-black mb-4">:(</div>
          <div className="text-2xl font-black text-zinc-900 mb-2">Shop not found</div>
          <p className="text-zinc-500 mb-8">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-zinc-900 text-white font-bold tracking-widest uppercase text-xs hover:bg-cinematic-dark transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ShopSEO shop={shop} />
      <div className="min-h-screen bg-white text-zinc-900 font-cinematic selection:bg-cinematic-dark/20">
        
        {/* Navigation - Transparent over hero */}
        <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-6 lg:px-12 flex items-center justify-between pointer-events-none">
          <div className="flex items-center pointer-events-auto">
            <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20 text-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-4 pointer-events-auto">
            {user ? (
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-2 py-2 border border-white/20 rounded-full">
                <span className="text-white/80 text-xs font-bold tracking-widest uppercase pl-4 pr-2 hidden md:block">
                  {user.firstName}
                </span>
                <button
                  onClick={() => navigate('/orders')}
                  className="px-4 py-2 text-white hover:bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Orders
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-2 py-2 border border-white/20 rounded-full">
                <button
                  onClick={() => navigate(`/login?shopSlug=${shopSlug}`)}
                  className="px-6 py-2 text-white hover:bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate(`/signup?shopSlug=${shopSlug}`)}
                  className="px-6 py-2 bg-white text-zinc-900 hover:bg-cinematic-light rounded-full text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            <button
              onClick={() => navigate('/cart')}
              className="relative w-12 h-12 flex items-center justify-center bg-white text-zinc-900 hover:bg-cinematic-light rounded-full transition-colors shadow-lg"
              title="Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {currentShopItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-cinematic-dark text-white text-[10px] font-black rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
                  {currentShopItemCount > 99 ? '99+' : currentShopItemCount}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* HERO SECTION - Full Bleed Cinematic */}
        <header className="relative w-full h-[40vh] lg:h-[50vh] bg-black overflow-hidden flex items-end">
           {shop.shop_cover_url ? (
             <img 
               src={shop.shop_cover_url} 
               alt={shop.shop_name} 
               className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
               style={{ transform: 'translate3d(0,0,0)', willChange: 'transform' }}
             />
           ) : (
             <div className="absolute inset-0 bg-gradient-to-tr from-cinematic-dark to-zinc-900 opacity-80" />
           )}
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
           
           <div className="relative z-10 w-full px-6 lg:px-12 pb-8 lg:pb-16 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
             <div className="max-w-4xl">
                <Motion.h1 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-6xl lg:text-8xl xl:text-[120px] font-black text-white tracking-tighter leading-[0.85] mb-6"
                >
                  {shop.shop_name}
                </Motion.h1>
                {shop.shop_description && (
                  <Motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-lg lg:text-2xl text-zinc-300 font-medium max-w-2xl leading-relaxed"
                  >
                    {shop.shop_description}
                  </Motion.p>
                )}
             </div>

             {/* Meta Stats & Share */}
             <Motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ duration: 1, delay: 0.4 }}
               className="flex flex-row md:flex-col items-center md:items-end gap-6 shrink-0"
             >
                <div className="flex gap-6 text-white/80">
                  <div className="text-center md:text-right">
                    <div className="text-2xl font-black text-white">{shop.rating && parseFloat(shop.rating) > 0 ? parseFloat(shop.rating).toFixed(1) : 'New'}</div>
                    <div className="text-[10px] uppercase tracking-widest">Rating</div>
                  </div>
                  <div className="text-center md:text-right">
                    <div className="text-2xl font-black text-white">{shop.total_orders || 0}</div>
                    <div className="text-[10px] uppercase tracking-widest">Orders</div>
                  </div>
                </div>
                <button
                  onClick={copyShopLink}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full font-bold text-xs uppercase tracking-widest transition-colors flex items-center gap-2 border border-white/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
             </Motion.div>
           </div>
        </header>

        {/* SHOP CONTENT */}
        <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-24">
          
          {/* Filters & Search - Editorial Minimalist */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16 pb-8 border-b-2 border-zinc-900">
            {/* Category Tabs */}
            <div className="flex gap-8 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar flex-1">
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex items-center gap-2 pb-2 transition-colors whitespace-nowrap text-sm font-bold tracking-widest uppercase ${
                      isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearch} className="relative w-full lg:w-72 shrink-0">
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-b-2 border-zinc-200 py-2 pl-8 pr-4 text-sm font-bold text-zinc-900 focus:outline-none focus:border-cinematic-dark transition-all placeholder:text-zinc-400"
              />
              <svg className="absolute left-0 top-2.5 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
          </div>

          {/* Products Grid */}
          <div className="min-h-[50vh]">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
                </div>
              ) : products.length === 0 ? (
                <FadeInScroll className="text-center py-24">
                  <div className="text-8xl font-black text-zinc-100 mb-6">EMPTY</div>
                  <h3 className="text-2xl font-black text-zinc-900 mb-2">No pieces found.</h3>
                  <p className="text-zinc-500 font-medium">Try adjusting your filters or search terms.</p>
                  {(searchQuery || selectedCategory !== 'All') && (
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearchQuery('');
                      }}
                      className="mt-8 px-8 py-3 bg-zinc-900 text-white text-xs font-bold tracking-widest uppercase hover:bg-cinematic-dark transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </FadeInScroll>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 lg:gap-x-12 lg:gap-y-24">
                  {products.map((product) => (
                    <FadeInScroll
                      key={product.id}
                      className="group cursor-pointer flex flex-col gap-6"
                    >
                      <div onClick={() => navigate(`/shop/${shopSlug}/product/${product.slug || product.id}`)}>
                        {/* Product Image */}
                        <div className="aspect-[4/5] bg-zinc-100 overflow-hidden relative border border-zinc-200 mb-6">
                          {product.image_urls && product.image_urls.length > 0 ? (
                            <img
                              src={product.image_urls[0]}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                              style={{ willChange: 'transform' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-100">
                              <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">NO IMAGE</span>
                            </div>
                          )}
                          
                          {/* Stock Indicator */}
                          {product.quantity_available === 0 && (
                            <div className="absolute top-4 left-4 bg-zinc-900 text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">
                              Sold Out
                            </div>
                          )}
                        </div>

                        {/* Content Details */}
                        <div className="flex flex-col">
                          {product.category && (
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
                              {product.category}
                            </p>
                          )}
                          <h3 className="font-bold text-xl text-zinc-900 tracking-tight leading-snug group-hover:text-cinematic-dark transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="flex justify-between items-end mt-4 border-t-2 border-zinc-900 pt-4">
                            <p className="text-2xl font-black text-zinc-900">{formatPrice(product.price)}</p>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                              {product.quantity_available > 0 ? `${product.quantity_available} Left` : '0 Left'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </FadeInScroll>
                  ))}
                </div>
              )}
          </div>
        </main>
      </div>
      <ChatWidget shopSlug={shopSlug} />
    </>
  );
}
