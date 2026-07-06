import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sellerService } from '../services/api';
import CinematicAuthLayout from '../layouts/CinematicAuthLayout';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      const redirectParam = searchParams.get('redirect');

      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (shopSlug) {
          navigate(`/shop/${shopSlug}`);
        } else if (redirectParam) {
          navigate(redirectParam);
        } else if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'seller') {
          navigate('/seller/dashboard');
        } else {
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
      title={shop ? `Welcome to ${shop.shop_name}.` : "Welcome Back."}
      subtitle={shop ? "Sign in to continue your shopping." : "Access your dashboard to manage your white-label empire."}
      imageSrc={shop?.shop_cover_url || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"}
    >
      <div>
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
              Sign in
            </h2>
            <p className="text-zinc-400 mb-6">
              New to {shop.shop_name}?{' '}
              <Link to={`/signup?shopSlug=${shopSlug}`} className="text-cinematic-light hover:text-white transition-colors underline-offset-4 hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        ) : (
          <div className="mb-10">
            <h2 className="text-4xl font-bold text-white mb-3">
              Log in
            </h2>
            <p className="text-zinc-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cinematic-light hover:text-white transition-colors underline-offset-4 hover:underline">
                Sign up
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
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                  Password
                </label>
                <Link to="/forgot-password" className="text-sm text-cinematic-light hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-cinematic-light hover:bg-cinematic-light/90 text-zinc-950 font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cinematic-light focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </CinematicAuthLayout>
  );
}
