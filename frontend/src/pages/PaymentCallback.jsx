import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderService } from '../services/api';
import { useCart } from '../context/CartContext';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart, refreshCart } = useCart();
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');

      if (!reference) {
        setStatus('failed');
        return;
      }

      try {
        const response = await orderService.verifyPayment(reference);

        if (response.success) {
          setStatus('success');
          setOrderData(response.data);

          // Clear the cart after successful payment
          await clearCart();

          // Also refresh cart to sync with server
          await refreshCart();

          // Redirect to orders page after 3 seconds
          setTimeout(() => {
            navigate('/orders');
          }, 3000);
        } else {
          setStatus('failed');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [searchParams, navigate, clearCart, refreshCart]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
            <h2 className="mt-6 text-2xl font-bold text-gray-900">Verifying Payment</h2>
            <p className="mt-2 text-gray-600">Please wait while we confirm your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">Payment Successful!</h2>
            <p className="mt-2 text-gray-600">
              Your order has been placed successfully.
            </p>

            {orderData && orderData.orders && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Order Numbers:</p>
                {orderData.orders.map((order, idx) => (
                  <p key={idx} className="text-sm text-gray-600 font-mono">
                    {order.orderNumber}
                  </p>
                ))}
              </div>
            )}

            <p className="mt-6 text-sm text-gray-500">
              Redirecting to your orders...
            </p>

            <button
              onClick={() => navigate('/orders')}
              className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              View Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h2 className="mt-6 text-2xl font-bold text-gray-900">Payment Failed</h2>
          <p className="mt-2 text-gray-600">
            We couldn't verify your payment. Please try again or contact support.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => navigate('/cart')}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Return to Cart
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
