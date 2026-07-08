import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService, analyticsService, sellerService } from '../services/api';
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

export default function SellerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- API DATA ---
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashRes, analyticsRes, profileRes] = await Promise.all([
          orderService.getSellerDashboardSummary(),
          analyticsService.getSellerAnalytics(),
          sellerService.getSellerProfile(),
        ]);
        setDashboardData(dashRes.data);
        setAnalyticsData(analyticsRes.data);
        setSellerProfile(profileRes.data || profileRes.seller || profileRes);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price).replace('NGN', '₦');
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
            onClick={() => window.location.reload()}
            className="px-8 py-4 rounded-full bg-cinematic-dark text-white font-bold tracking-widest uppercase text-sm"
          >
            Retry Connection
          </button>
        </div>
      </CinematicDashboardLayout>
    );
  }

  const overview = analyticsData?.overview || {};
  const revenueByDay = analyticsData?.revenue_by_day || [];
  const recentOrders = analyticsData?.recent_orders || [];
  const lowStockProducts = analyticsData?.low_stock_products || [];

  // Calculate This Month (Last 30 Days) stats
  const totalOrders30d = revenueByDay.reduce((sum, d) => sum + (Number(d.orders_count) || 0), 0);
  const totalRevenue30d = revenueByDay.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);

  // Calculate This Week (Last 7 Days) stats
  const last7Days = revenueByDay.slice(-7);
  const totalRevenue7d = last7Days.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0);

  // Store Health stats
  const pendingOrders = overview.pending_orders || 0;
  const lowStockCount = lowStockProducts.length;

  return (
    <CinematicDashboardLayout>
      <div className="max-w-7xl mx-auto pb-32 overflow-hidden px-2 md:px-0">
        
        {/* HUGE HERO: THIS MONTH */}
        <div className="pt-12 pb-24 md:pb-32 border-b border-zinc-200">
          <Motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-sm mb-6"
          >
            {sellerProfile?.shop_name ? `${sellerProfile.shop_name} • ` : ''}This Month
          </Motion.p>
          <Motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-[64px] sm:text-[96px] md:text-[140px] font-black tracking-tighter leading-[0.9] text-cinematic-dark break-words"
          >
            {formatPrice(totalRevenue30d)}
          </Motion.h1>
          <Motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 1, delay: 0.5 }}
             className="mt-8 flex flex-col md:flex-row md:items-center gap-4 md:gap-8"
          >
             <div className="text-zinc-400 font-medium tracking-wide">
               Total sales revenue generated in the last 30 days.
             </div>
          </Motion.div>
        </div>

        {/* SECONDARY STATS (Editorial 3-column split) */}
        <FadeInScroll className="py-24 md:py-32 border-b border-zinc-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
             <div className="border-t-2 border-zinc-900 pt-8">
                 <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-4">Gross Revenue (This Week)</p>
                 <p className="text-5xl font-black text-zinc-900">{formatPrice(totalRevenue7d)}</p>
                 <p className="mt-4 text-sm font-bold text-zinc-500">Last 7 days</p>
             </div>
             <div className="border-t-2 border-zinc-900 pt-8">
                 <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-4">Total Sales (This Month)</p>
                 <p className="text-5xl font-black text-zinc-900">{formatPrice(totalRevenue30d)}</p>
                 <p className="mt-4 text-sm font-bold text-zinc-500">Last 30 days</p>
             </div>
             <div className="border-t-2 border-zinc-900 pt-8">
                 <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-4">Total Orders (This Month)</p>
                 <p className="text-5xl font-black text-zinc-900">{totalOrders30d.toLocaleString()}</p>
                 <p className="mt-4 text-sm font-bold text-zinc-500">Last 30 days</p>
             </div>
          </div>
        </FadeInScroll>

        {/* CHARTS / DATA REPS (Clear, Table-like Representation) */}
        <FadeInScroll className="py-24 md:py-32 border-b border-zinc-200">
          <h2 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-16">Recent Sales Volume</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-6">
              <h3 className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs border-b border-zinc-200 pb-4">Last 7 Days Revenue</h3>
              {last7Days.length > 0 ? last7Days.map((day, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="w-32 font-bold text-zinc-900">{formatDate(day.date).split(',')[0]}</div>
                  <div className="flex-1 mx-6 relative h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-cinematic-dark"
                      style={{ width: `${Math.max((Number(day.revenue) / Math.max(...last7Days.map(d => Number(d.revenue)), 1)) * 100, 2)}%` }}
                    />
                  </div>
                  <div className="w-32 text-right font-black text-zinc-900">{formatPrice(Number(day.revenue))}</div>
                </div>
              )) : (
                <div className="text-zinc-400 font-medium">No recent revenue data.</div>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs border-b border-zinc-200 pb-4">Last 7 Days Orders</h3>
              {last7Days.length > 0 ? last7Days.map((day, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="w-32 font-bold text-zinc-900">{formatDate(day.date).split(',')[0]}</div>
                  <div className="flex-1 mx-6 relative h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-zinc-900"
                      style={{ width: `${Math.max((Number(day.orders_count) / Math.max(...last7Days.map(d => Number(d.orders_count)), 1)) * 100, 2)}%` }}
                    />
                  </div>
                  <div className="w-32 text-right font-black text-zinc-900">{day.orders_count} orders</div>
                </div>
              )) : (
                <div className="text-zinc-400 font-medium">No recent orders data.</div>
              )}
            </div>
          </div>
        </FadeInScroll>

        {/* STORE HEALTH */}
        <div className="py-32 my-24 border-y border-zinc-200">
          <FadeInScroll>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
                <div>
                  <h2 className="text-5xl sm:text-6xl font-black tracking-tight mb-4 text-cinematic-dark">Store Health</h2>
                  <p className="text-zinc-500 text-xl font-light">Inventory and active order status.</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                 <div>
                    <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-6">Pending Orders</p>
                    <p className={`text-[100px] font-black leading-[0.9] tracking-tighter ${pendingOrders > 0 ? 'text-zinc-900' : 'text-zinc-300'}`}>
                      {pendingOrders}
                    </p>
                    <p className="mt-4 text-sm font-bold text-zinc-500">Orders awaiting processing</p>
                 </div>
                 <div>
                    <p className="text-zinc-500 font-bold tracking-[0.2em] uppercase text-xs mb-6">Low Stock Alerts</p>
                    <p className={`text-[100px] font-black leading-[0.9] tracking-tighter ${lowStockCount > 0 ? 'text-red-500' : 'text-zinc-300'}`}>
                      {lowStockCount}
                    </p>
                    <p className="mt-4 text-sm font-bold text-zinc-500">Products needing restock</p>
                 </div>
             </div>
          </FadeInScroll>
        </div>

        {/* RECENT ORDERS (Clean, Borderless Typography Layout) */}
        <FadeInScroll className="py-24">
          <div className="flex justify-between items-end mb-16">
             <h2 className="text-5xl font-extrabold tracking-tight text-zinc-900">Recent Orders</h2>
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
                {recentOrders && recentOrders.length > 0 ? recentOrders.map((order, i) => {
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
                    <div key={order.id || i} className="grid grid-cols-5 gap-6 py-6 border-t border-zinc-200 hover:bg-zinc-50/50 transition-colors group cursor-pointer">
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
        </FadeInScroll>

      </div>
    </CinematicDashboardLayout>
  );
}