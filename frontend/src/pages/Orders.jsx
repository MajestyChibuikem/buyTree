import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShopContext } from '../context/ShopContext';
import { orderService } from '../services/api';

export default function Orders() {
  const navigate = useNavigate();
  const { currentShop } = useShopContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    fetchGuestOrders();
  }, [currentShop]);

  const fetchGuestOrders = async () => {
    try {
      setLoading(true);
      const savedTokens = JSON.parse(localStorage.getItem('buytree_guest_orders') || '[]');
      if (savedTokens.length === 0) {
        setOrders([]);
        return;
      }

      // Fetch details in parallel using the public tracking token endpoint
      const promises = savedTokens.map(async (token) => {
        try {
          const res = await orderService.getOrderByTrackingToken(token);
          return res.data?.order || null;
        } catch (e) {
          console.error(`Failed to load order for token ${token}:`, e);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validOrders = results.filter(Boolean);
      
      // Filter by current shop if viewing inside a specific shop catalog
      if (currentShop) {
        setOrders(validOrders.filter(o => o.shop_slug === currentShop.shop_slug));
      } else {
        setOrders(validOrders);
      }
    } catch (err) {
      console.error('Failed to load guest orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e) => {
    e.preventDefault();
    setLookupError('');
    const token = trackingIdInput.trim();
    if (!token) {
      setLookupError('Please enter a tracking ID');
      return;
    }
    if (!token.startsWith('BT-')) {
      setLookupError('Invalid tracking ID. Ensure it starts with "BT-"');
      return;
    }
    navigate(`/orders/track/${token}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'border-zinc-300 text-zinc-500 bg-zinc-50',
      processing: 'border-zinc-900 text-zinc-900 bg-zinc-100',
      shipped: 'border-zinc-955 text-zinc-955 bg-zinc-50',
      delivered: 'bg-zinc-900 text-white border-zinc-900',
      cancelled: 'border-red-600 text-red-600 bg-red-50',
    };
    return colors[status] || 'border-zinc-300 text-zinc-500 bg-zinc-50';
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-cinematic text-zinc-900 pb-24">
      {/* Navbar */}
      <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  if (currentShop) {
                    navigate(`/shop/${currentShop.shop_slug}`);
                  } else {
                    navigate(-1);
                  }
                }}
                className="hover:text-zinc-600 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="w-px h-6 bg-zinc-200"></div>
              <div className="text-sm font-black uppercase tracking-wider text-zinc-900">
                Order Tracking Portal
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 mt-12">
        {/* Lookup Box */}
        <div className="bg-white border border-zinc-200 p-8 lg:p-12 mb-12">
          <h2 className="text-3xl font-black tracking-tight text-zinc-900 uppercase mb-2">Track Your Purchase</h2>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed max-w-lg">
            Enter the tracking ID from your purchase confirmation receipt to view delivery updates, download invoices, or submit reviews.
          </p>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="trackingId" className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                Tracking ID
              </label>
              <input
                type="text"
                id="trackingId"
                value={trackingIdInput}
                onChange={(e) => {
                  setTrackingIdInput(e.target.value);
                  setLookupError('');
                }}
                placeholder="BT-xxxxxxxx-xxxxxxxx"
                className="w-full bg-zinc-50 border-b-2 border-zinc-200 hover:border-zinc-900 focus:border-zinc-900 focus:outline-none py-3 px-4 transition-colors font-mono font-bold text-sm tracking-widest"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors font-black uppercase tracking-widest text-xs"
            >
              Track Order
            </button>
          </form>

          {lookupError && (
            <div className="mt-4 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-4 py-2 uppercase tracking-wider">
              {lookupError}
            </div>
          )}
        </div>

        {/* Recent Purchases List */}
        <div>
          <h3 className="text-lg font-black tracking-tight text-zinc-900 uppercase mb-6">Recent Purchases on this Browser</h3>
          
          {loading ? (
            <div className="bg-white border border-zinc-200 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-4"></div>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-zinc-200 p-12 text-center">
              <p className="text-zinc-400 font-medium text-sm">No recently viewed orders. Enter a tracking ID above to begin.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-zinc-200 hover:border-zinc-900 p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 transition-all"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Order from {order.shop_name}</p>
                    <p className="font-mono font-bold text-zinc-900">{order.order_number}</p>
                    <p className="text-xs text-zinc-500">{formatDate(order.created_at)} • {formatPrice(order.total_amount)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 border text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <button
                      onClick={() => navigate(`/orders/track/${order.tracking_token}`)}
                      className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-[9px] transition-colors"
                    >
                      View Progress
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
