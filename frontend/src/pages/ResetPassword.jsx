import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import CinematicAuthLayout from '../layouts/CinematicAuthLayout';
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid reset link');
      setVerifying(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/password-reset/verify/${token}`
      );

      if (response.data.success) {
        setTokenValid(true);
        setUserEmail(response.data.data.email);
      } else {
        setError(response.data.message || 'Invalid or expired reset link');
      }
    } catch (err) {
      console.error('Token verification error:', err);
      setError(err.response?.data?.message || 'Invalid or expired reset link');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/password-reset/reset`,
        {
          token,
          newPassword: password,
        }
      );

      if (response.data.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (verifying) {
    return (
      <CinematicAuthLayout
        title="Verifying link..."
        subtitle="Please wait while we verify your secure reset link."
        imageSrc="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
      >
        <div className="flex flex-col items-center justify-center space-y-6 min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cinematic-light"></div>
          <p className="text-zinc-400">Verifying reset link...</p>
        </div>
      </CinematicAuthLayout>
    );
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <CinematicAuthLayout
        title="Link Expired."
        subtitle="For your security, password reset links expire after a short time."
        imageSrc="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
      >
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 mb-6">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">Invalid Link</h3>
          <p className="text-zinc-400 mb-8">{error || 'This password reset link is invalid or has expired.'}</p>

          <div className="space-y-4">
            <Link
              to="/forgot-password"
              className="block w-full py-3.5 px-4 bg-transparent border border-zinc-700 text-white hover:border-cinematic-light hover:text-cinematic-light rounded-lg transition-all font-medium"
            >
              Request New Link
            </Link>
            <Link
              to="/login"
              className="block w-full py-3.5 px-4 bg-cinematic-light hover:bg-cinematic-light/90 text-zinc-950 font-bold rounded-lg transition-all"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </CinematicAuthLayout>
    );
  }

  return (
    <CinematicAuthLayout
      title="Almost there."
      subtitle={`Create a new password for ${userEmail}.`}
      imageSrc="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
    >
      <div>
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-white mb-3">
            New Password
          </h2>
          <p className="text-zinc-400">
            Make sure it's at least 8 characters long.
          </p>
        </div>

        {success ? (
          // Success State
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-cinematic-light/10 mb-6">
              <svg className="h-8 w-8 text-cinematic-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-white mb-3">Password Updated</h3>
            
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Your password has been successfully reset. Redirecting to login in a moment...
            </p>

            <Link
              to="/login"
              className="block w-full py-3.5 px-4 bg-cinematic-light hover:bg-cinematic-light/90 text-zinc-950 font-bold rounded-lg transition-all text-center"
            >
              Go to Login Now
            </Link>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all pr-12"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-cinematic-light transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-cinematic-light focus:border-transparent text-white placeholder-zinc-600 transition-all"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-cinematic-light hover:bg-cinematic-light/90 text-zinc-950 font-bold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-cinematic-light disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center mt-4"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-zinc-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </div>
    </CinematicAuthLayout>
  );
}
