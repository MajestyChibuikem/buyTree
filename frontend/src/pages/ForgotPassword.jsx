import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import CinematicAuthLayout from '../layouts/CinematicAuthLayout';
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/password-reset/request`,
        { email }
      );

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Failed to send reset email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CinematicAuthLayout
      title="Lost access?"
      subtitle="Enter your email to regain access to your dashboard."
      imageSrc="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
    >
      <div>
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-white mb-3">
            Reset Password
          </h2>
          <p className="text-zinc-400">
            Remembered it?{' '}
            <Link to="/login" className="text-cinematic-light hover:text-white transition-colors underline-offset-4 hover:underline">
              Log in instead
            </Link>
          </p>
        </div>

        {success ? (
          // Success State
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-cinematic-light/10 mb-6">
              <svg className="h-8 w-8 text-cinematic-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">Check Your Email</h3>
            
            <p className="text-zinc-400 mb-8 leading-relaxed">
              If an account exists with <strong className="text-white">{email}</strong>, you'll receive password reset instructions shortly.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="w-full py-3.5 px-4 bg-transparent border border-zinc-700 text-white hover:border-cinematic-light hover:text-cinematic-light rounded-lg transition-all font-medium"
              >
                Try Another Email
              </button>

              <Link
                to="/login"
                className="block w-full py-3.5 px-4 bg-cinematic-light hover:bg-cinematic-light/90 text-zinc-950 font-bold rounded-lg transition-all text-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-cinematic-light hover:bg-cinematic-light/90 text-zinc-950 font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cinematic-light disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </CinematicAuthLayout>
  );
}
