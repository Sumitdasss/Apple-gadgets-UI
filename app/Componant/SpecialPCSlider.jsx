
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const API_URL = "https://apple-gadgets-ui-backend.vercel.app";

const categories = [
  { label: "Special PC", slug: "desktop-offer" },
  { label: "Motherboard", slug: "motherboard" },
  { label: "Processor", slug: "processor" },
  { label: "Graphics Card", slug: "graphics-card" },
  { label: "SSD", slug: "ssd" },
  { label: "RAM", slug: "ram" },
  { label: "Cpu Cooler", slug: "cpu-cooler" },
  { label: "Power Supply", slug: "power-supply" },
  { label: "Monitor", slug: "monitor" },
  { label: "Casing", slug: "casing" },
  { label: "Mouse", slug: "mouse" },
  { label: "Keyboard", slug: "keyboard" },
];

const formatPrice = (price) =>
  `৳ ${Number(price || 0).toLocaleString("en-US")}`;

export default function SpecialPCSlider() {
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("desktop-offer");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

      const url = new URL(`${API_URL}/products/desktop-products`);
        url.searchParams.set("category", activeCategory);
        url.searchParams.set("offer", "true");
        url.searchParams.set("limit", "12");

        const response = await fetch(url.toString(), {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        setProducts(
          Array.isArray(data.products) ? data.products : []
        );
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Product fetch error:", err);
        setError("প্রোডাক্ট লোড করা যায়নি।");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => controller.abort();
  }, [activeCategory]);

  return (
    <section className="w-full overflow-hidden bg-white py-6 sm:py-8">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Heading and Navigation */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="text-gray-950">AG </span>
            <span className="bg-gradient-to-r from-red-500 via-orange-400 to-purple-600 bg-clip-text text-transparent">
              Computers
            </span>
          </h2>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <button
              type="button"
              aria-label="Previous products"
              className="ag-pc-prev flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 text-gray-700 transition hover:bg-gray-100"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              aria-label="Next products"
              className="ag-pc-next flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition hover:bg-orange-500"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mb-10 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => {
            const active = activeCategory === category.slug;

            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => setActiveCategory(category.slug)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-[355px] min-w-[220px] flex-1 animate-pulse rounded-[20px] bg-gray-100"
              />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="py-12 text-center text-sm text-red-500">
            {error}
            <button
              type="button"
              onClick={() => setActiveCategory((value) => value)}
              className="ml-3 underline"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-xl bg-gray-50 py-12 text-center text-gray-500">
            এই ক্যাটাগরিতে কোনো অফার পাওয়া যায়নি।
          </div>
        )}

        {/* Products */}
        {!loading && !error && products.length > 0 && (
          <Swiper
            key={activeCategory}
            modules={[Navigation, Pagination, Autoplay]}
            navigation={{
              prevEl: ".ag-pc-prev",
              nextEl: ".ag-pc-next",
            }}
            pagination={{ clickable: true }}
            autoplay={{
              delay: 4000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            spaceBetween={16}
            slidesPerView={1.3}
            breakpoints={{
              480: { slidesPerView: 2, spaceBetween: 16 },
              640: { slidesPerView: 2.5, spaceBetween: 16 },
              768: { slidesPerView: 3, spaceBetween: 16 },
              1024: { slidesPerView: 4, spaceBetween: 16 },
              1280: { slidesPerView: 4.8, spaceBetween: 16 },
            }}
            className="ag-computer-swiper !pb-10"
          >
            {products.map((product) => {
              const price = Number(product.price) || 0;
              const discountPrice =
                product.discountPrice != null
                  ? Number(product.discountPrice)
                  : price;

              const hasDiscount =
                discountPrice > 0 && discountPrice < price;

              const imageSrc =
                product.images?.find(
                  (image) =>
                    typeof image === "string" && image.trim()
                ) ||
                product.image ||
                "/placeholder.png";

              return (
                <SwiperSlide key={product._id} className="h-auto">
                  <Link
                    href={`/Product/${product.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Image */}
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden p-3 sm:p-4">
                      <img
                        src={imageSrc}
                        alt={product.name || "Desktop PC"}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/placeholder.png";
                        }}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col px-4 pb-4">
                      <h3 className="mb-2 line-clamp-2 min-h-[48px] text-base font-semibold leading-6 text-gray-900">
                        {product.name}
                      </h3>

                      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-lg font-bold text-gray-950">
                          {formatPrice(
                            hasDiscount ? discountPrice : price
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {hasDiscount && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(price)}
                            </span>

                            <span className="rounded-full bg-green-100 px-3 py-1 text-[11px] font-medium text-green-700">
                              ৳ {(
                                price - discountPrice
                              ).toLocaleString("en-US")} OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </div>

      {/* Pagination and Arrow Styling */}
      <style jsx global>{`
        .ag-computer-swiper .swiper-pagination {
          bottom: 0;
        }

        .ag-computer-swiper .swiper-pagination-bullet {
          background: #d1d5db;
          opacity: 1;
        }

        .ag-computer-swiper .swiper-pagination-bullet-active {
          background: #000;
        }

        .ag-computer-swiper .swiper-button-next,
        .ag-computer-swiper .swiper-button-prev {
          display: none;
        }
      `}</style>
    </section>
  );
}
