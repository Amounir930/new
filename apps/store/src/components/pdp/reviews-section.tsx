'use client';

import { useState } from 'react';
import { getProductReviews } from '@/lib/api';

interface Review {
  id: string;
  productId: string;
  customerId: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  isVerified: boolean;
  sentimentScore: string | null;
}

interface ReviewsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReviewsSectionProps {
  tenantId: string;
  productId: string;
  initialReviews?: {
    reviews: Review[];
    pagination: ReviewsPagination;
  };
  avgRating: number;
  reviewCount: number;
}

/**
 * ── REVIEWS SECTION ──
 *
 * Features:
 * 1. Server-side initial render (ISR)
 * 2. Client-side pagination
 * 3. Verified purchase badges
 * 4. Rating distribution display
 */
export function ReviewsSection({
  tenantId,
  productId,
  initialReviews,
  avgRating,
  reviewCount,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(
    initialReviews?.reviews || []
  );
  const [pagination, setPagination] = useState<ReviewsPagination>(
    initialReviews?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadPage = async (page: number) => {
    setIsLoading(true);
    try {
      const data = await getProductReviews(tenantId, productId, page, 10);
      if (data) {
        setReviews(data.reviews);
        setPagination(data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-20 max-w-4xl">
      <h2 className="text-2xl font-bold mb-8">Customer Reviews</h2>

      {/* Rating Summary */}
      <div className="flex items-center gap-8 mb-8 p-6 bg-gray-50 rounded-2xl">
        <div className="text-center">
          <div className="text-5xl font-black text-gray-900">
            {avgRating.toFixed(1)}
          </div>
          <div className="flex text-amber-400 my-2">
            {'★'.repeat(Math.round(avgRating))}
            {'☆'.repeat(5 - Math.round(avgRating))}
          </div>
          <div className="text-sm text-gray-500">{reviewCount} reviews</div>
        </div>

        {/* Rating Distribution (placeholder - would need backend support) */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-8">{stars}★</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${reviewCount > 0 ? 20 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {isLoading ? (
          // Loading skeleton
          [...Array(3)].map((_, i) => (
            <div
              key={`review-skeleton-${i}`}
              className="animate-pulse p-6 bg-gray-50 rounded-2xl"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/6" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button
            type="button"
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-sm text-gray-500">
            Page {currentPage} of {pagination.totalPages}
          </span>

          <button
            type="button"
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="p-6 bg-gray-50 rounded-2xl">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
          {review.customerId?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">
              {review.isVerified ? 'Verified Buyer' : 'Customer'}
            </span>
            {review.isVerified && (
              <svg
                className="w-4 h-4 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="flex text-amber-400 text-sm">
            {'★'.repeat(review.rating)}
            {'☆'.repeat(5 - review.rating)}
          </div>
          <span className="text-sm text-gray-500">{date}</span>
        </div>
      </div>

      {review.comment && (
        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}
