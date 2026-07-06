import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';
import CinematicDashboardLayout from '../layouts/CinematicDashboardLayout';
import { motion as Motion } from 'framer-motion';

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
    
    Promise.all([fetchAnalytics(), fetchViewAnalytics()])
      .finally(() => {
        setLoading(false);
      });
      
  }, [user, navigate]);

  useEffect(() => {
    if (user?.role === 'seller' && !loading) {
      fetchViewAnalytics();
    }
  }, [viewPeriod]);

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsService.getSellerAnalytics();
      setAnalytics(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Analytics error:', err);
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
      minimumFractionDigits: 0,
    }).format(amount).replace('NGN', '₦');
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': 
      case 'delivered': return 'bg-cinematic-dark/10 text-cinematic-dark border-cinematic-dark/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'in progress':
      case 'processing': 
      case 'shipped': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'canceled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-zinc-100 text-zinc-500 border-zinc-200';
    }
  };

  if (loading) {
    return (
      <CinematicDashboardLayout>
        <div className="h-[70vh] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-cinematic-dark border-t-transparent rounded-full animate-spin"></div>
        </div>
      </CinematicDashboardLayout>
    );
  }

  if (error) {
    return (
      <CinematicDashboardLayout>
        <div className="h-[70vh] flex flex-col items-center justify-center text-center">
          <p className="text-red-500 font-bold mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchAnalytics(); }}
            className="px-6 py-2 rounded-full bg-cinematic-dark text-white font-bold"
          >
            Retry
          </button>
        </div>
      </CinematicDashboardLayout>
    );
  }

  const { overview, revenue_by_day, top_products, low_stock_products, recent_orders } = analytics || {};

  // Chart data
  const revenueData = revenue_by_day ? revenue_by_day.map(d => parseFloat(d.revenue) || 0) : [];
  const ordersData = revenue_by_day ? revenue_by_day.map(d => parseInt(d.orders_count) || 0) : [];
  const maxRevenue = Math.max(...revenueData, 1000);
  const maxOrders = Math.max(...ordersData, 10);

  return (
    <CinematicDashboardLayout>
      <div className="space-y-12">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-cinematic-dark mb-2">
              Analytics
            </h1>
            <p className="text-zinc-500 text-lg font-medium">
              Track your sales performance and insights
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/seller/dashboard" className="px-6 py-3 rounded-full bg-white border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 hover:text-cinematic-dark transition-colors shadow-sm">
              Dashboard
            </Link>
          </div>
        </header>

        {/* OVERVIEW STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: 'Total Revenue', 
              value: formatPrice(parseFloat(overview?.total_revenue) || 0), 
              growth: overview?.revenue_growth_percentage,
              icon: <svg className="w-6 h-6 text-cinematic-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            },
            { 
              label: 'Total Orders', 
              value: overview?.total_orders || 0, 
              growth: overview?.order_growth_percentage,
              icon: <svg className="w-6 h-6 text-cinematic-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            },
            { 
              label: 'Avg. Order Value', 
              value: formatPrice(parseFloat(overview?.average_order_value) || 0), 
              growth: 0,
              icon: <svg className="w-6 h-6 text-cinematic-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            },
            { 
              label: 'Pending Orders', 
              value: overview?.pending_orders || 0, 
              growth: 0,
              icon: <svg className="w-6 h-6 text-cinematic-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            },
          ].map((stat, i) => (
            <Motion.div 
              key={i}
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative p-6 rounded-3xl bg-white border border-zinc-200 group hover:border-cinematic-dark/30 hover:shadow-lg transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cinematic-light/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-xl shadow-sm border border-zinc-100">
                    {stat.icon}
                  </div>
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <h2 className="text-3xl font-black tracking-tighter text-zinc-900 mb-2">{stat.value}</h2>
                {stat.growth ? (
                  <div className={`text-sm font-bold flex items-center gap-1 ${stat.growth >= 0 ? 'text-cinematic-dark' : 'text-red-500'}`}>
                    {stat.growth >= 0 ? '↗' : '↘'} {Math.abs(stat.growth).toFixed(1)}% 
                    <span className="text-zinc-400 font-medium ml-1">vs last month</span>
                  </div>
                ) : (
                  <div className="text-sm font-bold text-transparent select-none">-</div>
                )}
              </div>
            </Motion.div>
          ))}
        </div>

        {/* ORDER STATUS BREAKDOWN */}
        <div className="p-8 rounded-[32px] bg-white border border-zinc-200 shadow-sm">
          <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-6">Order Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending', count: overview?.pending_orders || 0, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
              { label: 'Processing', count: overview?.processing_orders || 0, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'Shipped', count: overview?.shipped_orders || 0, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
              { label: 'Delivered', count: overview?.delivered_orders || 0, color: 'text-cinematic-dark', bg: 'bg-cinematic-dark/10', border: 'border-cinematic-dark/20' },
            ].map((status, i) => (
              <div key={i} className={`p-6 rounded-2xl border ${status.border} ${status.bg} flex flex-col items-center justify-center text-center`}>
                <span className={`text-4xl font-black ${status.color} mb-2`}>{status.count}</span>
                <span className={`text-sm font-bold uppercase tracking-widest ${status.color} opacity-80`}>{status.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHARTS (Pure CSS/Tailwind replacements) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart - Last 30 Days */}
          <div className="p-8 rounded-[32px] bg-white border border-zinc-200 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-8">Daily Revenue (Last 30 Days)</h3>
            <div className="h-[250px] flex items-end gap-1 sm:gap-2 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50">
                {[...Array(4)].map((_, i) => <div key={i} className="w-full border-t border-zinc-100" />)}
              </div>
              
              {revenue_by_day?.length > 0 ? revenue_by_day.map((day, i) => {
                const val = parseFloat(day.revenue) || 0;
                const heightPct = Math.max((val / maxRevenue) * 100, 2);
                return (
                  <div key={i} className="flex-1 flex justify-center group relative h-full items-end">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded transition-opacity z-10">
                      {formatPrice(val)}
                    </div>
                    <Motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 1, delay: i * 0.02 }}
                      className="w-full bg-cinematic-dark rounded-t-sm opacity-80 group-hover:opacity-100 transition-all"
                    />
                  </div>
                );
              }) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium">No revenue data</div>
              )}
            </div>
            {/* Chart Summary Stats */}
            {revenue_by_day?.length > 0 && (
              <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-zinc-100 text-center">
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Total</p>
                  <p className="text-lg font-black text-zinc-900">{formatPrice(revenueData.reduce((a, b) => a + b, 0))}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Orders</p>
                  <p className="text-lg font-black text-zinc-900">{ordersData.reduce((a, b) => a + b, 0)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Daily Avg</p>
                  <p className="text-lg font-black text-zinc-900">{formatPrice(revenueData.reduce((a, b) => a + b, 0) / revenueData.length)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Views Analytics */}
          <div className="p-8 rounded-[32px] bg-white border border-zinc-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold tracking-tight text-zinc-900">Product Views</h3>
              <select
                value={viewPeriod}
                onChange={(e) => setViewPeriod(e.target.value)}
                className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full text-sm font-bold text-zinc-700 outline-none focus:border-cinematic-dark"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>

            {viewsLoading && !viewAnalytics ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-cinematic-dark border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : viewAnalytics ? (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">All Time</p>
                    <p className="text-2xl font-black text-cinematic-dark">{viewAnalytics.totalViews?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 text-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Last {viewPeriod} Days</p>
                    <p className="text-2xl font-black text-cinematic-dark">{viewAnalytics.periodViews?.toLocaleString() || 0}</p>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-widest mb-4">Most Viewed Products</h4>
                  {viewAnalytics.mostViewedProducts?.length > 0 ? (
                    <div className="space-y-3">
                      {viewAnalytics.mostViewedProducts.slice(0, 4).map((product, index) => (
                        <div key={product.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200">
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-cinematic-dark text-white font-bold text-xs">
                            #{index + 1}
                          </div>
                          {product.image_urls && product.image_urls.length > 0 ? (
                            <img src={product.image_urls[0]} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">?</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-zinc-900 truncate">{product.name}</h5>
                            <p className="text-sm text-cinematic-dark font-medium">{formatPrice(parseFloat(product.price))}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-zinc-900">{parseInt(product.period_views || 0).toLocaleString()}</p>
                            <p className="text-xs font-bold text-zinc-500 uppercase">Views</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-zinc-400 font-bold uppercase tracking-widest text-sm">No views yet</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400">Failed to load view data</div>
            )}
          </div>
        </div>

        {/* LISTS: Top Selling & Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-8 rounded-[32px] bg-white border border-zinc-200 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-6">Top Selling Products</h3>
            {top_products && top_products.length > 0 ? (
              <div className="space-y-3">
                {top_products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img src={product.image_urls[0]} alt={product.name} className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">?</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-zinc-900 truncate">{product.name}</h4>
                      <p className="text-sm text-cinematic-dark font-medium">{formatPrice(parseFloat(product.price))}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-zinc-900">{product.units_sold || 0} <span className="text-xs font-bold text-zinc-500 uppercase ml-1">Sold</span></p>
                      <p className="text-sm text-cinematic-dark font-bold">{formatPrice(parseFloat(product.revenue) || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 font-bold uppercase tracking-widest text-sm">No sales data yet</div>
            )}
          </div>

          <div className="p-8 rounded-[32px] bg-white border border-zinc-200 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-6">Low Stock Alert</h3>
            {low_stock_products && low_stock_products.length > 0 ? (
              <div className="space-y-3">
                {low_stock_products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-3 rounded-2xl bg-red-50/50 hover:bg-red-50 transition-colors border border-red-100">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img src={product.image_urls[0]} alt={product.name} className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400">?</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-zinc-900 truncate">{product.name}</h4>
                      <p className="text-sm text-zinc-500 font-medium">{formatPrice(parseFloat(product.price))}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                        product.quantity_available === 0 
                          ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                          : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                      }`}>
                        {product.quantity_available} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400 font-bold uppercase tracking-widest text-sm">All products are well stocked</div>
            )}
          </div>
        </div>

        {/* RECENT ORDERS TABLE */}
        <div className="rounded-[32px] bg-white border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900">Recent Orders</h3>
            <Link to="/seller/orders" className="text-cinematic-dark text-sm font-bold uppercase tracking-widest hover:text-cinematic-dark/80 transition-colors">
              View All
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Order No.</th>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Customer</th>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Amount</th>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Status</th>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recent_orders && recent_orders.length > 0 ? recent_orders.map((order, i) => {
                  const statusMap = {
                    'pending_payment': 'Pending',
                    'payment_confirmed': 'Completed',
                    'processing': 'In Progress',
                    'shipped': 'In Progress',
                    'delivered': 'Completed',
                    'cancelled': 'Canceled',
                  };
                  const displayStatus = statusMap[order.status] || order.status;
                  
                  return (
                    <tr key={order.id || i} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                      <td className="px-8 py-6 text-zinc-400 font-mono text-sm">
                        #{order.order_number}
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-bold text-zinc-900 group-hover:text-cinematic-dark transition-colors">
                          {order.first_name} {order.last_name}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-zinc-900">
                        {formatPrice(order.total_amount || order.seller_amount)}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(displayStatus)}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-zinc-500 font-medium">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-16 text-center text-zinc-400 font-bold tracking-widest uppercase">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </CinematicDashboardLayout>
  );
}
