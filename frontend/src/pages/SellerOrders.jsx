import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import CinematicDashboardLayout from '../layouts/CinematicDashboardLayout';
import { motion as Motion, AnimatePresence } from 'framer-motion';

export default function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
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
      hour: '2-digit',
      minute: '2-digit',
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

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.status === filterStatus);

  const totalEarnings = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, order) => sum + parseFloat(order.seller_amount || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;

  return (
    <CinematicDashboardLayout>
      <div className="space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-cinematic-dark mb-2">
              Orders
            </h1>
            <p className="text-zinc-500 text-lg font-medium">
              Track and fulfill customer purchases.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 rounded-full bg-white border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 hover:text-cinematic-dark transition-colors shadow-sm">
              Export CSV
            </button>
          </div>
        </header>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm group hover:border-cinematic-dark/30 hover:shadow-md transition-all">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Earnings</p>
            <p className="text-3xl font-black text-cinematic-dark">{formatPrice(totalEarnings)}</p>
            <p className="text-xs text-zinc-400 font-medium mt-2">Your 95% share</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm group hover:border-yellow-400/50 hover:shadow-md transition-all">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Pending Orders</p>
            <p className="text-3xl font-black text-yellow-500">{pendingOrders}</p>
            <p className="text-xs text-zinc-400 font-medium mt-2">Action required</p>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm group hover:border-blue-400/50 hover:shadow-md transition-all">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Processing</p>
            <p className="text-3xl font-black text-blue-500">{processingOrders}</p>
            <p className="text-xs text-zinc-400 font-medium mt-2">Currently fulfilling</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
          {['all', 'pending', 'processing', 'ready_for_pickup', 'in_transit', 'delivered'].map((status) => {
            const count = status === 'all' ? orders.length : orders.filter(o => o.status === status).length;
            const isActive = filterStatus === status;
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`relative flex items-center px-6 py-3 rounded-full text-sm font-bold tracking-widest uppercase whitespace-nowrap transition-all ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200'
                }`}
              >
                {isActive && (
                  <Motion.div 
                    layoutId="orderTabBubble"
                    className="absolute inset-0 bg-cinematic-dark rounded-full shadow-md"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{formatStatusLabel(status)}</span>
                <span className={`relative z-10 ml-2 px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-zinc-100'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ORDERS LIST */}
        {loading ? (
          <div className="h-[30vh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-cinematic-dark border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center rounded-[32px] bg-white border border-zinc-200 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-full bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100">
              <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-2">No {filterStatus !== 'all' ? filterStatus : ''} orders</h3>
            <p className="text-zinc-500 font-medium">You have no orders matching this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order, i) => (
              <Motion.div 
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={order.id} 
                className="bg-white rounded-[24px] border border-zinc-200 hover:border-cinematic-dark/30 hover:shadow-lg transition-all overflow-hidden flex flex-col shadow-sm"
              >
                {/* Card Header */}
                <div className="px-6 py-5 bg-zinc-50 border-b border-zinc-100 flex justify-between items-start">
                  <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Order #{order.order_number}</p>
                    <p className="text-zinc-400 text-[10px] font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${getStatusStyle(order.status)}`}>
                    {formatStatusLabel(order.status)}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="mb-6">
                    <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Customer</p>
                    <p className="text-zinc-900 font-bold tracking-tight">{order.first_name} {order.last_name}</p>
                    
                    <div className="mt-4">
                      <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Your Earnings</p>
                      <p className="text-2xl font-black text-cinematic-dark">{formatPrice(order.seller_amount)}</p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                      className="flex-1 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 shadow-sm rounded-xl text-zinc-700 text-xs font-bold tracking-widest uppercase transition-colors"
                    >
                      Details
                    </button>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status))}
                        disabled={updatingStatus}
                        className="flex-1 py-2.5 bg-cinematic-dark hover:bg-cinematic-dark/90 text-white rounded-xl text-xs font-bold tracking-widest uppercase shadow-md disabled:opacity-50 transition-all"
                      >
                        {updatingStatus ? 'Wait...' : getNextStatusLabel(order.status)}
                      </button>
                    )}
                  </div>
                </div>
              </Motion.div>
            ))}
          </div>
        )}
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
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
              onClick={() => setShowDetailModal(false)}
            />

            {/* Modal */}
            <Motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <div>
                  <h2 className="text-2xl font-bold text-cinematic-dark tracking-tight">Order Details</h2>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">#{selectedOrder.order_number}</p>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)} 
                  className="w-10 h-10 rounded-full bg-white border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-8 py-8 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Financial Summary */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Financial Summary</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 font-medium">Order Total</span>
                      <span className="text-zinc-900 font-bold">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 font-medium">Platform Fee (5%)</span>
                      <span className="text-zinc-900 font-bold">{formatPrice(parseFloat(selectedOrder.platform_fee) || 0)}</span>
                    </div>
                    <div className="border-t border-zinc-100 pt-3 flex justify-between">
                      <span className="text-zinc-900 font-bold uppercase tracking-widest text-xs">Your Earnings</span>
                      <span className="font-black text-cinematic-dark text-xl">{formatPrice(selectedOrder.seller_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Customer Information</p>
                  <p className="text-zinc-900 font-bold text-lg">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                  <p className="text-zinc-500 text-sm mt-1 font-medium">{selectedOrder.email}</p>
                </div>

                {/* Delivery Info */}
                <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">Delivery Details</p>
                  <p className="text-zinc-900 font-bold">{selectedOrder.delivery_name}</p>
                  <p className="text-zinc-500 font-medium text-sm mt-1">{selectedOrder.delivery_phone}</p>
                  <p className="text-zinc-500 font-medium text-sm mt-1">{selectedOrder.delivery_address}</p>
                  {selectedOrder.notes && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">Notes</p>
                      <p className="text-zinc-700 text-sm">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-8 py-6 border-t border-zinc-100 bg-zinc-50 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-8 py-3 rounded-full border border-zinc-200 bg-white text-zinc-700 font-bold hover:bg-zinc-50 transition-colors uppercase tracking-widest text-xs shadow-sm"
                >
                  Close Window
                </button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </CinematicDashboardLayout>
  );
}
