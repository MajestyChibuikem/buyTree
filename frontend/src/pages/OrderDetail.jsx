import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';
import { motion as Motion } from 'framer-motion';
import ReviewForm from '../components/reviews/ReviewForm';

export default function OrderDetail() {
  const { orderId, trackingToken } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [orderHistory, setOrderHistory] = useState([]);
  const [activeReviewItemId, setActiveReviewItemId] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, trackingToken]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = trackingToken
        ? await orderService.getOrderByTrackingToken(trackingToken)
        : await orderService.getOrderDetails(orderId);
      
      if (trackingToken) {
        setOrder(response.data.order);
        setOrderHistory(response.data.history || []);
      } else {
        setOrder(response.data);
        setOrderHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      setError(error.response?.data?.message || 'Failed to load order details');
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
      hour: '2-digit',
      minute: '2-digit',
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

  const handleConfirmDelivery = async () => {
    try {
      setConfirming(true);
      const feedbackData = {
        rating,
        feedback: feedback.trim(),
      };
      if (trackingToken) {
        await orderService.confirmDeliveryByToken(trackingToken, feedbackData);
      } else {
        await orderService.confirmDelivery(orderId, feedbackData);
      }
      setShowConfirmModal(false);
      await fetchOrderDetails();
      alert('Delivery confirmed successfully! Thank you for your feedback.');
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
      alert(error.response?.data?.message || 'Failed to confirm delivery. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed' },
      { key: 'processing', label: 'Processing' },
      { key: 'shipped', label: 'Shipped' },
      { key: 'delivered', label: 'Delivered' },
    ];

    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(order?.status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-cinematic">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-xs">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-cinematic">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-8xl font-black text-zinc-100 mb-6">ERROR</div>
          <h3 className="text-2xl font-black text-zinc-900 mb-2">Order Not Found</h3>
          <p className="text-zinc-500 font-medium mb-12">{error || 'This order does not exist or you do not have access to it.'}</p>
          <button
            onClick={() => navigate(user ? '/orders' : '/')}
            className="w-full px-8 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-cinematic-dark transition-colors"
          >
            {user ? 'Back to Orders' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-white font-cinematic text-zinc-900 pb-12">
      {/* Navbar */}
      <nav className="bg-white border-b border-zinc-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/orders')}
                className="hover:text-cinematic-dark transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {user ? 'Back to Orders' : 'Back to Home'}
              </button>
              <div className="hidden sm:block w-px h-6 bg-zinc-200"></div>
              <div className="hidden sm:block text-xl font-black tracking-tighter text-zinc-900 uppercase">
                Order #{order.order_number}
              </div>
            </div>
            <div className="flex items-center">
              <span className={`px-4 py-1.5 border text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Main Details (Left) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-12">
            
            {/* Status Timeline */}
            {order.status !== 'cancelled' && (
              <div className="bg-zinc-50 border border-zinc-200 p-8">
                <h2 className="text-xl font-black uppercase tracking-widest text-zinc-900 mb-8 border-b border-zinc-200 pb-4">Tracking Status</h2>
                
                <div className="relative">
                  <div className="absolute top-3 left-3 right-3 h-0.5 bg-zinc-200" />
                  <div className="relative flex justify-between">
                    {statusSteps.map((step, index) => (
                      <div key={step.key} className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full border-2 bg-zinc-50 z-10 transition-colors ${
                          step.completed ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300'
                        }`} />
                        <p className={`mt-4 text-[10px] font-bold uppercase tracking-widest transition-colors text-center ${
                          step.completed ? 'text-zinc-900' : 'text-zinc-400'
                        }`}>
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {order.estimated_delivery_date && order.status !== 'delivered' && (
                  <div className="mt-8 border-t border-zinc-200 pt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Estimated Arrival</p>
                    <p className="font-bold text-zinc-900">{formatDate(order.estimated_delivery_date)}</p>
                  </div>
                )}

                {order.delivered_at && (
                  <div className="mt-8 border-t border-zinc-200 pt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cinematic-dark mb-1">Delivered</p>
                    <p className="font-bold text-zinc-900">{formatDate(order.delivered_at)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Cancelled Alert */}
            {order.status === 'cancelled' && (
              <div className="bg-red-50 border-l-4 border-red-600 p-6">
                <h3 className="text-lg font-black uppercase tracking-widest text-red-900 mb-1">Order Cancelled</h3>
                <p className="text-sm font-medium text-red-700">This order has been cancelled by the seller.</p>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-zinc-900 mb-8 uppercase">Purchased Pieces</h2>
              
              <div className="border-t-2 border-zinc-900">
                {order.items && order.items.map((item) => {
                  const isReviewOpen = activeReviewItemId === item.product_id;

                  return (
                    <div key={item.id} className="py-6 border-b border-zinc-200 flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-zinc-900 mb-2">{item.product_name}</h3>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">QTY: {item.quantity}</p>
                          <p className="text-sm font-medium text-zinc-600">Unit Price: {formatPrice(item.product_price)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Subtotal</p>
                          <p className="text-xl font-black text-zinc-900">{formatPrice(item.subtotal)}</p>
                        </div>
                      </div>

                      {/* Guest Reviews Integration */}
                      {order.payment_status === 'paid' && (
                        <div className="pt-2">
                          {item.has_review ? (
                            <span className="inline-block text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 px-3 py-1.5 border border-zinc-200">
                              ✓ Reviewed
                            </span>
                          ) : (
                            !isReviewOpen ? (
                              <button
                                onClick={() => setActiveReviewItemId(item.product_id)}
                                className="px-6 py-2 border-2 border-zinc-900 text-zinc-900 font-black uppercase tracking-widest text-[9px] hover:bg-zinc-900 hover:text-white transition-colors"
                              >
                                Write a Review
                              </button>
                            ) : (
                              <div className="mt-4 border border-zinc-200 p-6 bg-zinc-50">
                                <ReviewForm
                                  productId={item.product_id}
                                  orderId={order.id}
                                  productName={item.product_name}
                                  trackingToken={trackingToken}
                                  onReviewSubmitted={() => {
                                    setActiveReviewItemId(null);
                                    fetchOrderDetails();
                                  }}
                                  onCancel={() => setActiveReviewItemId(null)}
                                />
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-8">
            
            {/* Receipt Summary */}
            <div className="bg-zinc-50 p-8 border border-zinc-100 sticky top-24">
              <h2 className="text-xl font-black uppercase tracking-widest text-zinc-900 mb-8 border-b-2 border-zinc-900 pb-4">Receipt</h2>

              <div className="space-y-6 mb-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Date</p>
                  <p className="text-sm font-bold text-zinc-900">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Shop</p>
                  <button
                    onClick={() => navigate(`/shop/${order.shop_slug}`)}
                    className="text-sm font-bold text-zinc-900 hover:text-cinematic-dark transition-colors flex items-center gap-2"
                  >
                    {order.shop_name}
                    <span className="text-cinematic-dark">→</span>
                  </button>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Payment Status</p>
                  <span className={`inline-block px-3 py-1 border text-[10px] font-black uppercase tracking-widest mt-1 ${
                    order.payment_status === 'paid' ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-red-50 border-red-200 text-red-600'
                  }`}>
                    {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="border-t border-zinc-200 pt-6 mb-6 space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <span>Subtotal</span>
                  <span className="text-zinc-900">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <span>Platform Fee (5%)</span>
                  <span className="text-zinc-900">{formatPrice(parseFloat(order.platform_fee) || 0)}</span>
                </div>
              </div>

              <div className="border-t-2 border-zinc-900 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black uppercase tracking-widest text-zinc-900">Total Paid</span>
                  <span className="text-3xl font-black text-zinc-900">{formatPrice(order.total_amount)}</span>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="border-t border-zinc-200 pt-6 mb-8">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Delivery Destination</p>
                <div className="text-sm font-medium text-zinc-600 space-y-1">
                  <p className="text-zinc-900 font-bold">{order.delivery_name}</p>
                  <p>{order.delivery_phone}</p>
                  <p className="leading-relaxed">{order.delivery_address}</p>
                  {order.notes && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Notes</p>
                      <p className="italic text-xs">{order.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                {order.status === 'delivered' && !order.delivery_confirmed_at && (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full px-8 py-4 bg-cinematic-dark text-white font-black uppercase tracking-widest text-[10px] hover:bg-zinc-900 transition-colors"
                  >
                    Confirm Delivery
                  </button>
                )}
                {order.delivery_confirmed_at && (
                  <div className="w-full px-8 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] text-center border border-zinc-900">
                    DELIVERY CONFIRMED
                  </div>
                )}
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full px-8 py-4 bg-white border border-zinc-200 text-zinc-900 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 transition-colors"
                >
                  Back to Orders
                </button>
              </div>
            </div>

            {/* Recent Orders History block */}
            {orderHistory.length > 1 && (
              <div className="bg-zinc-50 p-8 border border-zinc-100">
                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-950 mb-6 border-b border-zinc-200 pb-4">
                  Associated Orders
                </h2>
                <div className="space-y-4">
                  {orderHistory.map((histOrder) => (
                    <button
                      key={histOrder.id}
                      onClick={() => navigate(`/orders/track/${histOrder.tracking_token}`)}
                      className={`w-full text-left p-4 border transition-colors flex flex-col gap-2 ${
                        histOrder.id === order.id
                          ? 'border-zinc-900 bg-white'
                          : 'border-zinc-200 bg-zinc-50 hover:bg-white hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-xs text-zinc-900">
                          {histOrder.order_number}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                          {histOrder.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        {histOrder.shop_name}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {new Date(histOrder.created_at).toLocaleDateString()} • {formatPrice(histOrder.total_amount)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Confirm Delivery Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <Motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white p-8 border border-zinc-200 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">Confirm Receipt</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <p className="text-sm font-medium text-zinc-600 mb-8">
              Confirming delivery finalizes the order and releases payment. How was your experience?
            </p>

            {/* Rating */}
            <div className="mb-8">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                Rating
              </label>
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-4xl transition-colors focus:outline-none ${
                      star <= rating ? 'text-cinematic-dark' : 'text-zinc-200 hover:text-zinc-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-8">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts about this piece..."
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:bg-white transition-colors resize-none font-medium text-sm"
                rows="4"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-zinc-100">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={confirming}
                className="flex-1 px-4 py-4 bg-white border-2 border-zinc-900 text-zinc-900 font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirming}
                className="flex-1 px-4 py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-cinematic-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    CONFIRMING
                  </>
                ) : 'CONFIRM'}
              </button>
            </div>
          </Motion.div>
        </div>
      )}
    </div>
  );
}
