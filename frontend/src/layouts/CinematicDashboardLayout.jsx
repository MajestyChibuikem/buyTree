import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import Lenis from 'lenis';
import { useAuth } from '../context/AuthContext';

export default function CinematicDashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  // Default to open based on user preference
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize Lenis for buttery smooth scrolling across the dashboard
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Overview', path: '/seller/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'products', label: 'Products', path: '/seller/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'orders', label: 'Orders', path: '/seller/orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { id: 'analytics', label: 'Analytics', path: '/seller/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 font-cinematic selection:bg-cinematic-dark/20">
      
      {/* SIDEBAR */}
      <Motion.aside 
        initial={false}
        animate={{ width: sidebarCollapsed ? '80px' : '260px' }}
        className="fixed top-0 left-0 h-screen bg-white/80 backdrop-blur-xl border-r border-zinc-200 z-50 flex flex-col overflow-hidden shadow-sm"
      >
        {/* Header / Logo */}
        <div className="h-20 flex items-center px-6 border-b border-zinc-100 shrink-0">
          <div className="w-8 h-8 rounded-full bg-cinematic-dark flex items-center justify-center shrink-0 shadow-md">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>
            </svg>
          </div>
          {!sidebarCollapsed && (
            <Motion.span 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="ml-4 font-black text-xl tracking-tight text-cinematic-dark whitespace-nowrap"
            >
              BuyTree
            </Motion.span>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-8 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`relative flex items-center px-3 py-3 rounded-xl transition-all duration-300 group ${
                  isActive ? 'text-cinematic-dark bg-cinematic-dark/5' : 'text-zinc-500 hover:text-cinematic-dark hover:bg-zinc-50'
                }`}
              >
                {isActive && (
                  <Motion.div 
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-cinematic-dark/5 border border-cinematic-dark/10 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <svg className="w-5 h-5 shrink-0 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                {!sidebarCollapsed && (
                  <span className="ml-4 text-sm font-bold tracking-wide relative z-10 whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Toggle Collapse */}
        <div className="p-4 border-t border-zinc-100">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-3 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"
          >
            <svg className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cinematic-light/20 border border-cinematic-dark/10 flex items-center justify-center shrink-0">
               <span className="text-cinematic-dark font-bold text-sm">
                 {user?.firstName?.charAt(0) || 'U'}
               </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-bold text-zinc-800 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <button onClick={logout} className="text-xs font-bold text-zinc-400 hover:text-red-500 uppercase tracking-widest transition-colors mt-0.5 block">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </Motion.aside>

      {/* MAIN CONTENT */}
      <Motion.main 
        initial={false}
        animate={{ marginLeft: sidebarCollapsed ? '80px' : '260px' }}
        className="min-h-screen transition-all duration-300 relative z-10"
      >
        <div className="max-w-7xl mx-auto p-6 lg:p-12">
          {/* Light subtle background blob */}
          <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-br from-cinematic-light/10 to-transparent pointer-events-none -z-10" />
          
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </Motion.div>
        </div>
      </Motion.main>

    </div>
  );
}
