/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_URL = "https://apple-gadgets-ui-backend.vercel.app";

/* ===================== HELPERS ===================== */

function slugify(text = "") {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getProductId(product) {
  if (typeof product === "string") return product;
  return String(product?._id || product?.id || "");
}

function getImage(product) {
  const images = product?.images;

  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string") return first;
    if (first?.url) return first.url;
    if (first?.secure_url) return first.secure_url;
  }

  return (
    product?.image ||
    product?.thumbnail ||
    product?.mainImage ||
    product?.thumbnailImage ||
    ""
  );
}

function getPrice(product) {
  return Number(
    product?.discountPrice ??
      product?.discountedPrice ??
      product?.salePrice ??
      product?.price ??
      0
  );
}

function formatPrice(price) {
  return `৳${Number(price || 0).toLocaleString("en-BD")}`;
}

/* ===================== ICONS ===================== */

const ArrowIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const ChevronIcon = () => (
  <svg className="h-3 w-3 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.6-3.1A12 12 0 0112 3a12 12 0 01-8.6 3.9A12 12 0 003 12c0 5.2 3.4 9.6 9 11 5.6-1.4 9-5.8 9-11 0-1.7-.3-3.3-.4-5.1z" />
  </svg>
);

const TruckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
  </svg>
);

const BadgeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.8 4.7a3.4 3.4 0 001.9-.8 3.4 3.4 0 014.6 0 3.4 3.4 0 001.9.8 3.4 3.4 0 013.1 3.1 3.4 3.4 0 00.8 1.9 3.4 3.4 0 010 4.6 3.4 3.4 0 00-.8 1.9 3.4 3.4 0 01-3.1 3.1 3.4 3.4 0 00-1.9.8 3.4 3.4 0 01-4.6 0 3.4 3.4 0 00-1.9-.8 3.4 3.4 0 01-3.1-3.1 3.4 3.4 0 00-.8-1.9 3.4 3.4 0 010-4.6 3.4 3.4 0 00.8-1.9 3.4 3.4 0 013.1-3.1z" />
  </svg>
);

/* ===================== COUNTDOWN ===================== */

function Countdown({ endDate }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!endDate) return;

    const calculateTime = () => {
      const difference = new Date(endDate).getTime() - Date.now();

      if (!Number.isFinite(difference) || difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setExpired(true);
        return;
      }

      setExpired(false);
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const pad = (n) => String(n).padStart(2, "0");

  if (expired) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-xs font-semibold tracking-wide text-neutral-500">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
        Offer Ended
      </div>
    );
  }

  const units = [
    ["Days", timeLeft.days],
    ["Hours", timeLeft.hours],
    ["Mins", timeLeft.minutes],
    ["Secs", timeLeft.seconds],
  ];

  return (
    <div className="flex items-stretch gap-2 sm:gap-3">
      {units.map(([label, value]) => (
        <div
          key={label}
          className="flex w-[62px] flex-col items-center rounded-2xl bg-neutral-900 py-3 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] ring-1 ring-white/10 sm:w-[74px] sm:py-3.5"
        >
          <span className="bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-2xl font-semibold tabular-nums tracking-tight text-transparent sm:text-3xl">
            {pad(value)}
          </span>
          <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-500 sm:text-[10px]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ===================== PRODUCT CARD ===================== */

function ProductCard({ product }) {
  const id = getProductId(product);
  const name = product?.name || product?.title || "Unnamed Product";
  const image = getImage(product);
  const price = getPrice(product);

  const originalPrice = Number(
    product?.originalPrice ?? product?.regularPrice ?? product?.price ?? 0
  );

  const hasDiscount = originalPrice > 0 && price > 0 && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const productHref = `/Product/${product.slug}`;
  const inStock = product?.stock === undefined || Number(product.stock) > 0;

  return (
    <article className="group relative flex flex-col rounded-[26px] bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_28px_50px_-18px_rgba(0,0,0,0.18)]">
      {/* Image */}
      <Link
        href={productHref}
        className="relative block overflow-hidden rounded-[20px] bg-gradient-to-b from-neutral-50 to-neutral-100/70"
      >
        <div className="flex h-48 items-center justify-center p-5 sm:h-60">
          {image ? (
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <span className="text-xs font-medium text-neutral-400">
              No Image
            </span>
          )}
        </div>

        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-white">
            SAVE {discountPercent}%
          </span>
        )}

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600 shadow ring-1 ring-black/5">
              Sold Out
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <Link href={productHref}>
          <h2 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-neutral-800 transition-colors group-hover:text-neutral-950 sm:text-sm">
            {name}
          </h2>
        </Link>

        {product?.stock !== undefined && inStock && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-medium text-neutral-500">
              In stock
            </span>
          </div>
        )}

        <div className="mt-4 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[11px] text-neutral-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
            <span className="text-base font-semibold tracking-tight text-neutral-950 sm:text-lg">
              {formatPrice(price)}
            </span>
          </div>

          <Link
            href={productHref}
            aria-label={`View ${name}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-amber-500 group-hover:to-orange-600 group-hover:shadow-lg group-hover:shadow-orange-500/30 active:scale-95"
          >
            <ArrowIcon className="h-4 w-4 -rotate-45 transition-transform duration-300 group-hover:rotate-0" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ===================== SKELETON ===================== */

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-72 w-full animate-pulse rounded-[32px] bg-neutral-200/70 sm:h-96" />
        <div className="mt-10 h-5 w-32 animate-pulse rounded-full bg-neutral-200/70" />
        <div className="mt-4 h-10 w-2/3 animate-pulse rounded-xl bg-neutral-200/70" />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-[26px] bg-neutral-200/70" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===================== MAIN PAGE ===================== */

export default function OfferDetailsPage() {
  const params = useParams();
  const rawSlug = params?.slug || "";
  const slug = slugify(Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug);

  const [offer, setOffer] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState("");
  const [productError, setProductError] = useState("");

  useEffect(() => {
    if (!slug) {
      setError("Invalid offer URL.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchOfferAndProducts() {
      try {
        setLoading(true);
        setError("");
        setProductError("");
        setOffer(null);
        setProducts([]);

        /* ---------- 1. FETCH OFFERS ---------- */
        const offerResponse = await fetch(
          `${API_URL}/api/landing-pages/public/offers`,
          { cache: "no-store", signal: controller.signal }
        );

        if (!offerResponse.ok) {
          throw new Error(`Offers API error: ${offerResponse.status}`);
        }

        const offerResult = await offerResponse.json();

        if (offerResult?.success === false) {
          throw new Error(offerResult.message || "Failed to load offers.");
        }

        const rootData = offerResult?.data;
        const rootItems = Array.isArray(rootData)
          ? rootData
          : Array.isArray(rootData?.offers)
            ? rootData.offers
            : rootData && typeof rootData === "object"
              ? [rootData]
              : [];

        /* ---------- 2. EXTRACT NESTED OFFERS ---------- */
        const allOffers = rootItems.flatMap((item) => {
          const nestedSections = Array.isArray(item?.sections)
            ? item.sections.flatMap((section) =>
                Array.isArray(section?.offers) ? section.offers : []
              )
            : [];

          if (nestedSections.length > 0) return nestedSections;
          if (Array.isArray(item?.offers)) return item.offers;
          return [item];
        });

        /* ---------- 3. MATCH OFFER SLUG ---------- */
        const foundOffer = allOffers.find((item) => {
          const titleSlug = slugify(item?.title || item?.name || "");
          const storedSlug = slugify(item?.slug || "");
          const linkPath = String(item?.link || "").split("?")[0].split("#")[0];
          const linkSlug = slugify(linkPath.split("/").filter(Boolean).pop() || "");

          return storedSlug === slug || titleSlug === slug || linkSlug === slug;
        });

        if (!foundOffer) {
          throw new Error("অফারটি খুঁজে পাওয়া যায়নি।");
        }

        setOffer(foundOffer);

        /* ---------- 4. EXTRACT PRODUCT IDS ---------- */
        const productIds = [
          ...(Array.isArray(foundOffer?.productIds) ? foundOffer.productIds : []),
          ...(Array.isArray(foundOffer?.products) ? foundOffer.products : []),
        ]
          .map(getProductId)
          .filter(Boolean);

        const uniqueProductIds = [...new Set(productIds)];

        if (uniqueProductIds.length === 0) {
          setProducts([]);
          setProductError("এই অফারের সাথে কোনো পণ্য যুক্ত করা নেই।");
          return;
        }

        /* ---------- 5. FETCH PRODUCTS ---------- */
        setProductsLoading(true);

        try {
          const productResponse = await fetch(
            `${API_URL}/products/getALLproducts`,
            { cache: "no-store", signal: controller.signal }
          );

          if (!productResponse.ok) {
            throw new Error(`Products API error: ${productResponse.status}`);
          }

          const productResult = await productResponse.json();

          const productList = Array.isArray(productResult)
            ? productResult
            : Array.isArray(productResult?.data)
              ? productResult.data
              : Array.isArray(productResult?.products)
                ? productResult.products
                : Array.isArray(productResult?.data?.products)
                  ? productResult.data.products
                  : [];

          /* ---------- 6. MATCH PRODUCTS BY ID ---------- */
          const matchedProducts = productList.filter((product) =>
            uniqueProductIds.includes(getProductId(product))
          );

          setProducts(matchedProducts);

          if (matchedProducts.length === 0) {
            setProductError("নির্দিষ্ট প্রোডাক্টগুলো বর্তমানে অনুপলব্ধ।");
          }
        } catch (productErr) {
          if (productErr.name === "AbortError") throw productErr;
          setProductError(productErr.message || "প্রোডাক্ট লোড করা যায়নি।");
        } finally {
          if (!controller.signal.aborted) setProductsLoading(false);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load offer.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchOfferAndProducts();
    return () => controller.abort();
  }, [slug]);

  if (loading) return <SkeletonLoader />;

  if (error || !offer) {
    return (
      <main className="flex  items-center justify-center bg-[#F5F5F7] px-4">
        <div className="w-full max-w-md rounded-[32px] bg-white p-10 text-center shadow-[0_30px_60px_-20px_rgba(0,0,0,0.15)] ring-1 ring-black/[0.04]">
          <div className="mx-auto  mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-orange-600">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Offer not found
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            {error || "অনুরোধকৃত অফারটি বর্তমানে সক্রিয় নেই।"}
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-7 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.98]"
          >
            Back to Home
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F5F7] text-neutral-900 antialiased">
      {/* ---------- HERO BANNER ---------- */}
      <section className="mx-auto max-w-360 px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[28px] bg-neutral-900 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)] ring-1 ring-black/10 sm:rounded-[36px]">
          {offer.image ? (
            <>
              <img
                src={offer.image}
                alt={offer.alt || offer.title || "Offer banner"}
                fetchPriority="high"
                className="h-auto max-h-[520px] w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </>
          ) : (
            <div className="relative flex h-60 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-6 text-center sm:h-80">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-500/30 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
              <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                {offer.title}
              </h2>
            </div>
          )}
        </div>
      </section>

      {/* ---------- CONTENT ---------- */}
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs font-medium text-neutral-400">
          <Link href="/" className="transition hover:text-neutral-900">
            Home
          </Link>
          <ChevronIcon />
          <span>Offers</span>
          <ChevronIcon />
          <span className="line-clamp-1 text-neutral-700">{offer.title}</span>
        </nav>

        {/* Title + Countdown */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 shadow-sm ring-1 ring-black/[0.05]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                Special Campaign
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-semibold leading-[1.1] tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl">
              {offer.title}
            </h1>

            {offer.description && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-500 sm:text-base">
                {offer.description}
              </p>
            )}
          </div>

          {offer.endDate && (
            <div className="shrink-0">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400 lg:text-right">
                Offer ends in
              </p>
              <Countdown endDate={offer.endDate} />
            </div>
          )}
        </div>

        {/* Trust strip */}
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            [BadgeIcon, "100% Authentic", "Genuine products only"],
            [ShieldIcon, "Warranty Backed", "Official warranty support"],
            [TruckIcon, "Fast Delivery", "Delivered across Bangladesh"],
          ].map(([Icon, title, sub]) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-black/[0.04]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white">
                <Icon />
              </span>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{title}</p>
                <p className="text-xs text-neutral-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Products header */}
        <div className="mb-8 mt-16 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">
              Collection
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              Campaign Products
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              অফারে অন্তর্ভুক্ত স্পেশাল প্রোডাক্টসমূহ
            </p>
          </div>

          <div className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-700 ring-1 ring-black/[0.05]">
            {products.length} {products.length === 1 ? "Product" : "Products"}
          </div>
        </div>

        {/* Products grid / status */}
        {productsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-[26px] bg-neutral-200/70" />
            ))}
          </div>
        ) : productError ? (
          <div className="rounded-[28px] border border-dashed border-neutral-300 bg-white/60 p-14 text-center">
            <p className="text-sm font-medium text-neutral-500">{productError}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-neutral-300 bg-white/60 p-14 text-center">
            <p className="text-sm font-medium text-neutral-400">
              বর্তমানে এই অফারে কোনো পণ্য যোগ করা নেই।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={getProductId(product)} product={product} />
            ))}
          </div>
        )}

        {/* Terms */}
        {offer.termsAndConditions && (
          <div className="mt-20 overflow-hidden rounded-[28px] bg-white ring-1 ring-black/[0.04]">
            <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-5 sm:px-8">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="text-base font-semibold tracking-tight text-neutral-900">
                Terms &amp; Conditions
              </h3>
            </div>
            <div className="whitespace-pre-line px-6 py-6 text-xs leading-relaxed text-neutral-600 sm:px-8 sm:text-sm sm:leading-7">
              {offer.termsAndConditions}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
