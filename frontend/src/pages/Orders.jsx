import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useShopContext } from '../context/ShopContext';
import { orderService } from '../services/api';

export default function Orders() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentShop } = useShopContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [currentShop]);

  const fetchOrders = async () => {
    try {
      let response;
      if (currentShop) {
        response = await orderService.getUserOrdersByShop(currentShop.shop_slug);
      } else {
        response = await orderService.getUserOrders();
      }
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
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
      pending: 'border-zinc-300 text-zinc-500',
      processing: 'border-zinc-900 text-zinc-900',
      shipped: 'border-cinematic-dark text-cinematic-dark',
      delivered: 'bg-zinc-900 text-white border-zinc-900',
      cancelled: 'border-red-600 text-red-600',
    };
    return colors[status] || 'border-zinc-300 text-zinc-500';
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-cinematic">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-cinematic text-zinc-900 pb-12">
      {/* Navbar */}
      <nav className="bg-white border-b border-zinc-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  if (currentShop) {
                    navigate(`/shop/${currentShop.shop_slug}`);
                  } else {
                    navigate('/');
                  }
                }}
                className="hover:text-cinematic-dark transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="hidden sm:block w-px h-6 bg-zinc-200"></div>
              <div className="hidden sm:block text-xl font-black tracking-tighter text-zinc-900">
                MY ORDERS
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {user && (
                <span className="text-zinc-500 hidden sm:inline text-xs font-bold tracking-widest uppercase">
                  {user.firstName}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-12 lg:py-24">
        {orders.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-8xl font-black text-zinc-100 mb-6">ZERO</div>
            <h3 className="text-2xl font-black text-zinc-900 mb-2">
              {currentShop ? `No orders from ${currentShop.shop_name}` : 'No orders yet'}
            </h3>
            <p className="text-zinc-500 font-medium mb-12">
              {currentShop 
                ? 'Start exploring their collection to make your first purchase.' 
                : 'Start exploring shops to make your first purchase.'}
            </p>
            <button
              onClick={() => navigate(currentShop ? `/shop/${currentShop.shop_slug}` : '/')}
              className="px-8 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-cinematic-dark transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="mb-12">
              <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">Order History</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-2">
                {currentShop ? `Purchases from ${currentShop.shop_name}` : 'All Purchases'}
              </p>
            </div>

            {orders.map((order) => (
              <div
                key={order.id}
                className="border border-zinc-200 hover:border-zinc-900 transition-colors bg-white group"
              >
                {/* Order Header / Receipt Top */}
                <div className="bg-zinc-50 border-b border-zinc-200 p-6 lg:p-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Receipt No.</p>
                    <p className="font-mono font-bold text-lg text-zinc-900">{order.order_number}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-4 py-1.5 border text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-4 py-1.5 border text-[10px] font-black uppercase tracking-widest ${
                      order.payment_status === 'paid' ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'border-red-200 text-red-600 bg-red-50'
                    }`}>
                      {order.payment_status === 'paid' ? 'Paid' : 'Pending Payment'}
                    </span>
                  </div>
                </div>

                {/* Order Details / Receipt Body */}
                <div className="p-6 lg:p-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8 pb-8 border-b border-zinc-100">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Shop</p>
                      <button
                        onClick={() => navigate(`/shop/${order.shop_slug}`)}
                        className="font-bold text-zinc-900 hover:text-cinematic-dark transition-colors"
                      >
                        {order.shop_name}
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Date</p>
                      <p className="font-bold text-zinc-900">{formatDate(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Total</p>
                      <p className="font-bold text-zinc-900">{formatPrice(order.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Delivery By</p>
                      <p className="font-bold text-zinc-900">
                        {order.estimated_delivery_date ? formatDate(order.estimated_delivery_date) : 'TBD'}
                      </p>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="mb-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Destination</p>
                    <div className="text-sm font-medium text-zinc-600 space-y-1">
                      <p className="text-zinc-900 font-bold">{order.delivery_name}</p>
                      <p>{order.delivery_phone}</p>
                      <p className="max-w-md leading-relaxed">{order.delivery_address}</p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-zinc-900 text-zinc-900 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-900 hover:text-white transition-colors"
                  >
                    View Full Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
