import { useState, useEffect } from 'react';
import { favoriteService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function FavoriteButton({ productId, className = '' }) {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && productId) {
      checkFavoriteStatus();
    }
  }, [user, productId]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await favoriteService.checkFavorite(productId);
      setIsFavorited(response.data.isFavorited);
    } catch (error) {
      console.error('Check favorite error:', error);
    }
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please login to save favorites');
      return;
    }

    setLoading(true);
    try {
      if (isFavorited) {
        await favoriteService.removeFavorite(productId);
        setIsFavorited(false);
      } else {
        await favoriteService.addFavorite(productId);
        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      alert('Failed to update favorites');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Don't show favorite button if not logged in
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform disabled:opacity-50 ${className}`}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={`w-5 h-5 ${
          isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'
        } ${loading ? 'animate-pulse' : ''}`}
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
