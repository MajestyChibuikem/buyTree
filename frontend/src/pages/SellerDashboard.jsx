import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService, analyticsService, sellerService } from '../services/api';
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
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

  const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-emerald-50 text-emerald-600';
      case 'pending': return 'bg-yellow-50 text-yellow-600';
      case 'in progress': return 'bg-blue-50 text-blue-600';
      case 'canceled': return 'bg-red-50 text-red-600';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  // --- DERIVED DATA FROM API ---
  const overview = analyticsData?.overview || {};
  const revenueByDay = analyticsData?.revenue_by_day || [];
  const recentOrders = analyticsData?.recent_orders || [];

  // Chart data from revenue_by_day
  const chartLabels = revenueByDay.map(d => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  });
  const salesData = revenueByDay.map(d => Number(d.orders_count) || 0);
  const revenueData = revenueByDay.map(d => Number(d.revenue) || 0);
  const totalSales = salesData.reduce((sum, val) => sum + val, 0);
  const totalRevenue = overview.total_revenue || 0;
  const tubeLimit = Math.max(...salesData, 10) + 5; // dynamic y-axis max

  // Stats
  const stats = {
    revenue: totalRevenue,
    profit: dashboardData?.revenue_last_30days || 0,
    totalOrders: overview.total_orders || 0,
    orderGrowth: overview.order_growth_percentage || 0,
    revenueGrowth: overview.revenue_growth_percentage || 0,
  };

  // Seller info
  const shopName = sellerProfile?.shop_name || 'My Store';
  const shopInitial = shopName.charAt(0).toUpperCase();
  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Seller';

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] text-[#111827] font-sans selection:bg-emerald-100">
      
      {/* --- LEFT SIDEBAR --- */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-800/10 transition-all duration-300 flex flex-col sticky top-0 h-screen overflow-hidden shrink-0`}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200/50">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/></svg>
          </div>
          {!sidebarCollapsed && <span className="font-black text-xl tracking-tight">BuyTree</span>}
        </div>

        {/* Search - Temnix inset pattern */}
        <div className="px-4 mb-4">
          <div className="relative group">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-300 group-focus-within:text-emerald-500 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </span>
            <input type="text" placeholder="Search" className="w-full bg-gray-50 border-none rounded-2xl py-2.5 pl-10 pr-12 text-[11px] font-black focus:ring-1 focus:ring-emerald-500 shadow-inner transition-all" />
            <span className="absolute right-3 top-2.5 text-[9px] text-gray-300 font-black bg-white px-1.5 py-0.5 rounded-md shadow-sm">⌘ F</span>
          </div>
        </div>

        {/* Unread chats - elevated card */}
        <div className="px-4 mb-6">
           <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl text-emerald-600 text-[11px] font-black cursor-pointer hover:shadow-md shadow-lg shadow-emerald-100/50 border border-emerald-100 transition-all active:scale-95">
             <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-black shadow-lg shadow-emerald-200/50">5</div>
             <span className="flex-1">Unread chats</span>
             <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
           </div>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t-2 border-gray-800/10 mb-4"></div>

        {/* Navigation - inset container with elevated active */}
        <nav className="flex-1 px-4">
          <p className="text-[10px] font-black text-gray-300 uppercase px-3 mb-3 tracking-[0.2em]">General</p>
          <div className="bg-gray-50 p-1.5 rounded-2xl shadow-inner space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', path: '/seller/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'analytics', label: 'Seller Analytics', path: '/seller/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'products', label: 'Products', path: '/seller/dashboard', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'orders', label: 'Orders', path: '/seller/orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
              { id: 'order-management', label: 'Order Management', path: '/seller/order-management', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'settings', label: 'Settings', path: '/seller/dashboard', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
              <button key={item.id} onClick={() => navigate(item.path)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-white text-emerald-600 shadow-lg shadow-gray-200/50' : 'text-gray-400 hover:bg-white hover:text-gray-500'}`}>
                 <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                 {!sidebarCollapsed && <span className="text-[11px] font-black">{item.label}</span>}
              </button>
              );
            })}
          </div>
        </nav>

        {/* Divider */}
        <div className="mx-6 border-t-2 border-gray-800/10 my-4"></div>

        {/* My Stores */}
        <div className="px-4 py-2">
            <p className="text-[10px] font-black text-gray-300 uppercase px-3 mb-3 tracking-[0.2em]">My Stores</p>
            <div className="bg-gray-50 p-1.5 rounded-2xl shadow-inner">
              <div className="flex items-center gap-3 p-2.5 bg-white rounded-xl shadow-lg shadow-gray-200/50 cursor-pointer transition-all hover:shadow-md active:scale-95 group">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg shadow-blue-200/50 group-hover:scale-105 transition-transform">{shopInitial}</div>
                <span className="text-[11px] font-black flex-1 truncate">{shopName}</span>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t-2 border-gray-800/10 my-4"></div>

        {/* Footer actions - inset container */}
        <div className="px-4 py-2 mt-auto">
            <div className="bg-gray-50 p-1.5 rounded-2xl shadow-inner space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:bg-white hover:text-emerald-600 hover:shadow-lg hover:shadow-gray-200/50 rounded-xl text-[11px] font-black transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                {!sidebarCollapsed && <span>Feedback</span>}
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:bg-white hover:text-emerald-600 hover:shadow-lg hover:shadow-gray-200/50 rounded-xl text-[11px] font-black transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                {!sidebarCollapsed && <span>Help & Support</span>}
              </button>
            </div>
        </div>

        {/* User profile */}
        <div className="p-4 border-t border-gray-800/10">
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl shadow-inner cursor-pointer group hover:bg-gray-100 transition-all">
             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=FEF3C7&color=D97706`} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" alt="" />
             {!sidebarCollapsed && (
               <div className="flex-1 min-w-0">
                 <p className="text-[11px] font-black truncate text-gray-900 leading-tight">{userName}</p>
                 <p className="text-[9px] text-gray-400 truncate font-black uppercase tracking-[0.1em]">Seller Profile</p>
               </div>
             )}
             <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M7 10l5 5 5-5" /></svg>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <button className="p-2 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 shadow-sm transition-all"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 19l-7-7 7-7" /></svg></button>
                 <button className="p-2 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 shadow-sm transition-all"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg></button>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-gray-400 tracking-widest uppercase ml-4">
                 <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                 <span>Overview</span>
                 <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M9 5l7 7-7 7" /></svg>
                 <span className="text-gray-900 font-black tracking-tighter">Dashboard</span>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="relative group">
                <input type="text" placeholder="Search" className="bg-white border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm w-[400px] shadow-sm focus:ring-1 focus:ring-emerald-500 transition-all font-semibold" />
                <svg className="w-5 h-5 absolute left-3.5 top-2.5 text-gray-300 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span className="absolute right-4 top-3 text-[10px] text-gray-300 font-black">⌘ F</span>
              </div>
              <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                <div className="w-9 h-9 rounded-full bg-yellow-100 border-2 border-white flex items-center justify-center font-black text-xs text-yellow-600 shadow-md">{userName.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
           </div>
        </header>

        <section className="space-y-10">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-black tracking-tighter text-[#111827]">Overview</h1>
            <div className="flex gap-2">
              <div className="bg-white px-5 py-2.5 rounded-2xl border border-gray-100 text-[11px] font-black text-gray-500 shadow-sm flex items-center gap-3 cursor-pointer hover:border-emerald-200 transition-all">
                06 Oct 2025 - 06 Nov 2025 
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="bg-white px-5 py-2.5 rounded-2xl border border-gray-100 text-[11px] font-black text-gray-500 shadow-sm flex items-center gap-3 cursor-pointer hover:border-emerald-200 transition-all">
                Last 30 days 
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
              <button className="bg-white px-5 py-2.5 rounded-2xl border border-gray-100 text-[11px] font-black text-gray-500 shadow-sm flex items-center gap-3 hover:bg-gray-50 transition-all active:scale-95">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> 
                Export
              </button>
            </div>
          </div>

          {/* --- STATS CARDS --- */}
          <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Revenue', value: formatPrice(stats.revenue), growth: `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth.toFixed(0)}%`, negative: stats.revenueGrowth < 0, color: 'blue', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Total Sales', value: totalSales.toLocaleString(), growth: `${stats.orderGrowth >= 0 ? '+' : ''}${stats.orderGrowth.toFixed(0)}%`, negative: stats.orderGrowth < 0, color: 'indigo', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
              { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), growth: `${stats.orderGrowth >= 0 ? '+' : ''}${stats.orderGrowth.toFixed(0)}%`, negative: stats.orderGrowth < 0, color: 'emerald', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { label: 'Profit', value: formatPrice(stats.profit), growth: `${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth.toFixed(0)}%`, negative: stats.revenueGrowth < 0, color: 'emerald', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-7 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 hover:shadow-lg transition-all">
                <div className="flex justify-between items-center mb-6">
                  <div className={`w-11 h-11 rounded-2xl bg-gray-50 group-hover:bg-${stat.color === 'emerald' ? 'emerald' : stat.color}-50 flex items-center justify-center text-gray-400 group-hover:text-${stat.color === 'emerald' ? 'emerald' : stat.color}-500 transition-all`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d={stat.icon} /></svg>
                  </div>
                  <svg className="w-5 h-5 text-gray-100 hover:text-gray-300 transition-colors cursor-help" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" /></svg>
                </div>
                <p className="text-[11px] uppercase font-black text-gray-300 mb-1.5 tracking-widest">{stat.label}</p>
                <div className="flex items-baseline gap-2.5">
                  <h2 className="text-3xl font-black tracking-tighter text-[#111827]">{stat.value}</h2>
                  <span className={`text-[11px] font-black ${stat.negative ? 'text-red-400' : 'text-emerald-400'}`}>
                    {stat.growth} 
                    <span className="text-gray-200 font-bold lowercase ml-1">from last month</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* --- MAIN CHARTS SECTION --- */}
          <div className="grid grid-cols-12 gap-8">
            
            {/* TOTAL SALES BAR CHART (Liquid Tube with Notebook Lines) */}
            <div className="col-span-7 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[11px] uppercase font-black text-gray-300 mb-1.5 tracking-widest">Total Sales</p>
                  <h3 className="text-4xl font-black tracking-tighter text-[#111827]">
                    {totalSales.toLocaleString()}
                    <span className={`text-xs font-black ml-3 ${stats.orderGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.orderGrowth >= 0 ? '+' : ''}{stats.orderGrowth.toFixed(1)}% <span className="text-gray-200 font-bold lowercase">from last month</span></span>
                  </h3>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-xl text-[11px] font-black text-gray-500 flex items-center gap-2 cursor-pointer shadow-inner">
                  Last 30 days <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
              </div>
              
              <div className="h-[300px] relative">
                {/* Exercise Book Lines - positioned to not overlap axes */}
                <div className="absolute top-[10px] bottom-[40px] left-[45px] right-0 flex flex-col justify-between pointer-events-none opacity-[0.06]">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full border-t border-gray-800"></div>
                  ))}
                </div>

                {/* Skeleton tubes (background) */}
                <div className="absolute inset-0">
                  <BarChart
                    series={[
                      { data: Array(salesData.length).fill(tubeLimit), color: '#E5E7EB', id: 'skeleton' }
                    ]}
                    xAxis={[{ data: chartLabels, scaleType: 'band', categoryGapRatio: 0.65 }]}
                    yAxis={[{ min: 0, max: 200 }]}
                    height={300}
                    margin={{ top: 10, bottom: 40, left: 45, right: 10 }}
                    slotProps={{ legend: { hidden: true } }}
                    borderRadius={50}
                    sx={{
                      '& .MuiBarElement-root': { opacity: 0.3 },
                      '& .MuiChartsAxis-root': { display: 'none' }
                    }}
                  />
                </div>

                {/* Liquid bars (foreground) */}
                <div className="absolute inset-0">
                  <BarChart
                    series={[
                      { data: salesData, color: '#10B981', id: 'liquid' }
                    ]}
                    xAxis={[{ data: chartLabels, scaleType: 'band', categoryGapRatio: 0.65 }]}
                    yAxis={[{ min: 0, max: 200 }]}
                    height={300}
                    margin={{ top: 10, bottom: 40, left: 45, right: 10 }}
                    slotProps={{ legend: { hidden: true } }}
                    borderRadius={50}
                    sx={{
                      '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': { fontSize: 10, fill: '#9CA3AF', fontWeight: 700 },
                      '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': { fontSize: 10, fill: '#9CA3AF', fontWeight: 700 },
                      '& .MuiChartsAxis-bottom .MuiChartsAxis-line': { display: 'none' },
                      '& .MuiChartsAxis-bottom .MuiChartsAxis-tick': { display: 'none' },
                      '& .MuiChartsAxis-left .MuiChartsAxis-line': { display: 'none' },
                      '& .MuiChartsAxis-left .MuiChartsAxis-tick': { display: 'none' }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* TOTAL REVENUE LINE CHART (Waterfall Curtain Effect) */}
            <div className="col-span-5 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="mb-8">
                <p className="text-[11px] uppercase font-black text-gray-300 mb-1.5 tracking-widest">Total Revenue</p>
                <h3 className="text-4xl font-black tracking-tighter text-[#111827]">
                  {formatPrice(totalRevenue)}
                  <span className={`text-xs font-black ml-3 ${stats.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% <span className="text-gray-200 font-bold lowercase">from last month</span></span>
                </h3>
              </div>

              <div className="h-[260px] relative">
                {/* Waterfall curtain strips - dropping down from each point */}
                <div className="absolute inset-0 flex justify-between px-[10px] pt-[10px] pb-[25px] pointer-events-none">
                  {revenueData.map((val, i) => {
                    const maxVal = Math.max(...revenueData, 10) * 1.2;
                    const pointPosition = (val / maxVal) * 100; // where the point is (from top)
                    const dropHeight = 100 - pointPosition; // height of waterfall below the point
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center" style={{ paddingTop: `${100 - pointPosition}%` }}>
                        <div
                          className="w-[3px] rounded-b-full"
                          style={{
                            height: `${dropHeight}%`,
                            background: `linear-gradient(to bottom, #10B981 0%, rgba(16, 185, 129, 0.4) 30%, rgba(16, 185, 129, 0.1) 70%, rgba(16, 185, 129, 0.02) 100%)`,
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <LineChart
                  series={[{
                    data: revenueData.length > 0 ? revenueData : [0],
                    color: '#10B981',
                    area: true,
                    strokeWidth: 4,
                    showMark: true,
                  }]}
                  xAxis={[{ data: revenueData.length > 0 ? revenueData.map((_, i) => i + 1) : [1], scaleType: 'point' }]}
                  height={260}
                  margin={{ top: 10, bottom: 25, left: 10, right: 10 }}
                  sx={{
                    '& .MuiLineElement-root': { strokeWidth: 4, filter: 'drop-shadow(0px 8px 12px rgba(16, 185, 129, 0.3))' },
                    '& .MuiAreaElement-root': { fill: 'url(#waterfallGradient)' },
                    '& .MuiMarkElement-root': { fill: '#10B981', stroke: '#fff', strokeWidth: 2, r: 5 },
                    '& .MuiChartsAxis-root': { display: 'none' }
                  }}
                />
                <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                  <defs>
                    <linearGradient id="waterfallGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                      <stop offset="40%" stopColor="#10B981" stopOpacity="0.2" />
                      <stop offset="70%" stopColor="#10B981" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* --- TABLE SECTION (FULL REPRODUCTION) --- */}
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-gray-50 flex items-center justify-between">
               <h2 className="text-2xl font-black tracking-tighter">Last Sales</h2>
               <div className="flex items-center gap-6">
                  <button className="text-xs font-black text-emerald-500 flex items-center gap-2.5 group">
                    <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> 
                    View all
                  </button>
                  <div className="w-px h-6 bg-gray-100"></div>
                  <div className="bg-gray-50 rounded-xl px-4 py-2 text-[11px] font-black text-gray-500 flex items-center gap-2.5 cursor-pointer shadow-inner">
                    Last 30 days <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  <button className="bg-white border border-gray-100 rounded-xl px-5 py-2 text-[11px] font-black text-gray-500 shadow-sm flex items-center gap-2.5 hover:bg-gray-50 transition-all active:scale-95">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> 
                    Export
                  </button>
               </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-gray-50 px-8">
               {['All Sales', 'Completed', 'In Progress', 'Pending Approval', 'Canceled'].map((tab, i) => {
                 const id = tab.toLowerCase().replace(' ', '');
                 const isActive = activeTab === id || (id === 'allsales' && activeTab === 'all');
                 return (
                  <button key={i} onClick={() => setActiveTab(id === 'allsales' ? 'all' : id)} className={`px-5 py-6 text-[11px] font-black transition-all relative tracking-widest uppercase ${isActive ? 'text-emerald-500' : 'text-gray-300 hover:text-gray-500'}`}>
                      {tab}
                      {tab === 'Pending Approval' && <span className="ml-2.5 bg-[#111827] text-white px-2 py-0.5 rounded-lg text-[10px] shadow-sm">3</span>}
                      {isActive && <div className="absolute bottom-0 left-5 right-5 h-0.5 bg-emerald-500 rounded-full shadow-[0_-2px_6px_rgba(16,185,129,0.3)]"></div>}
                  </button>
                 )
               })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                 <thead>
                    <tr className="text-gray-300 font-black tracking-[0.2em] uppercase border-b border-gray-50">
                       <th className="px-10 py-6 shrink-0 w-10"><input type="checkbox" className="rounded-md border-gray-200 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 w-4 h-4 cursor-pointer" /></th>
                       <th className="px-5 py-6 font-black">Client Name</th>
                       <th className="px-5 py-6 font-black">Date</th>
                       <th className="px-5 py-6 font-black">Total</th>
                       <th className="px-5 py-6 font-black">Order No.</th>
                       <th className="px-5 py-6 font-black">Seller Amount</th>
                       <th className="px-5 py-6 font-black">Raw Status</th>
                       <th className="px-5 py-6 font-black text-center">Status</th>
                       <th className="px-5 py-6"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
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
                        <tr key={order.id || i} className="hover:bg-[#F9FAFB]/50 transition-colors group cursor-pointer">
                          <td className="px-10 py-6"><input type="checkbox" className="rounded-md border-gray-200 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 w-4 h-4 cursor-pointer" readOnly /></td>
                          <td className="px-5 py-6 font-black text-[#111827]">{order.first_name} {order.last_name}</td>
                          <td className="px-5 py-6 font-bold text-gray-300">{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="px-5 py-6 font-black text-[#111827]">{formatPrice(order.total_amount)}</td>
                          <td className="px-5 py-6 font-bold text-gray-300">{order.order_number}</td>
                          <td className="px-5 py-6 font-bold text-gray-300">{formatPrice(order.seller_amount)}</td>
                          <td className="px-5 py-6 font-black text-[#111827]">{order.status}</td>
                          <td className="px-5 py-6 flex justify-center">
                            <span className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full font-black tracking-tight shadow-sm ${getStatusStyle(displayStatus)}`}>
                               <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${displayStatus === 'Completed' ? 'bg-emerald-500' : displayStatus === 'Pending' ? 'bg-yellow-500' : displayStatus === 'Canceled' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                               {displayStatus}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <button className="text-gray-200 hover:text-emerald-500 transition-all scale-150"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg></button>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="9" className="px-10 py-12 text-center text-gray-300 font-black text-[11px] uppercase tracking-widest">No orders yet</td>
                      </tr>
                    )}
                 </tbody>
              </table>
            </div>
            
            <div className="p-8 flex items-center justify-end gap-1.5 border-t border-gray-50 bg-gray-50/20">
               <button className="p-2 border border-gray-100 rounded-xl text-gray-300 hover:text-emerald-500 hover:bg-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
               <button className="p-2 border border-gray-100 rounded-xl text-gray-300 hover:text-emerald-500 hover:bg-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 19l-7-7 7-7" /></svg></button>
               <button className="p-2 border border-gray-100 rounded-xl text-gray-300 hover:text-emerald-500 hover:bg-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg></button>
               <button className="p-2 border border-gray-100 rounded-xl text-gray-300 hover:text-emerald-500 hover:bg-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M13 5l7 7-7 7m-8 0l7 7-7 7" /></svg></button>
            </div>
          </div>
        </section>
      </main>

      {/* --- RIGHT SIDEBAR --- */}
      <aside className="w-[400px] p-8 space-y-10 h-screen sticky top-0 overflow-y-auto hidden xl:block shrink-0 bg-[#F9FAFB]">
        
        {/* UPDATES CARD */}
        <div className="bg-white rounded-[40px] border border-gray-800/10 p-10 shadow-sm relative overflow-hidden group">
           <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black tracking-tighter">Updates</h2>
              <button className="text-emerald-500 font-black text-[11px] flex items-center gap-2 uppercase tracking-[0.1em]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                View all
              </button>
           </div>

           <div className="flex bg-gray-50 p-1.5 rounded-2xl gap-1 mb-8 shadow-inner">
              <button className="flex-1 bg-white text-[#111827] py-2.5 rounded-xl text-[11px] font-black shadow-lg shadow-gray-200/50 transition-all active:scale-95">Today</button>
              <button className="flex-1 text-gray-400 py-2.5 rounded-xl text-[11px] font-black hover:bg-white hover:text-gray-500 transition-all">Yesterday</button>
              <button className="flex-1 text-gray-400 py-2.5 rounded-xl text-[11px] font-black hover:bg-white hover:text-gray-500 transition-all">This week</button>
           </div>

           <div className="relative mb-10 group">
              <input type="text" placeholder="Search activities" className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 text-[11px] font-black focus:ring-1 focus:ring-emerald-500 shadow-inner" />
              <svg className="w-5 h-5 absolute left-4 top-3 text-gray-300 group-focus-within:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           </div>

           <div className="space-y-6">
              {/* Activities count with big number */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-emerald-500">4</span>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">New activities today</span>
              </div>

              {/* Thick dark divider line */}
              <div className="mx-4 border-t-2 border-gray-800/20 my-6"></div>

              {[
                { title: 'New Product Order', desc: 'Order placed NO.398H67 accepted', time: '11:20am', color: 'bg-emerald-50', icon: '📦' },
                { title: 'Customer Review', desc: 'Order placed NO.398H67 accepted', time: '09:24am', color: 'bg-yellow-50', icon: '👍' },
                { title: 'Product Removed', desc: 'You removed product NO. 4456T8', time: '07:33am', color: 'bg-red-50', icon: '🗑️' },
                { title: 'New Product Added', desc: 'You added product NO. 4456T8', time: '07:12am', color: 'bg-blue-50', icon: '➕' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-5 group/item cursor-pointer">
                   <div className={`w-12 h-12 rounded-[18px] ${activity.color} flex items-center justify-center text-xl shrink-0 transition-all group-hover/item:scale-110 shadow-sm`}>{activity.icon}</div>
                   <div className="flex-1 pb-6">
                      <div className="flex justify-between items-start mb-1">
                         <h4 className="text-[13px] font-black leading-tight text-gray-900">{activity.title}</h4>
                         <span className="text-[10px] text-gray-300 font-bold uppercase tracking-tight shrink-0">{activity.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 font-bold leading-relaxed">{activity.desc}</p>
                      {/* Thick dark divider line between activities */}
                      {i < 3 && <div className="mx-0 border-t-2 border-gray-800/10 mt-6"></div>}
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* STORE HEALTH SECTION */}
        <div className="space-y-6">
           {/* Header outside the card */}
           <div className="flex justify-between items-center px-2">
              <h2 className="text-2xl font-black tracking-tighter">Store Health</h2>
              <button className="text-[#111827] font-black text-[11px] flex items-center gap-2 uppercase tracking-[0.1em] group active:scale-95">
                <svg className="w-4 h-4 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                View
              </button>
           </div>

           {/* Card with content */}
           <div className="bg-white rounded-[40px] border border-gray-800/10 p-10 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-5 mb-10 p-3 bg-gray-50/50 rounded-3xl border border-gray-800/10">
                 <div className="w-14 h-14 bg-blue-600 rounded-[22px] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-200 border-2 border-white ring-4 ring-blue-50/50">{shopInitial}</div>
                 <div className="flex-1">
                   <h4 className="font-black text-base text-gray-900 tracking-tight">{shopName}</h4>
                   <p className="text-[11px] text-gray-400 font-bold tracking-tight">{sellerProfile?.shop_description?.slice(0, 30) || 'Your store'}</p>
                 </div>
                 <button className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-300 hover:text-emerald-500">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                 </button>
              </div>

              {/* Thick dark divider */}
              <div className="mx-4 border-t-2 border-gray-800/15 mb-8"></div>

              <h3 className="text-6xl font-black tracking-tighter text-[#111827] mb-8 flex items-center gap-4">
                92%
                <span className="text-xs text-emerald-400 font-black bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Excellent</span>
              </h3>

              {/* Thick dark divider */}
              <div className="mx-4 border-t-2 border-gray-800/15 mb-8"></div>

              {/* CAPSULE ROUNDED MINI CHART (Surface Tension look) */}
              <div className="flex items-end gap-2 h-24 mb-8 bg-gray-50/30 p-4 rounded-3xl border border-gray-800/10">
                 {[20, 30, 25, 45, 55, 65, 80, 95, 100, 90, 85].map((h, i) => (
                   <div key={i} className="flex-1 bg-emerald-400 rounded-full shadow-lg shadow-emerald-200/50 hover:bg-emerald-500 transition-colors cursor-pointer" style={{ height: `${h}%` }}></div>
                 ))}
              </div>

              {/* Thick dark divider */}
              <div className="mx-4 border-t-2 border-gray-800/15 mb-8"></div>

              <div className="bg-emerald-50 text-emerald-500 rounded-2xl p-4 flex items-center gap-3 text-[12px] font-black shadow-sm group border border-emerald-100/50">
                 <svg className="w-5 h-5 shrink-0 group-hover:scale-125 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                 <span className="tracking-tight">Your store is very healthy</span>
              </div>
           </div>
        </div>
      </aside>
    </div>
  );
}