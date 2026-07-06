import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/api';
import CinematicDashboardLayout from '../layouts/CinematicDashboardLayout';
import { motion as Motion, useScroll, useTransform } from 'framer-motion';

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

export default function SellerAnalytics() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateString));
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
          <p className="text-zinc-900 font-extrabold text-3xl mb-4">{error}</p>
          <button
            onClick={() => { setLoading(true); fetchAnalytics(); }}
            className="px-8 py-4 rounded-full bg-cinematic-dark text-white font-bold tracking-widest uppercase text-sm"
          >
            Retry Connection
          </button>
        </div>
      </CinematicDashboardLayout>
    );
  }

  const { overview, revenue_by_day, top_products, low_stock_products, recent_orders } = analytics || {};

  // Chart data
  const revenueData = revenue_by_day ? revenue_by_day.map(d => parseFloat(d.revenue) || 0) : [];
  const maxRevenue = Math.max(...revenueData, 1000);

  return (
    <CinematicDashboardLayout>
      <div className="max-w-7xl mx-auto pb-32 overflow-hidden px-2 md:px-0">
        
        {/* HUGE HERO: TOTAL REVENUE */}
        <div className="pt-12 pb-24 md:pb-32 border-b border-zinc-200">
          <Motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-sm mb-6"
          >
            Total Revenue
          </Motion.p>
          <Motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-[64px] sm:text-[96px] md:text-[140px] font-black tracking-tighter leading-[0.9] text-zinc-900 break-words"
          >
            {formatPrice(parseFloat(overview?.total_revenue) || 0)}
          </Motion.h1>
          {overview?.revenue_growth_percentage !== 0 && (
            <Motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-8 flex items-center gap-3"
            >
              <div className={`px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase ${
                overview?.revenue_growth_percentage > 0 ? 'bg-cinematic-dark/10 text-cinematic-dark' : 'bg-red-500/10 text-red-600'
              }`}>
                {overview?.revenue_growth_percentage > 0 ? '↗' : '↘'} {Math.abs(overview?.revenue_growth_percentage).toFixed(1)}%
              </div>
              <span className="text-zinc-400 font-medium tracking-wide">vs last month</span>
            </Motion.div>
          )}
        </div>

        {/* REVENUE CHART & SECONDARY STATS (Editorial Split) */}
        <FadeInScroll className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 py-24 md:py-32 border-b border-zinc-200">
          {/* Left Col: Chart */}
          <div className="lg:col-span-8">
            <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-16">Revenue Flow</h2>
            <div className="h-[300px] flex items-end gap-1 sm:gap-2 relative">
              {/* Subtle Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[...Array(4)].map((_, i) => <div key={i} className="w-full border-t border-zinc-200" />)}
              </div>
              
              {revenue_by_day?.length > 0 ? revenue_by_day.map((day, i) => {
                const val = parseFloat(day.revenue) || 0;
                const heightPct = Math.max((val / maxRevenue) * 100, 2);
                return (
                  <div key={i} className="flex-1 flex justify-center group relative h-full items-end z-10">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-zinc-900 text-white text-xs font-bold px-3 py-2 rounded transition-opacity">
                      {formatPrice(val)}
                    </div>
                    <Motion.div 
                      initial={{ height: 0 }}
                      whileInView={{ height: `${heightPct}%` }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.02 }}
                      className="w-full bg-zinc-900 hover:bg-cinematic-dark transition-colors"
                    />
                  </div>
                );
              }) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium">No revenue data available</div>
              )}
            </div>
            {/* Chart legend / dates */}
            {revenue_by_day?.length > 0 && (
              <div className="flex justify-between mt-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                <span>{formatDate(revenue_by_day[0].date)}</span>
                <span>{formatDate(revenue_by_day[revenue_by_day.length - 1].date)}</span>
              </div>
            )}
          </div>

          {/* Right Col: Secondary Stats */}
          <div className="lg:col-span-4 flex flex-col">
             <div className="flex-1 flex flex-col justify-between">
                <div className="py-8 border-t border-zinc-200">
                   <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-3">Total Orders</p>
                   <p className="text-5xl font-black text-zinc-900">{overview?.total_orders || 0}</p>
                </div>
                <div className="py-8 border-t border-zinc-200">
                   <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-3">Avg. Order Value</p>
                   <p className="text-5xl font-black text-zinc-900">{formatPrice(parseFloat(overview?.average_order_value) || 0)}</p>
                </div>
                <div className="py-8 border-t border-zinc-200">
                   <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-3">Pending Orders</p>
                   <p className="text-5xl font-black text-cinematic-dark">{overview?.pending_orders || 0}</p>
                </div>
             </div>
          </div>
        </FadeInScroll>

        {/* CATALOG INSIGHTS (Seamless integration with theme color) */}
        <div className="py-32 my-24 border-y border-zinc-200">
          <FadeInScroll>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
              <div>
                <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 text-cinematic-dark">Catalog Insights</h2>
                <p className="text-zinc-500 text-xl font-light">Performance metrics for your products.</p>
              </div>
              <div className="relative">
                <select
                  value={viewPeriod}
                  onChange={(e) => setViewPeriod(e.target.value)}
                  className="appearance-none bg-transparent border-b-2 border-zinc-200 text-zinc-900 text-xl font-bold py-2 pr-8 outline-none focus:border-cinematic-dark transition-colors cursor-pointer"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
              </div>
            </div>

            {viewsLoading && !viewAnalytics ? (
              <div className="py-24 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-cinematic-dark border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : viewAnalytics ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                {/* Massive View Count */}
                <div className="lg:col-span-5">
                  <div className="mb-16">
                    <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-6">Views (Last {viewPeriod} Days)</p>
                    <p className="text-[80px] sm:text-[100px] font-black text-cinematic-dark leading-[0.9] tracking-tighter break-words">
                      {viewAnalytics.periodViews?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-6">All Time Views</p>
                    <p className="text-5xl font-black text-zinc-900">
                      {viewAnalytics.totalViews?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                {/* Most Viewed List (Premium UI) */}
                <div className="lg:col-span-7">
                  <h3 className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-8">Most Viewed Products</h3>
                  {viewAnalytics.mostViewedProducts?.length > 0 ? (
                    <div className="flex flex-col">
                      {viewAnalytics.mostViewedProducts.slice(0, 5).map((product, index) => (
                        <div key={product.id} className="flex items-center gap-6 py-6 border-t border-zinc-200 group hover:bg-zinc-50/50 transition-colors -mx-4 px-4">
                          <div className="text-zinc-400 font-black text-2xl w-8 group-hover:text-cinematic-dark transition-colors">
                            {index + 1}
                          </div>
                          {product.image_urls && product.image_urls.length > 0 ? (
                            <img src={product.image_urls[0]} alt={product.name} className="w-16 h-16 object-cover bg-zinc-100 group-hover:scale-105 transition-all" />
                          ) : (
                            <div className="w-16 h-16 bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold">?</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-bold text-zinc-900 truncate group-hover:text-cinematic-dark transition-colors">{product.name}</h4>
                            <p className="text-zinc-500 font-medium mt-1">{formatPrice(parseFloat(product.price))}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-zinc-900">{parseInt(product.period_views || 0).toLocaleString()}</p>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Views</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-zinc-500 font-medium">No views recorded yet.</div>
                  )}
                </div>
              </div>
            ) : null}
          </FadeInScroll>
        </div>

        {/* TOP SELLING & LOW STOCK (Editorial List Format) */}
        <FadeInScroll className="grid grid-cols-1 lg:grid-cols-2 gap-24 py-24 border-b border-zinc-200">
          <div>
            <h3 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-12">Top Sellers</h3>
            {top_products && top_products.length > 0 ? (
              <div className="flex flex-col border-t border-zinc-900">
                {top_products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center gap-6 py-6 border-b border-zinc-200 group">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-bold text-zinc-900 truncate group-hover:text-cinematic-dark transition-colors">{product.name}</h4>
                      <p className="text-zinc-500 font-medium mt-1">{formatPrice(parseFloat(product.price))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-zinc-900">{product.units_sold || 0} <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest ml-1">Sold</span></p>
                      <p className="text-sm text-cinematic-dark font-bold mt-1">{formatPrice(parseFloat(product.revenue) || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-400 font-medium">No sales data yet.</div>
            )}
          </div>

          <div>
            <h3 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-12">Low Stock Alerts</h3>
            {low_stock_products && low_stock_products.length > 0 ? (
              <div className="flex flex-col border-t border-zinc-900">
                {low_stock_products.map((product) => (
                  <div key={product.id} className="flex items-center gap-6 py-6 border-b border-zinc-200 group">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-bold text-zinc-900 truncate">{product.name}</h4>
                      <p className="text-zinc-500 font-medium mt-1">{formatPrice(parseFloat(product.price))}</p>
                    </div>
                    <div className="text-right">
                       <p className={`text-2xl font-black ${product.quantity_available === 0 ? 'text-red-500' : 'text-orange-500'}`}>
                         {product.quantity_available} <span className="text-sm font-bold opacity-50 uppercase tracking-widest ml-1">Left</span>
                       </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-zinc-400 font-medium">All products are well stocked.</div>
            )}
          </div>
        </FadeInScroll>

        {/* RECENT ORDERS (Clean, Borderless Typography Layout) */}
        <FadeInScroll className="py-24">
          <div className="flex justify-between items-end mb-16">
             <h2 className="text-5xl font-extrabold tracking-tight text-zinc-900">Recent Orders</h2>
             <button onClick={() => navigate('/seller/orders')} className="hidden md:block text-cinematic-dark font-bold tracking-widest uppercase text-sm hover:opacity-70 transition-opacity">
               View Complete History →
             </button>
          </div>
          
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-5 gap-6 border-t-2 border-zinc-900 py-6">
                 <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs">Order</div>
                 <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs">Customer</div>
                 <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs">Amount</div>
                 <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs">Status</div>
                 <div className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs text-right">Date</div>
              </div>
              
              {/* Rows */}
              <div className="flex flex-col">
                {recent_orders && recent_orders.length > 0 ? recent_orders.map((order, i) => {
                  const statusMap = {
                    'pending_payment': 'Pending',
                    'payment_confirmed': 'Confirmed',
                    'processing': 'Processing',
                    'shipped': 'Shipped',
                    'delivered': 'Delivered',
                    'cancelled': 'Canceled',
                  };
                  const displayStatus = statusMap[order.status] || order.status;
                  
                  return (
                    <div key={order.id || i} className="grid grid-cols-5 gap-6 py-6 border-t border-zinc-200 hover:bg-zinc-50/50 transition-colors group cursor-pointer" onClick={() => navigate(`/seller/orders`)}>
                      <div className="text-zinc-500 font-mono text-sm self-center">#{order.order_number}</div>
                      <div className="font-bold text-zinc-900 self-center group-hover:text-cinematic-dark transition-colors">{order.first_name} {order.last_name}</div>
                      <div className="font-black text-zinc-900 text-lg self-center">{formatPrice(order.total_amount || order.seller_amount)}</div>
                      <div className="self-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                          displayStatus === 'Delivered' ? 'border-cinematic-dark text-cinematic-dark bg-cinematic-dark/10' :
                          displayStatus === 'Pending' ? 'border-yellow-500 text-yellow-600 bg-yellow-500/10' :
                          'border-blue-500 text-blue-600 bg-blue-500/10'
                        }`}>
                          {displayStatus}
                        </span>
                      </div>
                      <div className="text-zinc-500 font-medium text-sm self-center text-right">{formatDate(order.created_at)}</div>
                    </div>
                  );
                }) : (
                  <div className="py-12 border-t border-zinc-200 text-zinc-400 font-bold uppercase tracking-widest text-sm text-center">
                    No orders placed yet
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/seller/orders')} className="md:hidden mt-8 w-full text-center text-cinematic-dark font-bold tracking-widest uppercase text-sm hover:opacity-70 transition-opacity">
               View Complete History →
          </button>
        </FadeInScroll>

      </div>
    </CinematicDashboardLayout>
  );
}
