import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderService.getOrderDetails(orderId);
      setOrder(response.data);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      shipped: 'bg-purple-100 text-purple-800 border-purple-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleConfirmDelivery = async () => {
    try {
      setConfirming(true);
      const feedbackData = {
        rating,
        feedback: feedback.trim(),
      };
      await orderService.confirmDelivery(orderId, feedbackData);
      setShowConfirmModal(false);
      // Refresh order details to show updated status
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
      { key: 'pending', label: 'Order Placed', icon: '📦' },
      { key: 'processing', label: 'Processing', icon: '⚙️' },
      { key: 'shipped', label: 'Shipped', icon: '🚚' },
      { key: 'delivered', label: 'Delivered', icon: '✅' },
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-24 w-24 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">Order Not Found</h3>
          <p className="mt-2 text-gray-600">{error || 'This order does not exist or you do not have access to it.'}</p>
          <button
            onClick={() => navigate('/orders')}
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <nav className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/orders')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-xs text-gray-600">#{order.order_number}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Status Timeline */}
        {order.status !== 'cancelled' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Order Status</h2>

            {/* Desktop Timeline */}
            <div className="hidden md:block">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${
                        step.completed
                          ? 'bg-green-100 border-green-500'
                          : 'bg-gray-100 border-gray-300'
                      }`}>
                        {step.icon}
                      </div>
                      <p className={`mt-2 text-sm font-medium ${
                        step.completed ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        statusSteps[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Timeline */}
            <div className="md:hidden space-y-4">
              {statusSteps.map((step) => (
                <div key={step.key} className={`flex items-center gap-4 p-3 rounded-lg ${
                  step.completed ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 flex-shrink-0 ${
                    step.completed
                      ? 'bg-green-100 border-green-500'
                      : 'bg-gray-100 border-gray-300'
                  }`}>
                    {step.icon}
                  </div>
                  <div>
                    <p className={`font-medium ${
                      step.completed ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {step.active && (
                      <p className="text-xs text-gray-500 mt-1">Current status</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {order.estimated_delivery_date && order.status !== 'delivered' && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Estimated Delivery:</span>{' '}
                  {formatDate(order.estimated_delivery_date)}
                </p>
              </div>
            )}

            {order.delivered_at && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Delivered on:</span>{' '}
                  {formatDate(order.delivered_at)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cancelled Status */}
        {order.status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-red-900">Order Cancelled</h3>
                <p className="text-sm text-red-700 mt-1">This order has been cancelled by the seller.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shop Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Shop Information</h2>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate(`/shop/${order.shop_slug}`)}
                  className="flex items-center gap-3 hover:text-green-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{order.shop_name}</p>
                    <p className="text-sm text-gray-600">View Shop</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items && order.items.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{item.product_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-600">Price: {formatPrice(item.product_price)}</p>
                        <p className="text-sm font-semibold text-green-600 mt-2">
                          Subtotal: {formatPrice(item.subtotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Delivery Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Recipient Name</p>
                  <p className="font-medium text-gray-900">{order.delivery_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone Number</p>
                  <p className="font-medium text-gray-900">{order.delivery_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="font-medium text-gray-900">{order.delivery_address}</p>
                </div>
                {order.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Order Notes</p>
                    <p className="font-medium text-gray-900">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Number</span>
                  <span className="font-mono font-medium text-gray-900">{order.order_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Order Date</span>
                  <span className="font-medium text-gray-900">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(order.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform Fee (5%)</span>
                    <span className="font-medium">{formatPrice(parseFloat(order.platform_fee) || 0)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total Paid</span>
                  <span className="font-bold text-green-600 text-xl">{formatPrice(order.total_amount)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {order.status === 'delivered' && !order.delivery_confirmed_at && (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Confirm Delivery
                  </button>
                )}
                {order.delivery_confirmed_at && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium text-center">
                      ✓ Delivery Confirmed
                    </p>
                  </div>
                )}
                <button
                  onClick={() => navigate(`/shop/${order.shop_slug}`)}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Visit Shop
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back to Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delivery Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Delivery</h3>

            <p className="text-gray-600 mb-6">
              Have you received your order? Please confirm delivery and rate your experience.
            </p>

            {/* Rating */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate your experience (1-5 stars)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts about this order..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows="3"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={confirming}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirming}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {confirming ? 'Confirming...' : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
