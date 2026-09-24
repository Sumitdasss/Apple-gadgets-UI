/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

export default function RecentlyViewed() {
  const [products, setProducts] = useState([]);

  // =====================================================
  // LOAD RECENTLY VIEWED
  // =====================================================
  const loadRecentlyViewed = useCallback(() => {
    try {
      const now = Date.now();

      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

      const saved = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");

      if (!Array.isArray(saved)) {
        setProducts([]);
        return;
      }

      // =================================================
      // REMOVE PRODUCTS OLDER THAN 30 DAYS
      // =================================================
      const validProducts = saved
        .map((item) => {
          // পুরোনো data হলে viewedAt নেই
          // একবার current time assign করবে
          if (!item?.viewedAt) {
            return {
              ...item,
              viewedAt: now,
            };
          }

          return item;
        })
        .filter((item) => {
          const viewedAt = Number(item?.viewedAt || 0);

          return viewedAt > 0 && now - viewedAt < THIRTY_DAYS;
        })
        .slice(0, 10);

      // =================================================
      // SAVE CLEAN DATA BACK TO LOCAL STORAGE
      // =================================================
      localStorage.setItem("recentlyViewed", JSON.stringify(validProducts));

      setProducts(validProducts);
    } catch (error) {
      console.error("Recently viewed load error:", error);

      setProducts([]);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD + UPDATE EVENT
  // =====================================================
  useEffect(() => {
    // First load
    loadRecentlyViewed();

    // Same tab update
    const handleRecentlyViewedUpdate = () => {
      loadRecentlyViewed();
    };

    window.addEventListener(
      "recentlyViewedUpdated",
      handleRecentlyViewedUpdate,
    );

    // Other tab update
    const handleStorage = (event) => {
      if (event.key === "recentlyViewed") {
        loadRecentlyViewed();
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "recentlyViewedUpdated",
        handleRecentlyViewedUpdate,
      );

      window.removeEventListener("storage", handleStorage);
    };
  }, [loadRecentlyViewed]);

  // =====================================================
  // NOTHING TO SHOW
  // =====================================================
  if (!products.length) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-sm text-gray-400">No recently viewed products</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================
  return (
    <div className="w-full">
      <div className="divide-y divide-gray-100">
        {products.slice(0, 10).map((product) => {
          const image =
            Array.isArray(product.images) && product.images.length > 0
              ? product.images[0]
              : "";

          const price = Number(product.price || 0);

          const discountPrice =
            product.discountPrice !== null &&
            product.discountPrice !== undefined
              ? Number(product.discountPrice)
              : null;

          const hasDiscount =
            discountPrice !== null &&
            discountPrice > 0 &&
            discountPrice < price;

          const finalPrice = hasDiscount ? discountPrice : price;

          return (
            <Link
              key={product._id}
              href={`/product/${product.slug || product._id}`}
              className="group block"
            >
              <div
                className="
                    flex
                    items-center
                    gap-3.5
                    px-4
                    py-4
                    transition-colors
                    duration-200
                    hover:bg-gray-50
                  "
              >
                {/* IMAGE */}
                <div
                  className="
                      w-[72px]
                      h-[72px]
                      flex-shrink-0
                      rounded-xl
                      bg-gray-50
                      border
                      border-gray-100
                      flex
                      items-center
                      justify-center
                      overflow-hidden
                    "
                >
                  {image ? (
                    <img
                      src={image}
                      alt={product.name || "Product"}
                      className="
                          w-full
                          h-full
                          object-contain
                          p-2
                          group-hover:scale-105
                          transition-transform
                          duration-300
                        "
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400">No Image</span>
                  )}
                </div>

                {/* INFO */}
                <div className="min-w-0 flex-1">
                  {/* BRAND */}
                  {product.brand && (
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1">
                      {product.brand}
                    </p>
                  )}

                  {/* NAME */}
                  <h3
                    className="
                        text-[13px]
                        sm:text-[14px]
                        font-medium
                        text-gray-900
                        leading-5
                        line-clamp-2
                        group-hover:text-orange-500
                        transition-colors
                      "
                  >
                    {product.name}
                  </h3>

                  {/* PRICE */}
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-gray-900">
                      ৳{finalPrice.toLocaleString()}
                    </span>

                    {hasDiscount && (
                      <span className="text-[11px] text-gray-400 line-through">
                        ৳{price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
