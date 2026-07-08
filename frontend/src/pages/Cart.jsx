import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useShopContext } from '../context/ShopContext';
import { useEffect } from 'react';
import { motion as Motion } from 'framer-motion';

export default function Cart() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currentShop, setCurrentShop } = useShopContext();
  const { cartItems, loading, updateQuantity, removeFromCart, getCartTotal } = useCart();

  useEffect(() => {
    if (!currentShop && cartItems.length > 0) {
      const firstItem = cartItems[0];
      if (firstItem.shop_slug) {
        const shopData = {
          id: firstItem.seller_id,
          shop_slug: firstItem.shop_slug,
          shop_name: firstItem.shop_name,
        };
        setCurrentShop(shopData);
      }
    }
  }, [cartItems, currentShop, setCurrentShop]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    await updateQuantity(productId, newQuantity);
  };

  const handleRemove = async (productId) => {
    if (confirm('Remove this item from cart?')) {
      await removeFromCart(productId);
    }
  };

  const handleCheckoutAll = () => {
    const total = getCartTotal();
    if (total < 4000) {
      alert('Minimum total order value is ₦4,000. Please add more items.');
      return;
    }
    navigate('/checkout');
  };

  const handleCheckoutStore = (sellerId) => {
    const sellerGroup = itemsBySeller[sellerId];
    const storeTotal = sellerGroup.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (storeTotal < 4000) {
      alert(`Minimum order value for ${sellerGroup.shopName} is ₦4,000. Please add more items from this store.`);
      return;
    }

    navigate('/checkout', { state: { sellerId } });
  };

  const getStoreTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const itemsBySeller = cartItems.reduce((acc, item) => {
    const sellerId = item.seller_id;
    if (!acc[sellerId]) {
      acc[sellerId] = {
        shopName: item.shop_name,
        shopSlug: item.shop_slug,
        items: [],
      };
    }
    acc[sellerId].items.push(item);
    return acc;
  }, {});

  const sellerGroups = Object.values(itemsBySeller);
  const total = getCartTotal();
  const minOrderValue = 4000;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-cinematic">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-cinematic text-zinc-900 pb-24 sm:pb-8">
      {/* Navbar */}
      <nav className="bg-white border-b border-zinc-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(-1)}
                className="hover:text-cinematic-dark transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="hidden sm:block w-px h-6 bg-zinc-200"></div>
              <div className="hidden sm:block text-xl font-black tracking-tighter text-zinc-900">
                CART
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {user && (
                <>
                  <span className="text-zinc-500 hidden sm:inline text-xs font-bold tracking-widest uppercase">
                    {user.firstName}
                  </span>
                  {user.role === 'seller' && (
                    <button
                      onClick={() => navigate('/seller/dashboard')}
                      className="text-cinematic-dark hover:text-zinc-900 text-xs font-bold tracking-widest uppercase hidden sm:block transition-colors"
                    >
                      Dashboard
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-24">
        {cartItems.length === 0 ? (
          <Motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 max-w-md mx-auto"
          >
            <div className="text-8xl font-black text-zinc-100 mb-6">EMPTY</div>
            <h3 className="text-2xl font-black text-zinc-900 mb-2">Your cart is empty.</h3>
            <p className="text-zinc-500 font-medium mb-12">Looks like you haven't added any pieces to your cart yet.</p>
            <button
              onClick={() => navigate(-1)}
              className="px-8 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-cinematic-dark transition-colors w-full"
            >
              Continue Shopping
            </button>
          </Motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
            
            {/* Cart Items List */}
            <div className="lg:col-span-7 xl:col-span-8">
              <h1 className="text-4xl font-black tracking-tighter text-zinc-900 mb-12 uppercase">Your Selection</h1>

              <div className="space-y-16">
                {sellerGroups.map((sellerGroup, idx) => {
                  const storeTotal = getStoreTotal(sellerGroup.items);
                  const storeMeetsMinimum = storeTotal >= minOrderValue;
                  const sellerId = sellerGroup.items[0]?.seller_id;

                  return (
                    <div key={idx} className="border-t-2 border-zinc-900 pt-8">
                      {/* Shop Header */}
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200">
                        <button
                          onClick={() => navigate(`/shop/${sellerGroup.shopSlug}`)}
                          className="flex items-center gap-4 hover:text-cinematic-dark transition-colors group"
                        >
                          <span className="text-sm font-bold uppercase tracking-widest text-zinc-900 group-hover:text-cinematic-dark">{sellerGroup.shopName}</span>
                          <span className="text-zinc-400 group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                        <div className="text-right">
                          <p className="text-lg font-black text-zinc-900">{formatPrice(storeTotal)}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{sellerGroup.items.length} item{sellerGroup.items.length > 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-8">
                        {sellerGroup.items.map((item) => (
                          <div key={item.id} className="flex gap-6 sm:gap-8 group">
                            {/* Product Image */}
                            <button
                              onClick={() => navigate(`/shop/${item.shop_slug}/product/${item.slug}`)}
                              className="flex-shrink-0 w-24 h-32 sm:w-32 sm:h-40 bg-zinc-100 overflow-hidden"
                            >
                              {item.image_urls && item.image_urls.length > 0 ? (
                                <img
                                  src={item.image_urls[0]}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No Image</span>
                                </div>
                              )}
                            </button>

                            {/* Product Info */}
                            <div className="flex-1 flex flex-col justify-between py-1">
                              <div>
                                <button
                                  onClick={() => navigate(`/shop/${item.shop_slug}/product/${item.slug}`)}
                                  className="text-left block w-full mb-2"
                                >
                                  <h3 className="text-lg sm:text-xl font-bold text-zinc-900 hover:text-cinematic-dark transition-colors line-clamp-2 leading-snug">
                                    {item.name}
                                  </h3>
                                </button>
                                <p className="text-xl font-black text-zinc-900 mb-1">
                                  {formatPrice(item.price)}
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                  {item.quantity_available} Available
                                </p>
                              </div>

                              {/* Controls */}
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
                                <div className="flex items-center border border-zinc-200">
                                  <button
                                    onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 text-zinc-900 font-medium transition-colors"
                                    disabled={item.quantity <= 1}
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center text-sm font-bold border-x border-zinc-200">{item.quantity}</span>
                                  <button
                                    onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-zinc-50 text-zinc-900 font-medium transition-colors"
                                    disabled={item.quantity >= item.quantity_available}
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleRemove(item.product_id)}
                                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-600 transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Store Checkout Action */}
                      <div className="mt-8 pt-6 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {!storeMeetsMinimum ? (
                          <div className="text-xs font-bold uppercase tracking-widest text-red-600">
                            Minimum ₦4,000 Required
                          </div>
                        ) : (
                          <div className="text-xs font-bold uppercase tracking-widest text-cinematic-dark">
                            Ready to Checkout
                          </div>
                        )}

                        {!user ? (
                          <button
                            onClick={() => navigate('/login?redirect=/checkout')}
                            className="px-8 py-3 bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-cinematic-dark transition-colors"
                          >
                            Login to Checkout
                          </button>
                        ) : (
                          <button
                            onClick={() => handleCheckoutStore(sellerId)}
                            disabled={!storeMeetsMinimum}
                            className={`px-8 py-3 font-black uppercase tracking-widest text-[10px] transition-colors ${
                              storeMeetsMinimum
                                ? 'bg-zinc-900 text-white hover:bg-cinematic-dark'
                                : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            }`}
                          >
                            Checkout This Store
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sticky Order Summary Block */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-24 bg-zinc-50 p-8 xl:p-10 border border-zinc-100">
                <h2 className="text-xl font-black uppercase tracking-widest text-zinc-900 mb-8 border-b-2 border-zinc-900 pb-4">Summary</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-zinc-600">
                    <span>Items ({cartItems.length})</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  {total < minOrderValue && (
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-red-600">
                      <span>Minimum order</span>
                      <span>{formatPrice(minOrderValue)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-zinc-200 pt-6 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black uppercase tracking-widest text-zinc-900">Total</span>
                    <span className="text-4xl font-black text-zinc-900">{formatPrice(total)}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-2 text-right">
                    *5% platform fee included
                  </p>
                </div>

                {total < minOrderValue && (
                  <div className="bg-red-50 text-red-600 p-4 mb-8 border border-red-100 text-xs font-bold uppercase tracking-widest text-center">
                    Add {formatPrice(minOrderValue - total)} more to checkout
                  </div>
                )}

                {!user ? (
                  <button
                    onClick={() => navigate('/login?redirect=/checkout')}
                    className="w-full px-8 py-5 bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-cinematic-dark transition-colors mb-4"
                  >
                    Login to Checkout
                  </button>
                ) : (
                  <button
                    onClick={handleCheckoutAll}
                    disabled={total < minOrderValue}
                    className="w-full px-8 py-5 bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-cinematic-dark transition-colors mb-4 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed"
                  >
                    Checkout All ({sellerGroups.length} Stores)
                  </button>
                )}

                <p className="text-[10px] text-center font-bold uppercase tracking-widest text-zinc-400">
                  Or checkout stores individually
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Mobile Fixed Bottom Bar (Visible only on very small screens if total >= minOrder) */}
      {cartItems.length > 0 && total >= minOrderValue && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total</p>
              <p className="text-xl font-black text-zinc-900">{formatPrice(total)}</p>
            </div>
            {!user ? (
              <button
                onClick={() => navigate('/login?redirect=/checkout')}
                className="px-6 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px]"
              >
                LOGIN TO CHECKOUT
              </button>
            ) : (
              <button
                onClick={handleCheckoutAll}
                className="px-6 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px]"
              >
                CHECKOUT ALL
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
