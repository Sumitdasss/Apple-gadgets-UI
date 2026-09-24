"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

// Fallback images (cycle through these)
const categoryImages = [
  "/images.png",
  "/appliances-gray-background_24908-61032.avif",
  "/pngtree-golden-photography-wing-camera-logo-png-image_6007201.png",
  "/computer-logo-design-concept-vector-art-illustration_761413-40776.avif",
  "/logo-mobile-products-mobile-products_1189726-5309.avif",
  "/download.jpg",
  "/download (1).jpg",
  "/download (2).jpg",
  "/iPhone-17-Pro-Max-cosmic-orange-8534.webp",
  "/download (3).jpg",
  "/pexels-rubaitulazad-13791394.jpg",
];

export default function FeaturedCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const makeSlug = (item) => {
    if (item?.slug) return item.slug;

    return item?.name
      ?.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_BASE}/getallcatgoris`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load categories");
        }

        const list = Array.isArray(data)
          ? data
          : data.categories || data.data || [];

        const getParentId = (item) => item.parent?._id || item.parent || null;

        const rootCategories = list.filter((item) => !getParentId(item));
        setCategories(rootCategories);
      } catch (error) {
        console.error("Featured categories loading error:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  return (
    <section className="w-full bg-white py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[1450px] px-5 sm:px-8 lg:px-10">
        {/* Heading */}
        <div className="mb-10 sm:mb-12 lg:mb-14">
          <h2 className="text-[32px] font-bold tracking-tight text-[#171717] sm:text-[40px] lg:text-[46px]">
            Featured{" "}
            <span className="bg-gradient-to-r from-[#ff4b2b] via-[#ff8a2f] to-[#6a20ff] bg-clip-text text-transparent">
              Categories
            </span>
          </h2>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Explore our most popular collections
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:gap-x-6 lg:gap-y-12">
            {Array.from({ length: 16 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="h-[76px] w-[76px] animate-pulse rounded-2xl bg-gray-100 sm:h-[88px] sm:w-[88px]" />
                <div className="mt-4 h-3.5 w-20 animate-pulse rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No categories found</p>
          </div>
        ) : (
          /* Categories Grid */
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:gap-x-6 lg:gap-y-12">
            {categories.map((category, index) => (
              <Link
                key={category._id}
                href={`/category/${makeSlug(category)}`}
                className="group flex flex-col items-center text-center"
              >
                {/* Image Container */}
                <div className="relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100 transition-all duration-300 group-hover:bg-white group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group-hover:ring-[#ff4b2b]/20 sm:h-[88px] sm:w-[88px]">
                  <img
                    src={categoryImages[index % categoryImages.length]}
                    alt={category.name}
                    className="h-[70%] w-[70%] object-contain transition-transform duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>

                {/* Category Name */}
                <h3 className="mt-3.5 max-w-[130px] text-[13px] font-medium leading-snug text-[#1a1a1a] transition-colors duration-200 group-hover:text-[#ff4b2b] sm:mt-4 sm:text-[14px]">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
