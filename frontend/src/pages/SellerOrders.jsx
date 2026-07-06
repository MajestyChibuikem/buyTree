import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import CinematicDashboardLayout from '../layouts/CinematicDashboardLayout';
import { motion as Motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

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

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getSellerOrders();
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await orderService.updateOrderStatus(orderId, { status: newStatus });
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price).replace('NGN', '₦');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusStyle = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      processing: 'bg-blue-50 text-blue-700 border-blue-200',
      ready_for_pickup: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      in_transit: 'bg-purple-50 text-purple-700 border-purple-200',
      delivered: 'bg-cinematic-dark/10 text-cinematic-dark border-cinematic-dark/20',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-zinc-100 text-zinc-600 border-zinc-200';
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'processing',
      processing: 'ready_for_pickup',
      ready_for_pickup: 'in_transit',
      in_transit: 'delivered',
    };
    return statusFlow[currentStatus];
  };

  const getNextStatusLabel = (currentStatus) => {
    const labels = {
      pending: 'Start Processing',
      processing: 'Ready for Pickup',
      ready_for_pickup: 'In Transit',
      in_transit: 'Mark Delivered',
    };
    return labels[currentStatus];
  };

  const formatStatusLabel = (status) => {
    const labels = {
      all: 'All',
      pending: 'Pending',
      processing: 'Processing',
      ready_for_pickup: 'Ready for Pickup',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = !searchQuery || 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${order.first_name} ${order.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalEarnings = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, order) => sum + parseFloat(order.seller_amount || 0), 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const processingOrdersCount = orders.filter(o => o.status === 'processing').length;

  return (
    <CinematicDashboardLayout>
      <div className="max-w-7xl mx-auto pb-32 overflow-hidden px-2 md:px-0">
        
        {/* HUGE HERO */}
        <div className="pt-12 pb-24 md:pb-32 border-b border-zinc-200 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <Motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-sm mb-6"
            >
              Logistics & Fulfillment
            </Motion.p>
            <Motion.h1 
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1 }}
              className="text-[64px] sm:text-[96px] md:text-[140px] font-black tracking-tighter leading-[0.9] text-cinematic-dark break-words"
            >
              Orders
            </Motion.h1>
          </div>
          <Motion.button 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
             className="px-6 py-3 border-2 border-zinc-900 text-zinc-900 font-bold tracking-widest uppercase text-xs hover:bg-zinc-900 hover:text-white transition-colors"
          >
             Export CSV
          </Motion.button>
        </div>

        {/* SUMMARY STATS (Editorial 3-column split) */}
        <FadeInScroll className="py-24 border-b border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
             <div className="border-t-2 border-zinc-900 pt-8">
                 <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-4">Total Earnings</p>
                 <p className="text-5xl font-black text-zinc-900">{formatPrice(totalEarnings)}</p>
                 <p className="text-xs text-zinc-400 font-medium mt-4">Your 95% share</p>
             </div>
             <div className="border-t-2 border-zinc-900 pt-8">
                 <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-4">Pending Orders</p>
                 <p className="text-5xl font-black text-yellow-600">{pendingOrdersCount}</p>
                 <p className="text-xs text-zinc-400 font-medium mt-4">Action required</p>
             </div>
             <div className="border-t-2 border-zinc-900 pt-8">
                 <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-4">Processing</p>
                 <p className="text-5xl font-black text-blue-600">{processingOrdersCount}</p>
                 <p className="text-xs text-zinc-400 font-medium mt-4">Currently fulfilling</p>
             </div>
          </div>
        </FadeInScroll>

        {/* TABS & SEARCH (Editorial Minimalist) */}
        <FadeInScroll className="py-12 border-b border-zinc-200 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
           <div className="flex gap-8 overflow-x-auto pb-4 lg:pb-0 hide-scrollbar flex-1">
             {['all', 'pending', 'processing', 'ready_for_pickup', 'in_transit', 'delivered'].map((status) => {
               const count = status === 'all' ? orders.length : orders.filter(o => o.status === status).length;
               const isActive = filterStatus === status;
               return (
                 <button
                   key={status}
                   onClick={() => setFilterStatus(status)}
                   className={`flex items-center gap-2 pb-2 border-b-2 transition-colors whitespace-nowrap ${
                     isActive ? 'border-cinematic-dark text-cinematic-dark' : 'border-transparent text-zinc-400 hover:text-zinc-900'
                   }`}
                 >
                   <span className="font-bold tracking-[0.1em] uppercase text-xs">{formatStatusLabel(status)}</span>
                   <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive ? 'bg-cinematic-dark/10' : 'bg-zinc-100'}`}>
                     {count}
                   </span>
                 </button>
               );
             })}
           </div>
           
           {/* Search Input */}
           <div className="relative w-full lg:w-72 shrink-0">
             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
             </div>
             <input
               type="text"
               placeholder="Search by order #, name, or email"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-transparent border-b-2 border-zinc-300 pl-10 pr-4 py-3 text-sm font-bold text-zinc-900 focus:outline-none focus:border-cinematic-dark transition-all placeholder:text-zinc-400 placeholder:font-medium"
             />
           </div>
        </FadeInScroll>

        {/* ORDERS LIST (Editorial Index) */}
        <FadeInScroll className="py-24">
          {loading ? (
            <div className="h-[30vh] flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-cinematic-dark border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-24 text-center">
              <h3 className="text-3xl font-black tracking-tight text-zinc-300 mb-2">No {filterStatus !== 'all' ? filterStatus : ''} orders</h3>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[1000px]">
                {/* Header */}
                <div className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_2fr] gap-6 border-t-2 border-zinc-900 py-6">
                   <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs">Order</div>
                   <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs">Customer</div>
                   <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs">Earnings</div>
                   <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs">Status</div>
                   <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs text-right">Actions</div>
                </div>
                
                {/* Rows */}
                <div className="flex flex-col">
                  {filteredOrders.map((order, i) => (
                    <div key={order.id} className="grid grid-cols-[1fr_2fr_1.5fr_1.5fr_2fr] gap-6 py-8 border-t border-zinc-200 hover:bg-zinc-50/50 transition-colors group">
                      <div className="self-center">
                         <p className="text-zinc-500 font-mono text-sm">#{order.order_number}</p>
                         <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-1">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="self-center">
                         <p className="font-bold text-zinc-900 text-lg group-hover:text-cinematic-dark transition-colors">{order.first_name} {order.last_name}</p>
                         <p className="text-zinc-500 text-xs font-medium mt-1">{order.email}</p>
                      </div>
                      <div className="self-center">
                         <p className="font-black text-zinc-900 text-xl">{formatPrice(order.seller_amount)}</p>
                      </div>
                      <div className="self-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(order.status)}`}>
                          {formatStatusLabel(order.status)}
                        </span>
                      </div>
                      <div className="self-center flex items-center justify-end gap-6">
                        <button
                          onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                          className="text-zinc-400 hover:text-zinc-900 text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                          Details
                        </button>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status))}
                            disabled={updatingStatus}
                            className="text-cinematic-dark hover:text-cinematic-dark/70 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                          >
                            {updatingStatus ? 'Wait...' : getNextStatusLabel(order.status)} →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </FadeInScroll>
      </div>

      {/* Cinematic Modal for Order Details */}
      <AnimatePresence>
        {showDetailModal && selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-10">
            {/* Backdrop */}
            <Motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-900/60 backdrop-blur-md"
              onClick={() => setShowDetailModal(false)}
            />

            {/* Modal */}
            <Motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white shadow-2xl overflow-hidden rounded-none"
            >
              <div className="px-12 py-8 border-b-2 border-zinc-900 flex items-end justify-between bg-white">
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-2">Order Details</p>
                  <h2 className="text-5xl font-black text-cinematic-dark tracking-tight">#{selectedOrder.order_number}</h2>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="w-12 h-12 border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-900 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-12 py-12 space-y-12 max-h-[60vh] overflow-y-auto">
                
                {/* Status Tracker */}
                <div>
                   <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-4">Current Status</p>
                   <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border ${getStatusStyle(selectedOrder.status)}`}>
                      {formatStatusLabel(selectedOrder.status)}
                   </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   {/* Customer Info */}
                   <div>
                     <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-zinc-200 pb-2">Customer</p>
                     <p className="text-zinc-900 font-bold text-2xl mb-1">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                     <p className="text-zinc-500 text-sm">{selectedOrder.email}</p>
                   </div>
                   
                   {/* Delivery Info */}
                   <div>
                     <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-zinc-200 pb-2">Delivery</p>
                     <p className="text-zinc-900 font-bold text-lg">{selectedOrder.delivery_name}</p>
                     <p className="text-zinc-500 text-sm mt-1">{selectedOrder.delivery_phone}</p>
                     <p className="text-zinc-500 text-sm mt-1">{selectedOrder.delivery_address}</p>
                   </div>
                </div>

                {/* Financial Summary */}
                <div>
                   <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-zinc-200 pb-2">Financials</p>
                   <div className="space-y-4 max-w-md">
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-zinc-500 font-medium">Order Total</span>
                       <span className="text-zinc-900 font-bold text-lg">{formatPrice(selectedOrder.total_amount)}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                       <span className="text-zinc-500 font-medium">Platform Fee (5%)</span>
                       <span className="text-zinc-900 font-bold">{formatPrice(parseFloat(selectedOrder.platform_fee) || 0)}</span>
                     </div>
                     <div className="border-t-2 border-zinc-900 pt-4 flex justify-between items-end mt-4">
                       <span className="text-zinc-900 font-bold uppercase tracking-widest text-xs">Your Earnings</span>
                       <span className="font-black text-cinematic-dark text-4xl">{formatPrice(selectedOrder.seller_amount)}</span>
                     </div>
                   </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-4 border-b border-zinc-200 pb-2">Notes</p>
                    <p className="text-zinc-700 text-lg leading-relaxed">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </CinematicDashboardLayout>
  );
}
