"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

// Fallback images
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

  // =========================================
  // SLUG GENERATOR
  // =========================================
  const makeSlug = (item) => {
    if (!item) return "";

    if (item.slug) {
      return item.slug;
    }

    const name = item.name || item.title || item.label || "";

    return String(name)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // =========================================
  // NORMALIZE CATEGORY DATA
  // =========================================
  const normalizeCategories = (data) => {
    // -----------------------------------------
    // Case 1:
    // API returns:
    // { categories: [...] }
    // -----------------------------------------
    if (Array.isArray(data?.categories)) {
      return data.categories;
    }

    // -----------------------------------------
    // Case 2:
    // API returns:
    // { data: [...] }
    // -----------------------------------------
    if (Array.isArray(data?.data)) {
      return data.data;
    }

    // -----------------------------------------
    // Case 3:
    // API directly returns array
    // -----------------------------------------
    if (Array.isArray(data)) {
      return data;
    }

    // -----------------------------------------
    // Case 4:
    // Tree API returns something like:
    //
    // {
    //   mainCategories: [...]
    // }
    // -----------------------------------------
    if (Array.isArray(data?.mainCategories)) {
      return data.mainCategories;
    }

    // -----------------------------------------
    // Case 5:
    // Tree API returns:
    //
    // {
    //   tree: [...]
    // }
    // -----------------------------------------
    if (Array.isArray(data?.tree)) {
      return data.tree;
    }

    return [];
  };

  // =========================================
  // LOAD CATEGORIES
  // =========================================
  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        setLoading(true);

        // NEW CATEGORY TREE API
        const endpoint = `${API_BASE}/category/tree`;

        console.log("Loading featured categories from:", endpoint);

        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
        });

        const text = await response.text();

        // -----------------------------------------
        // Check HTTP status BEFORE JSON.parse
        // -----------------------------------------
        if (!response.ok) {
          console.error("Category API error:", response.status, text);

          throw new Error(`Category API returned ${response.status}`);
        }

        // -----------------------------------------
        // Parse JSON safely
        // -----------------------------------------
        let data;

        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          console.error("Category API did not return JSON:", text);

          throw new Error("Category API returned invalid JSON");
        }

        console.log("Category API response:", data);

        const list = normalizeCategories(data);

        // -----------------------------------------
        // New 4-level category structure
        // -----------------------------------------
        //
        // Main Category
        //     ↓
        // Sub Category
        //     ↓
        // Child Category
        //     ↓
        // Sub Child Category
        //
        // Featured section should show MAIN categories.
        // -----------------------------------------

        let rootCategories = [];

        // If tree API already returns main categories
        if (Array.isArray(data?.mainCategories)) {
          rootCategories = data.mainCategories;
        } else if (Array.isArray(data?.tree)) {
          rootCategories = data.tree;
        } else {
          // -----------------------------------------
          // Old / flat API fallback
          // -----------------------------------------
          const getParentId = (item) => {
            if (!item) return null;

            return (
              item.parent?._id ||
              item.parent?.id ||
              item.parent ||
              item.mainCategory?._id ||
              item.mainCategory?.id ||
              item.mainCategory ||
              null
            );
          };

          rootCategories = list.filter((item) => !getParentId(item));
        }

        // -----------------------------------------
        // Remove invalid categories
        // -----------------------------------------
        rootCategories = rootCategories.filter(
          (item) => item && (item._id || item.id || item.name || item.title),
        );

        // -----------------------------------------
        // Remove duplicate categories
        // -----------------------------------------
        const uniqueCategories = [];

        const seen = new Set();

        for (const category of rootCategories) {
          const id =
            category._id || category.id || category.slug || category.name;

          const key = String(id).trim().toLowerCase();

          if (!seen.has(key)) {
            seen.add(key);
            uniqueCategories.push(category);
          }
        }

        if (!cancelled) {
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Featured categories loading error:", error);

        if (!cancelled) {
          setCategories([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================
  // UI
  // =========================================
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
          /* Empty State */
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No categories found</p>
          </div>
        ) : (
          /* Categories Grid */
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 lg:gap-x-6 lg:gap-y-12">
            {categories.map((category, index) => {
              const categoryId =
                category._id || category.id || category.slug || category.name;

              const categoryName =
                category.name || category.title || category.label || "Category";

              const slug = makeSlug(category);

              return (
                <Link
                  key={categoryId}
                  href={`/category/${slug}`}
                  className="group flex flex-col items-center text-center"
                >
                  {/* Image Container */}
                  <div className="relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100 transition-all duration-300 group-hover:bg-white group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group-hover:ring-[#ff4b2b]/20 sm:h-[88px] sm:w-[88px]">
                    <img
                      src={
                        category.image ||
                        category.imageUrl ||
                        category.thumbnail ||
                        category.icon ||
                        categoryImages[index % categoryImages.length]
                      }
                      alt={categoryName}
                      className="h-[70%] w-[70%] object-contain transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;

                        event.currentTarget.src =
                          categoryImages[index % categoryImages.length];
                      }}
                    />
                  </div>

                  {/* Category Name */}
                  <h3 className="mt-3.5 max-w-[130px] text-[13px] font-medium leading-snug text-[#1a1a1a] transition-colors duration-200 group-hover:text-[#ff4b2b] sm:mt-4 sm:text-[14px]">
                    {categoryName}
                  </h3>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
