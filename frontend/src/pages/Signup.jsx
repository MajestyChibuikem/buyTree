import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sellerService } from '../services/api';
import CinematicAuthLayout from '../layouts/CinematicAuthLayout';

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState('customer'); // 'customer' | 'seller'

  // Shop branding state
  const shopSlug = searchParams.get('shopSlug');
  const [shop, setShop] = useState(null);

  // Fetch shop data if shopSlug is present
  useEffect(() => {
    if (shopSlug) {
      sellerService.getSellerBySlug(shopSlug)
        .then(res => setShop(res.data.seller))
        .catch(err => console.error('Error fetching shop:', err));
    }
  }, [shopSlug]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error on input change
  };

  const validateForm = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!/^0\d{10}$/.test(formData.phone)) {
      setError('Please enter a valid Nigerian phone number (e.g., 08012345678)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const { confirmPassword, ...signupData } = formData;

    // Add shop slug to signup data if present
    const finalSignupData = shopSlug
      ? { ...signupData, registeredViaShopSlug: shopSlug }
      : signupData;

    const result = await signup(finalSignupData);

    if (result.success) {
      // Get redirect parameter or determine default based on user role
      const redirectParam = searchParams.get('redirect');

      // Wait a bit for user data to be available
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (shopSlug) {
          // If signed up from shop, redirect to shop homepage
          navigate(`/shop/${shopSlug}`);
        } else if (redirectParam) {
          // Use redirect parameter if provided
          navigate(redirectParam);
        } else if (user.role === 'seller') {
          // Sellers go to dashboard
          navigate('/seller/dashboard');
        } else if (authMode === 'seller') {
          navigate('/become-seller');
        } else {
          // Buyers have no default page, stay on current page or go to orders
          navigate('/orders');
        }
      }, 100);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <CinematicAuthLayout 
      title={shop ? `Join ${shop.shop_name}.` : (authMode === 'seller' ? "Start Selling." : "Join buyTree.")}
      subtitle={shop ? "Create an account to track your orders and checkout faster." : (authMode === 'seller' ? "Create your white-label empire today. Free to start." : "Shop from thousands of independent sellers across Nigeria.")}
      imageSrc={shop?.shop_cover_url || (authMode === 'seller' ? "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" : "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80")}
    >
      <div>
        {!shop && (
          <div className="flex bg-zinc-900 p-1 rounded-lg mb-8 w-fit border border-zinc-800 relative z-20">
            <button 
              type="button"
              onClick={() => setAuthMode('customer')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${authMode === 'customer' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Customer
            </button>
            <button 
              type="button"
              onClick={() => setAuthMode('seller')}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${authMode === 'seller' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Seller
            </button>
          </div>
        )}
        {shop ? (
          <div className="mb-8">
            {shop.shop_logo_url && (
              <img
                src={shop.shop_logo_url}
                alt={shop.shop_name}
                className="h-16 w-16 mb-6 rounded-full object-cover border border-zinc-800"
              />
            )}
            <h2 className="text-3xl font-semibold text-white mb-2">
              Create account
            </h2>
            <p className="text-zinc-400 mb-6">
              Already have an account?{' '}
              <Link to={`/login?shopSlug=${shopSlug}`} className="text-cinematic-light hover:text-white transition-colors underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-white mb-3">
              Sign up
            </h2>
            <p className="text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="text-cinematic-light hover:text-white transition-colors underline-offset-4 hover:underline">
                Log in
              </Link>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                placeholder="08012345678"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-cinematic-light hover:bg-cinematic-light/90 text-zinc-950 font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cinematic-light focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </CinematicAuthLayout>
  );
}
