import { useState } from 'react';
import { reviewService } from '../../services/api';

export default function ReviewForm({ productId, orderId, productName, trackingToken, onReviewSubmitted, onCancel }) {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    comment: '',
    displayName: '',
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.createReview({
        productId,
        orderId,
        rating: formData.rating,
        title: formData.title,
        comment: formData.comment,
        trackingToken,
        displayName: formData.displayName,
      });

      // Reset form
      setFormData({ rating: 0, title: '', comment: '', displayName: '' });

      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderInteractiveStars = () => {
    return [...Array(5)].map((_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoveredRating || formData.rating);

      return (
        <button
          key={index}
          type="button"
          onClick={() => setFormData({ ...formData, rating: starValue })}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="focus:outline-none"
        >
          <svg
            className={`w-8 h-8 transition-colors ${
              isActive ? 'text-yellow-400' : 'text-gray-300'
            } hover:scale-110 transform`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      );
    });
  };

  return (
    <div className="bg-white p-6 border border-zinc-200 font-cinematic text-zinc-900">
      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 mb-6">
        Write a Review for {productName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
            Rating *
          </label>
          <div className="flex items-center gap-2">
            {renderInteractiveStars()}
            {formData.rating > 0 && (
              <span className="ml-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                {formData.rating} Stars
              </span>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
            Your Name (Optional)
          </label>
          <input
            type="text"
            id="displayName"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="e.g. Jane Doe"
            maxLength={100}
            className="w-full bg-zinc-50 border-b-2 border-zinc-200 hover:border-zinc-900 focus:border-zinc-900 focus:outline-none py-2 px-3 transition-colors text-sm font-medium"
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
            Review Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Sum up your experience in a few words"
            maxLength={200}
            className="w-full bg-zinc-50 border-b-2 border-zinc-200 hover:border-zinc-900 focus:border-zinc-900 focus:outline-none py-2 px-3 transition-colors text-sm font-medium"
          />
          <p className="mt-1 text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-right">{formData.title.length}/200</p>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
            Comments (Optional)
          </label>
          <textarea
            id="comment"
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            placeholder="Share your experience with this product..."
            rows={4}
            className="w-full bg-zinc-50 border border-zinc-200 hover:border-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none p-3 transition-all text-sm font-medium resize-none"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs font-bold text-red-600 uppercase tracking-widest">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-zinc-100">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-zinc-900 text-white py-3 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border-2 border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-900 transition-colors text-xs font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
