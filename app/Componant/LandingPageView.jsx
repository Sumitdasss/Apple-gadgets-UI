"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  ExternalLink,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const API_URL = "https://apple-gadgets-ui-backend.vercel.app";

export default function LandingPageView({ slug, onClose }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    const controller = new AbortController();

    async function fetchPage() {
      try {
        setLoading(true);
        setPage(null);
        setError("");

        const response = await fetch(
          `${API_URL}/api/landing-pages/public/${encodeURIComponent(slug)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error("Backend থেকে সঠিক JSON response পাওয়া যায়নি।");
        }

        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || "Landing page load করা যায়নি।");
        }

        if (!result.data) {
          throw new Error("Landing page-এর data পাওয়া যায়নি।");
        }

        setPage(result.data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Landing page load করতে সমস্যা হয়েছে।");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchPage();

    return () => controller.abort();
  }, [slug]);

  // Close modal with Escape key
  useEffect(() => {
    if (!onClose) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Prevent background scrolling while popup is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (!slug) return null;

  const sections = Array.isArray(page?.sections) ? page.sections : [];

  const getImageUrl = (image) => {
    if (!image) return "";

    if (typeof image === "string") return image;

    return image.url || image.secure_url || "";
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null || price === "") {
      return "Price unavailable";
    }

    return `৳${Number(price).toLocaleString("en-BD")}`;
  };

  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/lp/${encodeURIComponent(slug)}`
      : `/lp/${encodeURIComponent(slug)}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Landing page preview"
    >
      <div className="flex h-full w-full max-w-[1500px] flex-col overflow-hidden bg-white shadow-2xl sm:h-[94vh] sm:rounded-2xl">
        {/* Modal Header */}
        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-slate-900 sm:text-base">
              {page?.title || slug}
            </h2>

            <p className="mt-1 truncate text-xs text-slate-500 sm:text-sm">
              /lp/{slug}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex sm:text-sm"
            >
              Open in New Tab
              <ExternalLink size={15} />
            </a>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        {/* Preview Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-5">
              <LoaderCircle
                size={38}
                className="animate-spin text-indigo-600"
              />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading landing page preview...
              </p>
            </div>
          ) : error ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertCircle size={28} />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                Preview load failed
              </h3>

              <p className="mt-2 max-w-lg text-sm text-slate-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setLoading(true);

                  // Re-run the component's request through a refresh key
                  window.location.hash = `preview-${Date.now()}`;
                  window.location.reload();
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>
            </div>
          ) : (
            <main className="dynamic-landing-page min-h-full bg-white">
              {sections.length === 0 ? (
                <div className="flex min-h-[300px] items-center justify-center px-5 text-center">
                  <p className="text-sm text-slate-500">
                    এই landing page-এ এখনো কোনো section যোগ করা হয়নি।
                  </p>
                </div>
              ) : (
                sections.map((section, index) => {
                  const sectionKey =
                    section._id || `${section.type || "section"}-${index}`;

                  const imageUrl = getImageUrl(section.image);

                  return (
                    <section
                      key={sectionKey}
                      className={`lp-${section.type || "section"} relative`}
                    >
                      {/* HERO SECTION */}
                      {section.type === "hero" && (
                        <div className="relative flex min-h-[300px] items-center overflow-hidden bg-slate-950 sm:min-h-[440px]">
                          {imageUrl && (
                            <>
                              <img
                                src={imageUrl}
                                alt={section.title || "Hero banner"}
                                className="absolute inset-0 h-full w-full object-cover"
                              />

                              <div className="absolute inset-0 bg-black/40" />
                            </>
                          )}

                          <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-14 sm:px-10 sm:py-20">
                            {section.title && (
                              <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                {section.title}
                              </h1>
                            )}

                            {section.subtitle && (
                              <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
                                {section.subtitle}
                              </p>
                            )}

                            {section.buttonText && (
                              <Link
                                href={section.buttonLink || "/"}
                                className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
                              >
                                {section.buttonText}
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                      {/* BANNER SECTION */}
                      {section.type === "banner" && (
                        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-8 sm:py-8">
                          <div className="relative min-h-[180px] overflow-hidden rounded-2xl bg-slate-100 sm:min-h-[280px]">
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={section.title || "Banner"}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            )}

                            {(section.title || section.description) && (
                              <div className="relative z-10 flex min-h-[180px] flex-col justify-center p-6 sm:min-h-[280px] sm:p-10">
                                <div
                                  className={`max-w-2xl ${
                                    imageUrl
                                      ? "rounded-xl bg-black/50 p-5 text-white sm:p-7"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {section.title && (
                                    <h2 className="text-2xl font-bold sm:text-4xl">
                                      {section.title}
                                    </h2>
                                  )}

                                  {section.description && (
                                    <p className="mt-3 text-sm leading-7 sm:text-base">
                                      {section.description}
                                    </p>
                                  )}

                                  {section.buttonText && (
                                    <Link
                                      href={section.buttonLink || "/"}
                                      className="mt-5 inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                    >
                                      {section.buttonText}
                                    </Link>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* FEATURES SECTION */}
                      {section.type === "features" && (
                        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
                          {section.title && (
                            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-4xl">
                              {section.title}
                            </h2>
                          )}

                          {section.subtitle && (
                            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">
                              {section.subtitle}
                            </p>
                          )}

                          <div className="lp-features-grid mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {(section.features || []).map(
                              (feature, featureIndex) => (
                                <article
                                  key={feature._id || featureIndex}
                                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                  {getImageUrl(feature.image) && (
                                    <img
                                      src={getImageUrl(feature.image)}
                                      alt={feature.title || "Feature"}
                                      className="mb-4 h-14 w-14 rounded-xl object-cover"
                                    />
                                  )}

                                  <h3 className="text-lg font-bold text-slate-900">
                                    {feature.title}
                                  </h3>

                                  {feature.description && (
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                      {feature.description}
                                    </p>
                                  )}
                                </article>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* PRODUCTS SECTION */}
                      {section.type === "products" && (
                        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
                          {section.title && (
                            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                              {section.title}
                            </h2>
                          )}

                          {section.subtitle && (
                            <p className="mt-2 text-sm text-slate-500 sm:text-base">
                              {section.subtitle}
                            </p>
                          )}

                          <div className="lp-products-grid mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {(section.productIds || []).map(
                              (product, productIndex) => {
                                if (!product || typeof product !== "object") {
                                  return null;
                                }

                                const productImage = getImageUrl(
                                  product.images?.[0],
                                );

                                const price =
                                  product.discountPrice ?? product.price;

                                return (
                                  <article
                                    key={product._id || productIndex}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                                  >
                                    <Link
                                      href={`/products/${product.slug || product._id}`}
                                      className="block"
                                    >
                                      {productImage ? (
                                        <img
                                          src={productImage}
                                          alt={product.name || "Product"}
                                          className="h-40 w-full object-contain p-4 sm:h-52"
                                        />
                                      ) : (
                                        <div className="flex h-40 items-center justify-center bg-slate-50 text-sm text-slate-400 sm:h-52">
                                          No image
                                        </div>
                                      )}

                                      <div className="p-4">
                                        <h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-900 sm:text-base">
                                          {product.name || "Product"}
                                        </h3>

                                        <p className="mt-2 font-bold text-indigo-700">
                                          {formatPrice(price)}
                                        </p>
                                      </div>
                                    </Link>

                                    <div className="px-4 pb-4">
                                      <Link
                                        href={`/products/${product.slug || product._id}`}
                                        className="block rounded-lg border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:text-sm"
                                      >
                                        View Product
                                      </Link>
                                    </div>
                                  </article>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                      {/* CTA SECTION */}
                      {section.type === "cta" && (
                        <div className="bg-indigo-700 px-5 py-12 text-center text-white sm:px-8 sm:py-16">
                          {section.title && (
                            <h2 className="text-2xl font-bold sm:text-4xl">
                              {section.title}
                            </h2>
                          )}

                          {section.description && (
                            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                              {section.description}
                            </p>
                          )}

                          {section.buttonText && (
                            <Link
                              href={section.buttonLink || "/"}
                              className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
                            >
                              {section.buttonText}
                            </Link>
                          )}
                        </div>
                      )}

                      {/* TESTIMONIALS SECTION */}
                      {section.type === "testimonials" && (
                        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
                          {section.title && (
                            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
                              {section.title}
                            </h2>
                          )}

                          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {(section.testimonials || []).map(
                              (item, itemIndex) => (
                                <article
                                  key={item._id || itemIndex}
                                  className="rounded-2xl border border-slate-200 p-6 shadow-sm"
                                >
                                  <p className="text-sm leading-7 text-slate-600">
                                    “{item.message || item.description || ""}”
                                  </p>

                                  <h3 className="mt-4 font-bold text-slate-900">
                                    {item.name || item.author || "Customer"}
                                  </h3>
                                </article>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* OFFERS SECTION */}
                      {section.type === "offers" && (
                        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
                            {section.title && (
                              <h2 className="text-2xl font-bold text-slate-900">
                                {section.title}
                              </h2>
                            )}

                            {section.description && (
                              <p className="mt-3 text-sm leading-7 text-slate-700">
                                {section.description}
                              </p>
                            )}

                            {section.buttonText && (
                              <Link
                                href={section.buttonLink || "/"}
                                className="mt-5 inline-flex rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                              >
                                {section.buttonText}
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                      {/* UNKNOWN / CUSTOM SECTION FALLBACK */}
                      {![
                        "hero",
                        "banner",
                        "features",
                        "products",
                        "cta",
                        "testimonials",
                        "offers",
                      ].includes(section.type) && (
                        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={section.title || "Landing page section"}
                              className="mb-5 max-h-[450px] w-full rounded-xl object-cover"
                            />
                          )}

                          {section.title && (
                            <h2 className="text-2xl font-bold text-slate-900">
                              {section.title}
                            </h2>
                          )}

                          {section.subtitle && (
                            <p className="mt-3 text-slate-600">
                              {section.subtitle}
                            </p>
                          )}

                          {section.description && (
                            <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                              {section.description}
                            </p>
                          )}
                        </div>
                      )}
                    </section>
                  );
                })
              )}
            </main>
          )}
        </div>
      </div>
    </div>
  );
}