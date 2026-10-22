"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Pagination,
  EffectCreative,
} from "swiper/modules";

import {
  Calculator,
  Truck,
  PackageCheck,
  BadgePercent,
  Headphones,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-creative";

const API_URL = "https://apple-gadgets-ui-backend.vercel.app";

const services = [
  {
    title: "36 Months EMI",
    icon: Calculator,
    color: "text-purple-500",
  },
  {
    title: "Fastest Home Delivery",
    icon: Truck,
    color: "text-yellow-500",
  },
  {
    title: "Exchange Facility",
    icon: PackageCheck,
    color: "text-green-500",
  },
  {
    title: "Best Price Deals",
    icon: BadgePercent,
    color: "text-red-400",
  },
  {
    title: "After-Sales Service",
    icon: Headphones,
    color: "text-orange-500",
  },
];

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Only keep a ref – no extra state for the instance
  const swiperRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchBanners() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/api/landing-pages/published/banners`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Banner API error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("Invalid banner API response");
        }

        setBanners(result.data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Banner fetch error:", err);
          setError(err.message || "Failed to load banners");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchBanners();

    return () => controller.abort();
  }, []);

  const handleSwiper = (swiper) => {
    swiperRef.current = swiper;
  };

  const handlePrevious = () => {
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) {
      swiper.slidePrev();
    }
  };

  const handleNext = () => {
    const swiper = swiperRef.current;
    if (swiper && !swiper.destroyed) {
      swiper.slideNext();
    }
  };

  const renderBannerImage = (banner, altText) => {
    if (!banner?.image) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
          Image not available
        </div>
      );
    }

    return (
      <img
        src={banner.image}
        alt={banner.alt || altText}
        draggable="false"
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
        onError={(event) => {
          event.currentTarget.style.visibility = "hidden";
        }}
        onLoad={(event) => {
          event.currentTarget.style.visibility = "visible";
        }}
      />
    );
  };

  const renderBannerLink = (banner, altText) => {
    const image = renderBannerImage(banner, altText);

    if (banner?.link) {
      return (
        <Link
          href={banner.link}
          aria-label={banner.alt || altText}
          className="group absolute inset-0 block"
        >
          {image}
        </Link>
      );
    }

    return <div className="group absolute inset-0">{image}</div>;
  };

  if (loading) {
    return (
      <main className="w-full bg-white">
        <section className="w-full px-3 py-3 sm:px-4 sm:py-5 md:px-5 lg:px-6 xl:px-8">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1.08fr)] lg:gap-5">
            <div className="aspect-[16/9] animate-pulse rounded-xl bg-gray-200 sm:rounded-2xl lg:h-[430px] lg:aspect-auto" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-5">
              <div className="aspect-[16/9] animate-pulse rounded-xl bg-gray-200 lg:h-[205px] lg:aspect-auto" />
              <div className="aspect-[16/9] animate-pulse rounded-xl bg-gray-200 lg:h-[205px] lg:aspect-auto" />
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <p className="px-4 py-6 text-center text-sm text-red-600">{error}</p>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const mainBanners = banners;
  const rightBanners = banners.slice(1, 3);
  const canSlide = mainBanners.length > 1;

  return (
    <main className="w-full bg-white">
      <section className="w-full px-3 py-3 sm:px-4 sm:py-5 md:px-5 lg:px-6 xl:px-8">
        <div className="mx-auto w-full max-w-[1440px]">
          {/* HERO AREA */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1.08fr)] lg:gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(300px,1.15fr)]">
            {/* MAIN SLIDER */}
            <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100 sm:rounded-2xl lg:h-[430px] lg:aspect-auto xl:h-[500px] 2xl:h-[540px]">
              <Swiper
                key={mainBanners.map((banner) => banner._id).join("-")}
                modules={[Autoplay, Pagination, EffectCreative]}
                onSwiper={handleSwiper}
                onBeforeDestroy={(swiper) => {
                  if (swiperRef.current === swiper) {
                    swiperRef.current = null;
                  }
                }}
                effect="creative"
                grabCursor={canSlide}
                loop={canSlide}
                speed={700}
                autoplay={
                  canSlide
                    ? {
                        delay: 4000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true,
                      }
                    : false
                }
                pagination={
                  canSlide
                    ? {
                        clickable: true,
                        dynamicBullets: true,
                      }
                    : false
                }
                creativeEffect={{
                  prev: {
                    shadow: true,
                    translate: [0, 0, -400],
                    scale: 0.85,
                    opacity: 0.5,
                  },
                  next: {
                    translate: ["100%", 0, 0],
                  },
                }}
                className="h-full w-full"
              >
                {mainBanners.map((banner, index) => (
                  <SwiperSlide
                    key={banner._id || `${banner.pageSlug}-${index}`}
                    className="relative h-full w-full overflow-hidden"
                  >
                    {renderBannerLink(
                      banner,
                      `Promotional banner ${index + 1}`
                    )}
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* PREVIOUS BUTTON */}
              {canSlide && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:scale-110 hover:bg-black/75 active:scale-95 sm:left-3 sm:h-10 sm:w-10 lg:left-4 lg:h-12 lg:w-12"
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
                </button>
              )}

              {/* NEXT BUTTON */}
              {canSlide && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-md transition hover:scale-110 hover:bg-black/75 active:scale-95 sm:right-3 sm:h-10 sm:w-10 lg:right-4 lg:h-12 lg:w-12"
                  aria-label="Next banner"
                >
                  <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
                </button>
              )}
            </div>

            {/* RIGHT BANNERS */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-5">
              {rightBanners.map((banner, index) => (
                <div
                  key={banner._id || `right-banner-${index}`}
                  className="group relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100 sm:rounded-2xl lg:aspect-auto lg:h-[calc((430px-20px)/2)] xl:h-[calc((500px-20px)/2)] 2xl:h-[calc((540px-20px)/2)]"
                >
                  {renderBannerLink(
                    banner,
                    banner.alt || `Side banner ${index + 1}`
                  )}
                </div>
              ))}

              {rightBanners.length === 0 && (
                <>
                  <div className="aspect-[16/9] rounded-xl bg-gray-50 lg:hidden" />
                  <div className="aspect-[16/9] rounded-xl bg-gray-50 lg:hidden" />
                </>
              )}
            </div>
          </div>

          {/* SERVICE BAR */}
          <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:mt-5 sm:rounded-2xl lg:mt-6">
            <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5">
              {services.map((service, index) => {
                const Icon = service.icon;

                return (
                  <div
                    key={service.title}
                    className={`flex min-h-[72px] items-center justify-center gap-2 px-2 py-3 sm:min-h-[80px] sm:gap-2.5 sm:px-3 md:min-h-[84px] md:gap-3 md:px-4 lg:min-h-[88px] ${
                      index !== services.length - 1
                        ? "border-gray-100 lg:border-r"
                        : ""
                    }`}
                  >
                    <Icon
                      strokeWidth={1.6}
                      className={`h-6 w-6 shrink-0 sm:h-7 sm:w-7 md:h-8 md:w-8 ${service.color}`}
                    />
                    <span className="max-w-[130px] text-center text-[11px] font-medium leading-tight text-gray-700 sm:text-xs md:text-sm">
                      {service.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SWIPER STYLES */}
      <style jsx global>{`
        .swiper-pagination-bullet {
          background: #fff;
          opacity: 0.7;
        }
        .swiper-pagination-bullet-active {
          background: #fff;
          opacity: 1;
        }
        .swiper-pagination {
          z-index: 10;
        }
      `}</style>
    </main>
  );
}