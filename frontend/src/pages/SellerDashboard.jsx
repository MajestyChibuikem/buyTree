import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { orderService, analyticsService, sellerService } from '../services/api';
import CinematicDashboardLayout from '../layouts/CinematicDashboardLayout';
import { motion as Motion } from 'framer-motion';

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

  const overview = analyticsData?.overview || {};
  const revenueByDay = analyticsData?.revenue_by_day || [];
  const recentOrders = analyticsData?.recent_orders || [];

  const salesData = revenueByDay.map(d => Number(d.orders_count) || 0);
  const revenueData = revenueByDay.map(d => Number(d.revenue) || 0);
  const totalSales = salesData.reduce((sum, val) => sum + val, 0);
  const totalRevenue = overview.total_revenue || 0;
  
  const stats = {
    revenue: totalRevenue,
    profit: (dashboardData?.revenue_last_30days || 0) * 0.95, // Seller takes 95%
    totalOrders: overview.total_orders || 0,
    orderGrowth: overview.order_growth_percentage || 0,
    revenueGrowth: overview.revenue_growth_percentage || 0,
  };

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-cinematic-dark/10 text-cinematic-dark border-cinematic-dark/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'in progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
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

  // Pure CSS Lightweight Chart Data prep
  const maxSales = Math.max(...salesData, 10);
  const maxRevenue = Math.max(...revenueData, 1000);

  return (
    <CinematicDashboardLayout>
      <div className="space-y-12">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-cinematic-dark mb-2">
              Dashboard
            </h1>
            <p className="text-zinc-500 text-lg font-medium">
              Welcome back to your overview.
            </p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-full bg-white border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 hover:text-cinematic-dark transition-colors shadow-sm">
              Last 30 Days
            </button>
            <button className="px-6 py-3 rounded-full bg-cinematic-dark text-white font-bold hover:bg-cinematic-dark/90 transition-colors shadow-md">
              Export Data
            </button>
          </div>
        </header>

        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: 'Total Revenue', 
              value: formatPrice(stats.revenue), 
              growth: stats.revenueGrowth, 
              icon: <svg className="w-6 h-6 text-cinematic-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 
            },
            { 
              label: 'Total Sales', 
              value: totalSales.toLocaleString(), 
              growth: stats.orderGrowth, 
              icon: <svg className="w-6 h-6 text-cinematic-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg> 
            },
            { 
              label: 'Total Orders', 
              value: stats.totalOrders.toLocaleString(), 
              growth: stats.orderGrowth, 
              icon: <svg className="w-6 h-6 text-cinematic-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> 
            },
            { 
              label: 'Monthly Profit', 
              value: formatPrice(stats.profit), 
              growth: stats.revenueGrowth, 
              icon: <svg className="w-6 h-6 text-cinematic-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> 
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
                <div className={`text-sm font-bold flex items-center gap-1 ${stat.growth >= 0 ? 'text-cinematic-dark' : 'text-red-500'}`}>
                  {stat.growth >= 0 ? '↗' : '↘'} {Math.abs(stat.growth).toFixed(1)}% 
                  <span className="text-zinc-400 font-medium ml-1">vs last month</span>
                </div>
              </div>
            </Motion.div>
          ))}
        </div>

        {/* CHARTS (Pure CSS/Tailwind Lightweight replacements) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Sales Bar Chart */}
          <div className="p-8 rounded-[32px] bg-white border border-zinc-200 shadow-sm">
            <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-8">Daily Sales Volume</h3>
            <div className="h-[250px] flex items-end gap-2 sm:gap-4 relative">
              {/* Y-axis grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-50">
                {[...Array(4)].map((_, i) => <div key={i} className="w-full border-t border-zinc-100" />)}
              </div>
              
              {/* Bars */}
              {salesData.length > 0 ? salesData.map((val, i) => {
                const heightPct = Math.max((val / maxSales) * 100, 5); // min 5% height
                return (
                  <div key={i} className="flex-1 flex justify-center group relative h-full items-end">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded transition-opacity">
                      {val}
                    </div>
                    {/* Bar */}
                    <Motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 1, delay: i * 0.05 }}
                      className="w-full max-w-[24px] bg-cinematic-dark rounded-t-lg shadow-sm group-hover:bg-cinematic-light transition-colors"
                    />
                  </div>
                );
              }) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium">No sales data</div>
              )}
            </div>
          </div>

          {/* Revenue Waterfall (Pure CSS) */}
          <div className="p-8 rounded-[32px] bg-white border border-zinc-200 shadow-sm">
             <h3 className="text-xl font-bold tracking-tight text-zinc-900 mb-8">Revenue Waterfall</h3>
             <div className="h-[250px] flex gap-1 sm:gap-2 relative">
                {revenueData.length > 0 ? revenueData.map((val, i) => {
                  const startPct = 100 - ((val / maxRevenue) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col group relative h-full">
                       {/* Tooltip */}
                       <div className="absolute top-0 opacity-0 group-hover:opacity-100 bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded transition-opacity z-10 w-max transform -translate-x-1/2 left-1/2">
                          {formatPrice(val)}
                       </div>
                       <div style={{ height: `${startPct}%` }} className="w-full" />
                       {/* Waterfall strip */}
                       <Motion.div 
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         transition={{ duration: 0.5, delay: i * 0.05 }}
                         className="w-full flex-1 bg-gradient-to-b from-cinematic-dark via-cinematic-dark/30 to-transparent rounded-t-full"
                       />
                    </div>
                  );
                }) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400 font-medium">No revenue data</div>
                )}
             </div>
          </div>

        </div>

        {/* RECENT ORDERS TABLE */}
        <div className="rounded-[32px] bg-white border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-zinc-900">Recent Orders</h3>
            <button className="text-cinematic-dark text-sm font-bold uppercase tracking-widest hover:text-cinematic-dark/80 transition-colors">
              View All
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-base whitespace-nowrap">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Customer</th>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Date</th>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Amount</th>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Order No.</th>
                  <th className="px-8 py-5 text-zinc-500 font-bold uppercase tracking-widest text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {recentOrders.length > 0 ? recentOrders.map((order, i) => {
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
                      <td className="px-8 py-6">
                        <div className="font-bold text-zinc-900 group-hover:text-cinematic-dark transition-colors">
                          {order.first_name} {order.last_name}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-zinc-500 font-medium">
                        {new Date(order.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-8 py-6 font-bold text-zinc-900">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="px-8 py-6 text-zinc-400 font-mono text-sm">
                        {order.order_number}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(displayStatus)}`}>
                          {displayStatus}
                        </span>
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