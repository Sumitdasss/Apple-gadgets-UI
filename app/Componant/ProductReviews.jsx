
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createPortal } from "react-dom";

import {
  Star,
  X,
  ThumbsUp,
  MessageCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";

const API_BASE =
  "http://localhost:4000";

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

function formatReviewDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StarRow({ rating = 0, size = 16, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((number) => (
        <Star
          key={number}
          size={size}
          className={
            number <= Math.round(rating)
              ? "fill-orange-500 text-orange-500"
              : "text-orange-300"
          }
        />
      ))}
    </div>
  );
}

function RatingBars({ counts, total }) {
  return (
    <div className="flex min-w-[160px] flex-col gap-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = counts[star] || 0;
        const percentage =
          total > 0 ? (count / total) * 100 : 0;

        return (
          <div
            key={star}
            className="flex items-center gap-2 text-[13px]"
          >
            <span className="w-3 text-gray-600">{star}</span>

            <Star
              size={12}
              className="fill-orange-500 text-orange-500"
            />

            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-orange-500 transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <span className="w-5 text-right text-gray-500">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function WriteReviewModal({
  product,
  open,
  onClose,
  onSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset the form when the modal opens.
  useEffect(() => {
    if (!open) return;

    setRating(0);
    setHoverRating(0);
    setName("");
    setReview("");
    setImages([]);
    setPreviews([]);
    setError("");
    setSubmitting(false);
  }, [open]);

  // Lock background scrolling while the modal is open.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Release object URLs when previews change or the modal unmounts.
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  if (!open || !product || typeof document === "undefined") {
    return null;
  }

  const productImage =
    (Array.isArray(product.images) && product.images[0]) ||
    product.image ||
    "";

  const productImageUrl =
    typeof productImage === "string"
      ? productImage
      : productImage?.url || "";

  const handleFiles = (fileList) => {
    const selected = Array.from(fileList || []);
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (selected.length > 5) {
      setError("You can upload a maximum of 5 images.");
      return;
    }

    const validFiles = selected.filter(
      (file) =>
        allowedTypes.includes(file.type) &&
        file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== selected.length) {
      setError(
        "Use JPG, PNG or WEBP images, maximum 5 MB each."
      );
    } else {
      setError("");
    }

    setImages(validFiles);
    setPreviews(
      validFiles.map((file) => URL.createObjectURL(file))
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!rating) {
      setError("Please select a product rating.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!review.trim()) {
      setError("Please write your review.");
      return;
    }

    if (name.trim().length > 80) {
      setError("Your name must be 80 characters or fewer.");
      return;
    }

    if (review.trim().length > 3000) {
      setError("Your review must be 3000 characters or fewer.");
      return;
    }

    setSubmitting(true);

    try {
      const form = new FormData();

      const payload = {
        productId: product._id,
        productSlug: product.slug || "",
        productName: product.name || "",
        rating,
        name: name.trim(),
        userName: name.trim(),
        review: review.trim(),
        comment: review.trim(),
      };

      Object.entries(payload).forEach(([key, value]) => {
        form.append(key, String(value ?? ""));
      });

      images.forEach((file) => {
        form.append("images", file);
      });

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

      const response = await fetch(
        `${API_BASE}/products/${product._id}/reviews`,
        {
          method: "POST",
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
          body: form,
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Unable to submit review (${response.status}).`
        );
      }

      if (!data?.review && !data?.data) {
        throw new Error(
          "Review response was invalid. Please refresh and check your reviews."
        );
      }

      await onSubmitted?.();
      onClose();
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Failed to submit review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  // Render the modal directly under document.body.
  // This prevents parent transforms and overflow from trapping it.
  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        height: "100dvh",
        isolation: "isolate",
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close review dialog"
        className="absolute inset-0 h-full w-full cursor-default bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-review-title"
        className="relative z-10 flex max-h-[90vh] max-h-[90dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start gap-3 border-b border-gray-100 px-5 pb-4 pt-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            {productImageUrl ? (
              <img
                src={productImageUrl}
                alt={product.name || "Product"}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <ImageIcon
                size={22}
                className="text-gray-300"
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              id="write-review-title"
              className="truncate text-[17px] font-semibold text-gray-900"
            >
              {product.name}
            </h3>

            <p className="mt-0.5 text-[13px] text-gray-500">
              Brand: {product.brand || "—"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form */}
        <form
          onSubmit={handleSubmit}
          className="min-h-0 space-y-5 overflow-y-auto overscroll-contain px-5 py-5"
        >
          {/* Rating */}
          <div>
            <label className="mb-2 block text-[14px] font-medium text-gray-800">
              Select your Product Rating{" "}
              <span className="text-rose-500">*</span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((number) => (
                <button
                  key={number}
                  type="button"
                  onMouseEnter={() => setHoverRating(number)}
                  onMouseLeave={() => setHoverRating(0)}
                  onFocus={() => setHoverRating(number)}
                  onBlur={() => setHoverRating(0)}
                  onClick={() => setRating(number)}
                  aria-label={`${number} stars`}
                  aria-pressed={rating === number}
                  className="rounded p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
                >
                  <Star
                    size={28}
                    className={
                      number <= activeRating
                        ? "fill-orange-500 text-orange-500"
                        : "text-orange-300"
                    }
                  />
                </button>
              ))}

              {activeRating > 0 && (
                <span className="ml-1 text-[14px] font-medium text-gray-600">
                  {RATING_LABELS[activeRating]}
                </span>
              )}
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="mb-2 block text-[14px] font-medium text-gray-800">
              Upload images{" "}
              <span className="font-normal text-gray-400">
                (optional)
              </span>
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-orange-200 bg-[#fff8f0] px-4 py-8 transition hover:bg-orange-50/80">
              <ImageIcon
                size={28}
                className="text-gray-300"
              />

              <p className="text-center text-[14px]">
                <span className="font-medium text-orange-500">
                  Click to upload
                </span>{" "}
                <span className="text-gray-500">
                  or select images
                </span>
              </p>

              <p className="text-[12px] text-gray-400">
                JPG, PNG, WEBP · up to 5 images · 5 MB each
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(event) => {
                  handleFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>

            {previews.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {previews.map((source, index) => (
                  <div key={source} className="relative">
                    <img
                      src={source}
                      alt={`Review image ${index + 1}`}
                      className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                    />

                    <button
                      type="button"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() => {
                        setImages((current) =>
                          current.filter((_, i) => i !== index)
                        );
                        setPreviews((current) =>
                          current.filter((_, i) => i !== index)
                        );
                      }}
                      className="absolute -right-1.5 -top-1.5 rounded-full bg-gray-900 p-1 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="mb-2 block text-[14px] font-medium text-gray-800">
              Your name <span className="text-rose-500">*</span>
            </label>

            <input
              type="text"
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
              required
              className="h-11 w-full rounded-xl border border-orange-100 bg-[#fff8f0] px-4 text-[14px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Review */}
          <div>
            <label className="mb-2 block text-[14px] font-medium text-gray-800">
              Your review <span className="text-rose-500">*</span>
            </label>

            <textarea
              value={review}
              maxLength={3000}
              onChange={(event) => setReview(event.target.value)}
              placeholder="Please share your feedback..."
              rows={4}
              required
              className="min-h-[100px] w-full resize-y rounded-xl border border-orange-100 bg-[#fff8f0] px-4 py-3 text-[14px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {review.length}/3000
            </p>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-[13px] text-rose-600"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 text-[15px] font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && (
              <Loader2 size={18} className="animate-spin" />
            )}

            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default function ProductReviews({ product }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadError, setLoadError] = useState("");

  const productId = product?._id;

  const loadReviews = useCallback(async () => {
    if (!productId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(
        `${API_BASE}/products/${productId}/reviews`
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Could not load reviews."
        );
      }

      const list = Array.isArray(data?.reviews)
        ? data.reviews
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
              ? data
              : [];

      setReviews(list);
    } catch (error) {
      setReviews([]);
      setLoadError(
        error?.message || "Could not load reviews."
      );
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const stats = useMemo(() => {
    const counts = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    let sum = 0;

    reviews.forEach((item) => {
      const rating = Number(item?.rating || 0);

      if (
        Number.isInteger(rating) &&
        rating >= 1 &&
        rating <= 5
      ) {
        counts[rating] += 1;
        sum += rating;
      }
    });

    const total = reviews.length;

    return {
      counts,
      total,
      average: total > 0 ? sum / total : 0,
    };
  }, [reviews]);

  const handleSubmitted = async () => {
    await loadReviews();
  };

  if (!product) return null;

  return (
    <section className="mt-12 sm:mt-16">
      {/* Heading */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-gray-900 sm:text-[24px]">
            Reviews ({stats.total})
          </h2>

          <p className="mt-1 text-[14px] text-gray-500">
            Ratings &amp; Reviews of {product.name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="h-10 shrink-0 rounded-full bg-orange-100 px-5 text-[14px] font-medium text-orange-600 transition hover:bg-orange-200/80"
        >
          Write a Review
        </button>
      </div>

      {/* Rating summary */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-8">
          <div className="min-w-[100px] text-center">
            <div className="text-[40px] font-bold leading-none text-gray-900">
              {stats.average.toFixed(1)}
            </div>

            <StarRow
              rating={stats.average}
              size={18}
              className="mt-2 justify-center"
            />

            <p className="mt-1.5 text-[13px] text-gray-500">
              {stats.total} review
              {stats.total === 1 ? "" : "s"}
            </p>
          </div>

          <RatingBars
            counts={stats.counts}
            total={stats.total}
          />
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">
              Loading reviews...
            </span>
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center">
            <p className="text-sm text-rose-600">
              {loadError}
            </p>

            <button
              type="button"
              onClick={loadReviews}
              className="mt-3 rounded-full bg-orange-500 px-5 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
            <p className="text-[15px] text-gray-500">
              No reviews yet.
            </p>

            <p className="mt-1 text-[13px] text-gray-400">
              Be the first to review this product.
            </p>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-4 h-10 rounded-full bg-orange-500 px-5 text-[14px] font-medium text-white transition hover:bg-orange-600"
            >
              Write a Review
            </button>
          </div>
        ) : (
          reviews.map((item) => {
            const rating = Number(item.rating || 0);

            const displayName =
              item.name || item.userName || "Anonymous";

            const text =
              item.review || item.comment || item.text || "";

            const date = formatReviewDate(
              item.createdAt || item.date || item.created
            );

            return (
              <article
                key={
                  item._id ||
                  item.id ||
                  `${displayName}-${date}`
                }
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-semibold text-orange-600">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[15px] font-semibold text-gray-900">
                          {displayName}
                        </p>

                        {date && (
                          <p className="mt-0.5 text-[12.5px] text-gray-400">
                            {date}
                          </p>
                        )}
                      </div>

                      <StarRow rating={rating} size={14} />
                    </div>

                    {text && (
                      <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-gray-700">
                        {text}
                      </p>
                    )}

                    {Array.isArray(item.images) &&
                      item.images.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.images.map((image, index) => {
                            const src =
                              typeof image === "string"
                                ? image
                                : image?.url;

                            if (!src) return null;

                            return (
                              <img
                                key={
                                  image?.publicId ||
                                  src ||
                                  index
                                }
                                src={src}
                                alt={`Review image ${index + 1}`}
                                loading="lazy"
                                className="h-20 w-20 rounded-lg border border-gray-100 object-cover"
                              />
                            );
                          })}
                        </div>
                      )}

                    <div className="mt-4 flex items-center gap-4 text-[13px] text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <ThumbsUp size={14} />
                        {Number(item.likes || 0)}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <MessageCircle size={14} />
                        {Number(item.replies || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Modal */}
      <WriteReviewModal
        product={product}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitted={handleSubmitted}
      />
    </section>
  );
}
