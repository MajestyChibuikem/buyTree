import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function ComingSoon() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await login('majestychibuikem@gmail.com', 'majestychibuikem');
      navigate('/seller/dashboard');
    } catch (err) {
      alert('Demo login failed. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 14h-4v-1h4v1zm0-2h-4v-1h4v1zm1.5-4.59l-.83.83H14v2h-4v-2H9.33l-.83-.83C7.59 10.5 7 9.31 7 8c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.31-.59 2.5-1.5 3.41z"/>
              </svg>
              <span className="text-xl font-bold text-gray-900">BuyTree</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer">
                <span>Product</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer">
                <span>Solutions</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <span className="text-gray-600 hover:text-gray-900 cursor-pointer">Pricing</span>
              <span className="text-gray-600 hover:text-gray-900 cursor-pointer">Reviews</span>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  {user.role === 'seller' && (
                    <button
                      onClick={() => navigate('/seller/dashboard')}
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/orders')}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    My Orders
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={handleDemoLogin}
                    disabled={demoLoading}
                    className="text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                  >
                    {demoLoading ? 'Logging in...' : 'Use a Demo'}
                  </button>
                  <button
                    onClick={() => navigate('/become-seller')}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 font-medium transition-colors"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                <span className="text-gray-600">Product</span>
                <span className="text-gray-600">Solutions</span>
                <span className="text-gray-600">Pricing</span>
                <span className="text-gray-600">Reviews</span>
                <hr className="my-2" />
                {user ? (
                  <>
                    {user.role === 'seller' && (
                      <button onClick={() => navigate('/seller/dashboard')} className="text-left text-gray-600">
                        Dashboard
                      </button>
                    )}
                    <button onClick={() => navigate('/orders')} className="text-left text-gray-600">
                      My Orders
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => navigate('/login')} className="text-left text-gray-600">
                      Login
                    </button>
                    <button onClick={handleDemoLogin} disabled={demoLoading} className="text-left text-emerald-600 font-medium disabled:opacity-50">
                      {demoLoading ? 'Logging in...' : 'Use a Demo'}
                    </button>
                    <button onClick={() => navigate('/become-seller')} className="px-5 py-2.5 bg-emerald-600 text-white rounded-full font-medium w-fit">
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600 mb-8">
            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
            </svg>
            <span>We're Introducing New Intelligent Product Delivery</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Grow Your <span className="font-serif italic text-emerald-600">Business</span> With A
            <br className="hidden sm:block" /> Store Built For You
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            BuyTree helps sellers launch customizable online stores designed to showcase products and drive sales — all without any technical skills.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/become-seller')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 font-semibold text-lg transition-colors shadow-lg shadow-emerald-200"
          >
            Get Started
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Shadow/glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-100/50 to-transparent rounded-3xl blur-3xl -z-10"></div>

            {/* Dashboard image */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <img
                src="/images/dashboard-preview.png"
                alt="BuyTree Analytics Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-500 mb-8">Trusted by 1M+ entrepreneurs</p>

          {/* Logo strip */}
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            <span className="text-2xl font-bold text-gray-400">Logoipsum</span>
            <span className="text-2xl font-bold text-gray-400">Logoipsum</span>
            <span className="text-2xl font-serif italic text-gray-400">IPSUM</span>
            <span className="text-2xl font-bold tracking-wider text-gray-400">LOGOIPSUM</span>
            <span className="text-2xl font-light text-gray-400">Logoipsum</span>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left column - Text */}
            <div>
              <span className="inline-block px-4 py-1.5 border border-gray-300 rounded-full text-sm text-gray-600 mb-6">
                SERVICES
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Explore our comprehensive service offerings
              </h2>

              <p className="text-gray-500 mb-8">
                Focused on your unique needs, our team delivers solutions that blend deep industry knowledge and cutting-edge strategies to ensure lasting growth.
              </p>

              <button
                onClick={() => navigate('/become-seller')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 font-medium transition-colors"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>

            {/* Right column - Feature cards */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Card 1 - Store Setup */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Store Setup</h3>
                <p className="text-sm text-gray-500">
                  Crafting strategic plans that align with your goals.
                </p>
              </div>

              {/* Card 2 - Analytics */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-sm text-gray-500">
                  Track sales, orders, and customer insights in real-time.
                </p>
              </div>

              {/* Card 3 - Payment Processing */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment Processing</h3>
                <p className="text-sm text-gray-500">
                  Secure payments via Paystack, money hits your account instantly.
                </p>
              </div>

              {/* Card 4 - Order Management */}
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Management</h3>
                <p className="text-sm text-gray-500">
                  Manage orders, track fulfillment, and keep customers happy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2 14h-4v-1h4v1zm0-2h-4v-1h4v1zm1.5-4.59l-.83.83H14v2h-4v-2H9.33l-.83-.83C7.59 10.5 7 9.31 7 8c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.31-.59 2.5-1.5 3.41z"/>
              </svg>
              <span className="text-xl font-bold">BuyTree</span>
            </div>
            <p className="text-gray-400 text-sm">
              &copy; 2025 BuyTree. Your campus marketplace platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
