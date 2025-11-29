import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';
import { BarChart } from '@mui/x-charts/BarChart';

export default function SellerAnalytics() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View analytics state
  const [viewAnalytics, setViewAnalytics] = useState(null);
  const [viewPeriod, setViewPeriod] = useState('30');
  const [viewsLoading, setViewsLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'seller') {
      navigate('/login');
      return;
    }
    fetchAnalytics();
    fetchViewAnalytics();
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === 'seller') {
      fetchViewAnalytics();
    }
  }, [viewPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getSellerAnalytics();
      setAnalytics(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchViewAnalytics = async () => {
    try {
      setViewsLoading(true);
      const response = await analyticsService.getProductViewAnalytics(viewPeriod);
      setViewAnalytics(response.data);
    } catch (err) {
      console.error('View analytics error:', err);
    } finally {
      setViewsLoading(false);
    }
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overview, revenue_by_day, top_products, low_stock_products, recent_orders } = analytics || {};

  // Calculate max revenue for chart scaling
  const maxRevenue = Math.max(...(revenue_by_day || []).map((day) => parseFloat(day.revenue)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">Track your sales performance and insights</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/seller/dashboard"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Products
              </Link>
              <Link
                to="/seller/orders"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Orders
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPrice(parseFloat(overview?.total_revenue) || 0)}
                </p>
                {overview?.revenue_growth_percentage !== 0 && (
                  <p
                    className={`text-sm mt-1 ${
                      overview?.revenue_growth_percentage > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {overview?.revenue_growth_percentage > 0 ? '+' : ''}
                    {overview?.revenue_growth_percentage?.toFixed(1)}% from last month
                  </p>
                )}
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{overview?.total_orders || 0}</p>
                {overview?.order_growth_percentage !== 0 && (
                  <p
                    className={`text-sm mt-1 ${
                      overview?.order_growth_percentage > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {overview?.order_growth_percentage > 0 ? '+' : ''}
                    {overview?.order_growth_percentage?.toFixed(1)}% from last month
                  </p>
                )}
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Order Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatPrice(parseFloat(overview?.average_order_value) || 0)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{overview?.pending_orders || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Need your attention</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{overview?.pending_orders || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Pending</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{overview?.processing_orders || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Processing</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{overview?.shipped_orders || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Shipped</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{overview?.delivered_orders || 0}</p>
              <p className="text-sm text-gray-600 mt-1">Delivered</p>
            </div>
          </div>
        </div>

        {/* Revenue Chart - Last 30 Days */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue (Last 30 Days)</h2>
          {revenue_by_day && revenue_by_day.length > 0 ? (
            <div className="space-y-4">
              {/* MUI BarChart */}
              <div className="w-full" style={{ height: '400px' }}>
                <BarChart
                  dataset={revenue_by_day.map(day => ({
                    date: formatDate(day.date),
                    revenue: parseFloat(day.revenue) || 0,
                    orders: parseInt(day.orders_count) || 0,
                  }))}
                  xAxis={[{
                    scaleType: 'band',
                    dataKey: 'date',
                    tickLabelStyle: {
                      angle: -45,
                      textAnchor: 'end',
                      fontSize: 11,
                    },
                  }]}
                  yAxis={[{
                    label: 'Revenue (₦)',
                    valueFormatter: (value) => formatPrice(value),
                  }]}
                  series={[
                    {
                      dataKey: 'revenue',
                      label: 'Daily Revenue',
                      color: '#10b981',
                      valueFormatter: (value) => formatPrice(value),
                    }
                  ]}
                  grid={{ horizontal: true }}
                  margin={{ top: 20, right: 20, bottom: 80, left: 80 }}
                  slotProps={{
                    legend: { hidden: false },
                  }}
                />
              </div>

              {/* Summary stats below chart */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(revenue_by_day.reduce((sum, day) => sum + parseFloat(day.revenue || 0), 0))}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total Orders</p>
                  <p className="text-lg font-bold text-gray-900">
                    {revenue_by_day.reduce((sum, day) => sum + parseInt(day.orders_count || 0), 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Daily Average</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatPrice(
                      revenue_by_day.reduce((sum, day) => sum + parseFloat(day.revenue || 0), 0) /
                      revenue_by_day.length
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No revenue data available</p>
              <p className="text-sm mt-1">Start making sales to see your revenue chart</p>
            </div>
          )}
        </div>

        {/* Product Views Analytics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Product Views</h2>
            <select
              value={viewPeriod}
              onChange={(e) => setViewPeriod(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>

          {viewsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-sm">Loading views...</p>
            </div>
          ) : viewAnalytics ? (
            <div className="space-y-6">
              {/* Views Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Total Views (All Time)</p>
                  <p className="text-3xl font-bold text-indigo-600">{viewAnalytics.totalViews?.toLocaleString() || 0}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Views (Last {viewPeriod} Days)</p>
                  <p className="text-3xl font-bold text-blue-600">{viewAnalytics.periodViews?.toLocaleString() || 0}</p>
                </div>
              </div>

              {/* Most Viewed Products */}
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">Most Viewed Products</h3>
                {viewAnalytics.mostViewedProducts && viewAnalytics.mostViewedProducts.length > 0 ? (
                  <div className="space-y-3">
                    {viewAnalytics.mostViewedProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-indigo-600">#{index + 1}</span>
                        </div>
                        {product.image_urls && product.image_urls.length > 0 ? (
                          <img
                            src={product.image_urls[0]}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                          <p className="text-sm text-gray-500">{formatPrice(parseFloat(product.price))}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end">
                            <p className="text-sm font-semibold text-indigo-600">
                              {parseInt(product.period_views || 0).toLocaleString()} views
                            </p>
                            <p className="text-xs text-gray-500">
                              {parseInt(product.total_views || 0).toLocaleString()} total
                            </p>
                          </div>
                          {product.quantity_available !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">
                              {product.quantity_available} in stock
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p className="text-sm">No product views yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Unable to load view analytics</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Selling Products */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
            {top_products && top_products.length > 0 ? (
              <div className="space-y-4">
                {top_products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500">{formatPrice(parseFloat(product.price))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{product.units_sold || 0} sold</p>
                      <p className="text-sm text-green-600">{formatPrice(parseFloat(product.revenue) || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No sales data yet</div>
            )}
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h2>
            {low_stock_products && low_stock_products.length > 0 ? (
              <div className="space-y-4">
                {low_stock_products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500">{formatPrice(parseFloat(product.price))}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          product.quantity_available === 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {product.quantity_available} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">All products are well stocked</div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/seller/orders" className="text-sm text-green-600 hover:text-green-700 font-medium">
              View All Orders →
            </Link>
          </div>
          {recent_orders && recent_orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recent_orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.first_name} {order.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(parseFloat(order.seller_amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No orders yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
