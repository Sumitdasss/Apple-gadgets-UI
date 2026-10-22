"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL =
  "https://apple-gadgets-ui-backend.vercel.app/api/landing-pages/public/offers";

/* ===================== HELPERS ===================== */
function slugify(text = "") {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
        days: Math.floor(difference / 86400000),
        hours: Math.floor((difference / 3600000) % 24),
        minutes: Math.floor((difference / 60000) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  const pad = (number) => String(number).padStart(2, "0");

  if (expired) {
    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
          Offer Ended
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {[
        ["days", "Day"],
        ["hours", "Hrs"],
        ["minutes", "Min"],
        ["seconds", "Sec"],
      ].map(([key, label]) => (
        <div
          key={key}
          className="flex w-[54px] flex-col items-center rounded-xl bg-neutral-900 py-2 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:w-16 sm:py-2.5"
        >
          <span className="bg-gradient-to-b from-white to-neutral-300 bg-clip-text text-lg font-semibold tabular-nums tracking-tight text-transparent sm:text-xl">
            {pad(timeLeft[key])}
          </span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ===================== OFFER CARD ===================== */
function OfferCard({ offer }) {
  const title = offer.title || offer.name || "Special Offer";
  const image = offer.image || offer.imageUrl || "";
  const detailsHref = `/offerDetails/${slugify(title)}`;

  return (
    <article className="group relative flex h-full flex-col rounded-[28px] bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_30px_-14px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.04] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_34px_60px_-22px_rgba(0,0,0,0.22)]">
      {/* Image */}
      <Link
        href={detailsHref}
        className="relative block overflow-hidden rounded-[22px] bg-gradient-to-b from-neutral-50 to-neutral-100"
      >
        <div className="relative aspect-square w-full">
          {image ? (
            <img
              src={image}
              alt={offer.alt || title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-neutral-400">
              No Image
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {offer.endDate && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-800 shadow-sm ring-1 ring-black/5 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-orange-500" />
              </span>
              Limited Time
            </span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col px-3 pb-3 pt-5 sm:px-4 sm:pb-4">
        <Link href={detailsHref}>
          <h3 className="line-clamp-2 min-h-[44px] text-center text-[15px] font-semibold leading-snug tracking-tight text-neutral-900 transition-colors group-hover:text-neutral-950 sm:text-base">
            {title}
          </h3>
        </Link>

        {offer.endDate && (
          <div className="mt-4">
            <p className="mb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Ends in
            </p>
            <Countdown endDate={offer.endDate} />
          </div>
        )}

        <div className="mt-auto pt-5">
          <Link
            href={detailsHref}
            className="group/btn flex w-full items-center justify-center gap-2 rounded-full bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-600 hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98]"
          >
            {offer.buttonText || "View Details"}
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ===================== MAIN COMPONENT ===================== */
export default function LatestOffers() {
  const [offers, setOffers] = useState([]);
  const [sectionTitle, setSectionTitle] = useState("Latest Offers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOffers() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL, {
          cache: "no-store",
          signal: controller.signal,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || `Request failed: ${response.status}`
          );
        }

        const allOffers = Array.isArray(result.data) ? result.data : [];

        setSectionTitle(
          allOffers.find((offer) => offer.sectionTitle)?.sectionTitle ||
            "Latest Offers"
        );

        const offersWithSlug = allOffers
          .filter(
            (offer) => offer && (offer.image || offer.title || offer.name)
          )
          .map((offer) => ({
            ...offer,
            slug:
              offer.slug ||
              slugify(offer.title || offer.name || "") ||
              offer._id,
          }));

        setOffers(offersWithSlug);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Offers fetch error:", err);
          setError(err.message || "Failed to load offers.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchOffers();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-[#F5F5F7] py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 h-4 w-24 animate-pulse rounded-full bg-neutral-200/70" />
          <div className="mb-12 h-10 w-64 animate-pulse rounded-xl bg-neutral-200/70" />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-7">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="aspect-[3/4] animate-pulse rounded-[28px] bg-neutral-200/70"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-[#F5F5F7] px-4 py-14">
        <div className="mx-auto max-w-md rounded-[24px] bg-white p-6 text-center ring-1 ring-black/[0.05]">
          <p className="text-sm font-medium text-neutral-600">{error}</p>
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#F5F5F7] py-14 sm:py-20">
      {/* soft ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-orange-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mb-10 flex flex-col items-center text-center sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 shadow-sm ring-1 ring-black/[0.05]">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-600" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-600">
              Exclusive Deals
            </span>
          </span>

          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl lg:text-5xl">
            {sectionTitle}
          </h2>

          <div className="mt-5 h-[3px] w-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:gap-7">
          {offers.map((offer, index) => (
            <OfferCard key={offer._id || `offer-${index}`} offer={offer} />
          ))}
        </div>
      </div>
    </section>
  );
}
