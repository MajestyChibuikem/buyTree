import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useShopContext } from '../context/ShopContext';
import { orderService } from '../services/api';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { currentShop } = useShopContext();
  const { cartItems, getCartTotal, clearCart, syncPendingUpdates } = useCart();
  const [loading, setLoading] = useState(false);

  const loadSavedDeliveryDetails = () => {
    try {
      const saved = localStorage.getItem('buytree_delivery_details');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load delivery details:', error);
    }
    return {
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    };
  };

  const [deliveryDetails, setDeliveryDetails] = useState(loadSavedDeliveryDetails());
  const selectedSellerId = location.state?.sellerId;

  const checkoutItems = selectedSellerId
    ? cartItems.filter(item => item.seller_id === selectedSellerId)
    : cartItems;

  useEffect(() => {
    const syncCart = async () => {
      await syncPendingUpdates();
    };
    syncCart();
  }, [syncPendingUpdates]);

  useEffect(() => {
    if (!currentShop) {
      if (cartItems.length > 0 && cartItems[0].shop_slug) {
        navigate(`/shop/${cartItems[0].shop_slug}`);
        return;
      }
      navigate('/cart');
      return;
    }

    if (cartItems.length === 0 || checkoutItems.length === 0) {
      navigate('/cart');
      return;
    }

    const total = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (total < 4000) {
      alert('Minimum order value is ₦4,000');
      navigate('/cart');
    }
  }, [cartItems, checkoutItems, currentShop, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = {
      ...deliveryDetails,
      [name]: value,
    };
    setDeliveryDetails(updated);

    try {
      const toSave = {
        name: updated.name,
        email: updated.email || '',
        phone: updated.phone,
        address: updated.address,
        notes: '',
      };
      localStorage.setItem('buytree_delivery_details', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save delivery details:', error);
    }
  };

  const validateForm = () => {
    if (!deliveryDetails.name.trim()) {
      alert('Please enter your full name');
      return false;
    }
    if (!user) {
      if (!deliveryDetails.email || !deliveryDetails.email.trim()) {
        alert('Please enter your email address');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(deliveryDetails.email.trim())) {
        alert('Please enter a valid email address');
        return false;
      }
    }
    if (!deliveryDetails.phone.trim()) {
      alert('Please enter your phone number');
      return false;
    }
    if (deliveryDetails.phone.length < 11) {
      alert('Please enter a valid phone number');
      return false;
    }
    if (!deliveryDetails.address.trim()) {
      alert('Please enter your delivery address');
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const itemsBySeller = checkoutItems.reduce((acc, item) => {
        const sellerId = item.seller_id;
        if (!acc[sellerId]) {
          acc[sellerId] = [];
        }
        acc[sellerId].push({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.price,
        });
        return acc;
      }, {});

      const orders = Object.entries(itemsBySeller).map(([sellerId, items]) => ({
        sellerId: parseInt(sellerId),
        items,
      }));

      const response = await orderService.createOrder({ orders, deliveryDetails });

      if (response.success) {
        window.location.href = response.data.authorization_url;
      } else {
        alert(response.message || 'Failed to create order');
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.message || 'Failed to process checkout');
      setLoading(false);
    }
  };

  const itemsBySeller = checkoutItems.reduce((acc, item) => {
    const sellerId = item.seller_id;
    if (!acc[sellerId]) {
      acc[sellerId] = {
        shopName: item.shop_name,
        items: [],
      };
    }
    acc[sellerId].items.push(item);
    return acc;
  }, {});

  const sellerGroups = Object.values(itemsBySeller);
  const total = checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const platformFee = total * 0.05;

  return (
    <div className="min-h-screen bg-white font-cinematic text-zinc-900 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-zinc-100 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/cart')}
                className="hover:text-cinematic-dark transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Cart
              </button>
              <div className="hidden sm:block w-px h-6 bg-zinc-200"></div>
              <div className="hidden sm:block text-xl font-black tracking-tighter text-zinc-900">
                CHECKOUT
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-12 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Form */}
          <div className="lg:col-span-7 xl:col-span-8">
            <h1 className="text-4xl font-black tracking-tighter text-zinc-900 mb-2 uppercase">Delivery</h1>
            {selectedSellerId && (
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-12">
                Checking out from {sellerGroups[0]?.shopName}
              </p>
            )}
            {!selectedSellerId && <div className="mb-12" />}

            <form className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={deliveryDetails.name}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="block w-full bg-transparent border-0 border-b-2 border-zinc-200 py-3 text-lg font-bold text-zinc-900 focus:ring-0 focus:border-cinematic-dark peer transition-colors"
                    required
                  />
                  <label 
                    htmlFor="name" 
                    className="absolute left-0 top-3 text-sm font-bold uppercase tracking-widest text-zinc-400 transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-cinematic-dark peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-zinc-900"
                  >
                    Full Name *
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={deliveryDetails.phone}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="block w-full bg-transparent border-0 border-b-2 border-zinc-200 py-3 text-lg font-bold text-zinc-900 focus:ring-0 focus:border-cinematic-dark peer transition-colors"
                    required
                  />
                  <label 
                    htmlFor="phone" 
                    className="absolute left-0 top-3 text-sm font-bold uppercase tracking-widest text-zinc-400 transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-cinematic-dark peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-zinc-900"
                  >
                    Phone Number *
                  </label>
                </div>
              </div>

              {!user && (
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={deliveryDetails.email || ''}
                    onChange={handleInputChange}
                    placeholder=" "
                    className="block w-full bg-transparent border-0 border-b-2 border-zinc-200 py-3 text-lg font-bold text-zinc-900 focus:ring-0 focus:border-cinematic-dark peer transition-colors"
                    required
                  />
                  <label 
                    htmlFor="email" 
                    className="absolute left-0 top-3 text-sm font-bold uppercase tracking-widest text-zinc-400 transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-cinematic-dark peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-zinc-900"
                  >
                    Email Address (For Order Tracking) *
                  </label>
                </div>
              )}

              <div className="relative">
                <textarea
                  id="address"
                  name="address"
                  value={deliveryDetails.address}
                  onChange={handleInputChange}
                  placeholder=" "
                  rows="3"
                  className="block w-full bg-transparent border-0 border-b-2 border-zinc-200 py-3 text-lg font-bold text-zinc-900 focus:ring-0 focus:border-cinematic-dark peer resize-none transition-colors"
                  required
                />
                <label 
                  htmlFor="address" 
                  className="absolute left-0 top-3 text-sm font-bold uppercase tracking-widest text-zinc-400 transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-cinematic-dark peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-zinc-900"
                >
                  Delivery Address *
                </label>
              </div>

              <div className="relative">
                <textarea
                  id="notes"
                  name="notes"
                  value={deliveryDetails.notes}
                  onChange={handleInputChange}
                  placeholder=" "
                  rows="2"
                  className="block w-full bg-transparent border-0 border-b-2 border-zinc-200 py-3 text-lg font-bold text-zinc-900 focus:ring-0 focus:border-cinematic-dark peer resize-none transition-colors"
                />
                <label 
                  htmlFor="notes" 
                  className="absolute left-0 top-3 text-sm font-bold uppercase tracking-widest text-zinc-400 transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-cinematic-dark peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-zinc-900"
                >
                  Order Notes (Optional)
                </label>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-zinc-50 p-8 xl:p-10 border border-zinc-100 sticky top-12">
              <h2 className="text-xl font-black uppercase tracking-widest text-zinc-900 mb-8 border-b-2 border-zinc-900 pb-4">Order Summary</h2>

              <div className="space-y-6 mb-8">
                {sellerGroups.map((sellerGroup, idx) => (
                  <div key={idx} className="border-b border-zinc-200 pb-6 last:border-0 last:pb-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4">{sellerGroup.shopName}</p>
                    <div className="space-y-3">
                      {sellerGroup.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start text-sm">
                          <span className="font-medium text-zinc-600 mr-4 leading-snug">
                            {item.quantity} × {item.name}
                          </span>
                          <span className="font-bold text-zinc-900 shrink-0">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 mb-8 bg-white p-6 border border-zinc-100">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <span>Subtotal</span>
                  <span className="text-zinc-900">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <span>Platform Fee (5%)</span>
                  <span className="text-zinc-900">{formatPrice(platformFee)}</span>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black uppercase tracking-widest text-zinc-900">Total</span>
                  <span className="text-4xl font-black text-zinc-900">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Secure Payment Note */}
              <div className="bg-zinc-100 border border-zinc-200 p-4 mb-8 flex items-start gap-4">
                <svg className="w-5 h-5 text-zinc-900 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-900">Secure Payment</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Processed securely via Paystack</p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full px-8 py-5 bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-cinematic-dark transition-colors mb-4 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    PROCESSING...
                  </>
                ) : (
                  'PAY WITH PAYSTACK'
                )}
              </button>

              <p className="text-[10px] text-center font-bold uppercase tracking-widest text-zinc-400">
                By completing this purchase, you agree to our terms and conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
