import { useState, useEffect } from 'react';
import { reviewService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ReviewList({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingBreakdown, setRatingBreakdown] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({ rating: '', sort: 'recent' });

  useEffect(() => {
    fetchReviews();
  }, [productId, filters, pagination.page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: 10,
        ...filters,
      };

      const response = await reviewService.getProductReviews(productId, params);
      setReviews(response.data.reviews);
      setPagination(response.data.pagination);
      setRatingBreakdown(response.data.ratingBreakdown);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId) => {
    if (!user) {
      alert('Please login to mark reviews as helpful');
      return;
    }

    try {
      await reviewService.markReviewHelpful(reviewId);
      // Refresh reviews
      fetchReviews();
    } catch (error) {
      console.error('Failed to mark review as helpful:', error);
      alert('Failed to mark review as helpful');
    }
  };

  const handleRatingFilter = (rating) => {
    setFilters({ ...filters, rating: rating === filters.rating ? '' : rating });
    setPagination({ ...pagination, page: 1 });
  };

  const handleSortChange = (sort) => {
    setFilters({ ...filters, sort });
    setPagination({ ...pagination, page: 1 });
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const totalReviews = ratingBreakdown.reduce((sum, item) => sum + parseInt(item.count), 0);
  const averageRating = totalReviews > 0
    ? (ratingBreakdown.reduce((sum, item) => sum + (parseInt(item.rating) * parseInt(item.count)), 0) / totalReviews).toFixed(1)
    : 0;

  if (loading && reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Reviews</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Average Rating */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">{averageRating}</div>
              <div className="flex items-center justify-center my-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-sm text-gray-600">{totalReviews} reviews</p>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingBreakdown.find((r) => parseInt(r.rating) === rating)?.count || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

              return (
                <button
                  key={rating}
                  onClick={() => handleRatingFilter(rating.toString())}
                  className={`flex items-center gap-2 w-full hover:bg-gray-50 p-2 rounded ${
                    filters.rating === rating.toString() ? 'bg-green-50' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-gray-700 w-12">{rating} star</span>
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <select
            value={filters.sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>

          {filters.rating && (
            <button
              onClick={() => handleRatingFilter(filters.rating)}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1"
            >
              {filters.rating} stars
              <span className="font-bold">×</span>
            </button>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {review.first_name} {review.last_name}
                    </span>
                    {review.is_verified_purchase && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    {review.title && (
                      <span className="font-medium text-gray-900">{review.title}</span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Review Content */}
              {review.comment && (
                <p className="text-gray-700 mb-3">{review.comment}</p>
              )}

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Review ${index + 1}`}
                      className="w-24 h-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}

              {/* Seller Response */}
              {review.seller_response && (
                <div className="mt-4 ml-6 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">Seller Response</span>
                    <span className="text-sm text-gray-500">
                      {new Date(review.seller_response_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.seller_response}</p>
                </div>
              )}

              {/* Helpful Button */}
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() => handleMarkHelpful(review.id)}
                  className={`flex items-center gap-1 text-sm ${
                    review.marked_helpful_by_user
                      ? 'text-green-600 font-medium'
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                  disabled={!user}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  Helpful ({review.helpful_count})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
