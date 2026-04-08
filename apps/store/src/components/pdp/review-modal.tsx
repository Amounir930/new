'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, Star, X } from 'lucide-react';
import { useCallback, useEffect, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { createProductReview } from '@/lib/api';

const ReviewFormSchema = z.object({
  rating: z
    .number()
    .min(1, 'Rating is required')
    .max(5, 'Rating cannot exceed 5'),
  title: z
    .string()
    .max(100, 'Title cannot exceed 100 characters')
    .optional(),
  content: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(2000, 'Review cannot exceed 2000 characters'),
});

type ReviewFormData = z.infer<typeof ReviewFormSchema>;

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  productId,
  tenantId,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // Reset form on modal open
  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setHoveredRating(0);
      setTitle('');
      setContent('');
      setFieldErrors({});
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async () => {
    const parsed = ReviewFormSchema.safeParse({
      rating,
      title: title.trim() || undefined,
      content,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const err of parsed.error.errors) {
        const field = err.path[0] as string;
        errors[field] = err.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      try {
        await createProductReview(tenantId, productId, {
          rating: parsed.data.rating,
          title: parsed.data.title,
          content: parsed.data.content,
        });

        toast.success('Review submitted successfully!');
        onSuccess?.();
        onClose();
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to submit review. Please try again.';
        toast.error(message);
      }
    });
  }, [rating, title, content, tenantId, productId, onSuccess, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isPending) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, isPending]
  );

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          onKeyDown={handleKeyDown}
          className="fixed left-1/2 top-1/2 z-[111] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-0 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <Dialog.Title className="sr-only">Write a Review</Dialog.Title>
          <Dialog.Description className="sr-only">
            Share your experience with this product
          </Dialog.Description>

          {/* Close button */}
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
            >
              <X className="h-5 w-5 text-gray-400" />
              <span className="sr-only">Close</span>
            </button>
          </Dialog.Close>

          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Write a Review
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Share your thoughts about this product with other customers.
            </p>

            <div className="space-y-5">
              {/* Rating */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {fieldErrors.rating && (
                  <p className="mt-2 text-xs text-red-500">
                    {fieldErrors.rating}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="review-title"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Title <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  maxLength={100}
                  className={`w-full rounded-xl border bg-gray-50 py-3 px-4 text-sm transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black ${
                    fieldErrors.title
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="review-content"
                  className="mb-1.5 block text-sm font-semibold text-gray-700"
                >
                  Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="review-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell us what you think about this product..."
                  rows={5}
                  maxLength={2000}
                  className={`w-full rounded-xl border bg-gray-50 py-3 px-4 text-sm transition-colors focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black resize-none ${
                    fieldErrors.content
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {fieldErrors.content ? (
                    <p className="text-xs text-red-500">
                      {fieldErrors.content}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-gray-400">
                    {content.length}/2000
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || rating === 0}
                className="w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white transition-all hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
