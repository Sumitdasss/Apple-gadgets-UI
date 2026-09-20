/* eslint-disable react-hooks/static-components */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ShoppingCart,
  ArrowDownUp,
} from "lucide-react";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const [excludeStock, setExcludeStock] = useState(true);

  const [selectedSeries, setSelectedSeries] = useState([]);
  const [selectedDisplay, setSelectedDisplay] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState([]);
  const [selectedProcessor, setSelectedProcessor] = useState([]);

  const [sortBy, setSortBy] = useState("default");

  const [openSections, setOpenSections] = useState({
    price: true,
    series: true,
    display: true,
    storage: true,
    processor: true,
  });

  // ============================================
  // Category Name
  // ============================================

  const categoryName = useMemo(() => {
    if (!slug) return "";

    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [slug]);

  // ============================================
  // Get Products
  // ============================================

  useEffect(() => {
    if (!slug) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        /*
          IMPORTANT:

          যদি তোমার backend endpoint অন্য কিছু হয়,
          শুধু নিচের URL change করবে।

          Example:
          /products
          /getproducts
          /api/products
        */

        const response = await fetch(
          `${API_BASE}/getallProduct?category=${encodeURIComponent(slug)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        const productList = Array.isArray(data)
          ? data
          : data.products || data.data || [];

        setProducts(productList);
      } catch (error) {
        console.error("Category products error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  // ============================================
  // Helper
  // ============================================

  const getProductImage = (product) => {
    if (!product?.images) {
      return "/placeholder.png";
    }

    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];

      if (typeof firstImage === "string") {
        return firstImage;
      }

      return (
        firstImage?.url ||
        firstImage?.secure_url ||
        firstImage?.src ||
        "/placeholder.png"
      );
    }

    if (typeof product.images === "string") {
      return product.images;
    }

    return "/placeholder.png";
  };

  const getProductPrice = (product) => {
    return Number(
      product.discountPrice ||
        product.price ||
        0
    );
  };

  const getOriginalPrice = (product) => {
    return Number(product.price || 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD").format(price);
  };

  // ============================================
  // Dynamic Filter Options
  // ============================================

  const seriesOptions = useMemo(() => {
    const values = products
      .map((product) => product.series)
      .filter(Boolean);

    return [...new Set(values)];
  }, [products]);

  const displayOptions = useMemo(() => {
    const values = products
      .map(
        (product) =>
          product.displaySize ||
          product.display ||
          product.screenSize
      )
      .filter(Boolean);

    return [...new Set(values)];
  }, [products]);

  const storageOptions = useMemo(() => {
    const values = products
      .map((product) => product.storage)
      .filter(Boolean);

    return [...new Set(values)];
  }, [products]);

  const processorOptions = useMemo(() => {
    const values = products
      .map((product) => product.processor)
      .filter(Boolean);

    return [...new Set(values)];
  }, [products]);

  // ============================================
  // Toggle Filter
  // ============================================

  const toggleArrayFilter = (
    value,
    selected,
    setSelected
  ) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  // ============================================
  // Filter Products
  // ============================================

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Price
    if (priceMin !== "") {
      result = result.filter(
        (product) =>
          getProductPrice(product) >= Number(priceMin)
      );
    }

    if (priceMax !== "") {
      result = result.filter(
        (product) =>
          getProductPrice(product) <= Number(priceMax)
      );
    }

    // Stock
    if (excludeStock) {
      result = result.filter(
        (product) =>
          product.stock === undefined ||
          Number(product.stock) > 0
      );
    }

    // Series
    if (selectedSeries.length > 0) {
      result = result.filter((product) =>
        selectedSeries.includes(product.series)
      );
    }

    // Display
    if (selectedDisplay.length > 0) {
      result = result.filter((product) => {
        const value =
          product.displaySize ||
          product.display ||
          product.screenSize;

        return selectedDisplay.includes(value);
      });
    }

    // Storage
    if (selectedStorage.length > 0) {
      result = result.filter((product) =>
        selectedStorage.includes(product.storage)
      );
    }

    // Processor
    if (selectedProcessor.length > 0) {
      result = result.filter((product) =>
        selectedProcessor.includes(product.processor)
      );
    }

    // Sort
    if (sortBy === "low") {
      result.sort(
        (a, b) =>
          getProductPrice(a) -
          getProductPrice(b)
      );
    }

    if (sortBy === "high") {
      result.sort(
        (a, b) =>
          getProductPrice(b) -
          getProductPrice(a)
      );
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );
    }

    return result;
  }, [
    products,
    priceMin,
    priceMax,
    excludeStock,
    selectedSeries,
    selectedDisplay,
    selectedStorage,
    selectedProcessor,
    sortBy,
  ]);

  // ============================================
  // Section Toggle
  // ============================================

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ============================================
  // Checkbox Component
  // ============================================

  const FilterCheckbox = ({
    label,
    checked,
    onChange,
  }) => {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-gray-700 hover:text-gray-900">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 cursor-pointer accent-orange-500"
        />

        <span>{label}</span>
      </label>
    );
  };

  // ============================================
  // Loading
  // ============================================

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />

          <div className="mt-4 h-10 w-40 animate-pulse rounded bg-gray-200" />

          <div className="mt-8 grid gap-5 lg:grid-cols-[240px_1fr]">
            <div className="h-[700px] animate-pulse rounded-xl bg-gray-100" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[330px] animate-pulse rounded-2xl bg-gray-100"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 lg:px-8">

        {/* ================= Breadcrumb ================= */}

        <div className="mb-2 flex items-center gap-1 text-[11px] text-gray-500">
          <Link
            href="/"
            className="hover:text-black"
          >
            Home
          </Link>

          <span>›</span>

          <span>Mobile Phone</span>

          <span>›</span>

          <span className="font-medium text-gray-700">
            {categoryName}
          </span>
        </div>

        {/* ================= Title ================= */}

        <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
          {categoryName}
        </h1>

        {/* ================= Main Layout ================= */}

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">

          {/* =====================================================
              SIDEBAR
          ===================================================== */}

          <aside className="h-fit overflow-hidden rounded-lg border border-gray-200 bg-white">

            {/* Filter Header */}

            <div className="border-b border-gray-200 px-3 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Filters
                </h2>

                <SlidersHorizontal
                  size={18}
                  className="text-gray-500 lg:hidden"
                />
              </div>
            </div>

            {/* ================= Price ================= */}

            <div className="border-b border-gray-200 px-3 py-3">
              <button
                type="button"
                onClick={() =>
                  toggleSection("price")
                }
                className="flex w-full items-center justify-between"
              >
                <span className="text-sm font-semibold">
                  Price Range
                </span>

                {openSections.price ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {openSections.price && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceMin}
                      onChange={(e) =>
                        setPriceMin(e.target.value)
                      }
                      placeholder="0"
                      className="h-9 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-gray-500"
                    />

                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) =>
                        setPriceMax(e.target.value)
                      }
                      placeholder="275000"
                      className="h-9 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-gray-500"
                    />

                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-orange-300 bg-orange-50 text-orange-600 hover:bg-orange-100"
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ================= Stock ================= */}

            <div className="border-b border-gray-200 px-3 py-3">
              <FilterCheckbox
                label="Exclude Out of Stock"
                checked={excludeStock}
                onChange={(e) =>
                  setExcludeStock(e.target.checked)
                }
              />
            </div>

            {/* ================= Series ================= */}

            <div className="border-b border-gray-200 px-3 py-3">
              <button
                type="button"
                onClick={() =>
                  toggleSection("series")
                }
                className="flex w-full items-center justify-between"
              >
                <span className="text-sm font-semibold">
                  Series
                </span>

                {openSections.series ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {openSections.series && (
                <div className="mt-3">

                  <input
                    type="text"
                    placeholder="Search Series"
                    className="mb-2 h-8 w-full rounded-full border border-gray-200 bg-gray-50 px-3 text-xs outline-none focus:border-gray-400"
                  />

                  <div className="space-y-2">
                    {(
                      seriesOptions.length
                        ? seriesOptions
                        : [
                            "18 Series",
                            "17 Series",
                            "16 Series",
                            "15 Series",
                            "14 Series",
                            "13 Series",
                            "Air Series",
                            "Duo Series",
                          ]
                    ).map((item) => (
                      <FilterCheckbox
                        key={item}
                        label={item}
                        checked={selectedSeries.includes(
                          item
                        )}
                        onChange={() =>
                          toggleArrayFilter(
                            item,
                            selectedSeries,
                            setSelectedSeries
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ================= Display ================= */}

            <div className="border-b border-gray-200 px-3 py-3">
              <button
                type="button"
                onClick={() =>
                  toggleSection("display")
                }
                className="flex w-full items-center justify-between"
              >
                <span className="text-sm font-semibold">
                  Display Size
                </span>

                {openSections.display ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {openSections.display && (
                <div className="mt-3 space-y-2">
                  {(
                    displayOptions.length
                      ? displayOptions
                      : [
                          "6.1 – 6.4 Inch",
                          "7.0 – 7.9 Inch",
                          "6.5 – 6.9 Inch",
                        ]
                  ).map((item) => (
                    <FilterCheckbox
                      key={item}
                      label={item}
                      checked={selectedDisplay.includes(
                        item
                      )}
                      onChange={() =>
                        toggleArrayFilter(
                          item,
                          selectedDisplay,
                          setSelectedDisplay
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ================= Storage ================= */}

            <div className="border-b border-gray-200 px-3 py-3">
              <button
                type="button"
                onClick={() =>
                  toggleSection("storage")
                }
                className="flex w-full items-center justify-between"
              >
                <span className="text-sm font-semibold">
                  Storage
                </span>

                {openSections.storage ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {openSections.storage && (
                <div className="mt-3 space-y-2">
                  {(
                    storageOptions.length
                      ? storageOptions
                      : [
                          "128GB",
                          "256GB",
                          "512GB",
                          "1TB & Above",
                        ]
                  ).map((item) => (
                    <FilterCheckbox
                      key={item}
                      label={item}
                      checked={selectedStorage.includes(
                        item
                      )}
                      onChange={() =>
                        toggleArrayFilter(
                          item,
                          selectedStorage,
                          setSelectedStorage
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ================= Processor ================= */}

            <div className="px-3 py-3">
              <button
                type="button"
                onClick={() =>
                  toggleSection("processor")
                }
                className="flex w-full items-center justify-between"
              >
                <span className="text-sm font-semibold">
                  Processor
                </span>

                {openSections.processor ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </button>

              {openSections.processor && (
                <div className="mt-3 space-y-2">
                  {(
                    processorOptions.length
                      ? processorOptions
                      : [
                          "A Series Bionic",
                          "M Series",
                          "Snapdragon",
                        ]
                  ).map((item) => (
                    <FilterCheckbox
                      key={item}
                      label={item}
                      checked={selectedProcessor.includes(
                        item
                      )}
                      onChange={() =>
                        toggleArrayFilter(
                          item,
                          selectedProcessor,
                          setSelectedProcessor
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* =====================================================
              PRODUCTS
          ===================================================== */}

          <section>

            {/* Top bar */}

            <div className="mb-3 flex items-center justify-between gap-3">

              <p className="text-xs text-gray-700">
                Showing:{" "}
                <span className="font-semibold">
                  {filteredProducts.length} Items
                </span>
              </p>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value)
                  }
                  className="h-8 appearance-none rounded-full border border-gray-200 bg-white py-1 pl-4 pr-9 text-xs outline-none focus:border-gray-400"
                >
                  <option value="default">
                    Sort By
                  </option>
                  <option value="newest">
                    Newest
                  </option>
                  <option value="low">
                    Price Low to High
                  </option>
                  <option value="high">
                    Price High to Low
                  </option>
                </select>

                <ArrowDownUp
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* Products */}

            {filteredProducts.length === 0 ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-300">
                <div className="text-center">
                  <h2 className="text-lg font-semibold">
                    No products found
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Try changing your filters.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">

                {filteredProducts.map((product) => {
                  const price =
                    getProductPrice(product);

                  const originalPrice =
                    getOriginalPrice(product);

                  const discount =
                    originalPrice > price
                      ? Math.round(
                          ((originalPrice - price) /
                            originalPrice) *
                            100
                        )
                      : 0;

                  const image =
                    getProductImage(product);

                  const outOfStock =
                    Number(product.stock) <= 0;

                  return (
                    <div
                      key={product._id}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    >

                      {/* Product Image */}

                      <Link
                        href={`/product/${product.slug}`}
                        className="relative block h-[270px] w-full"
                      >
                        <div className="relative h-full w-full p-4">
                          <img
                            src={image}
                            alt={
                              product.name ||
                              "Product"
                            }
                         
                            className="object-contain transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      </Link>

                      {/* Product Info */}

                      <div className="px-3 pb-3">

                        <Link
                          href={`/product/${product.slug}`}
                          className="block"
                        >
                          <h3 className="line-clamp-1 text-[15px] font-semibold text-gray-900 hover:text-orange-600">
                            {product.name}
                          </h3>
                        </Link>

                        {/* Price */}

                        <div className="mt-1 flex flex-wrap items-center gap-2">

                          <span className="text-[16px] font-semibold text-gray-900">
                            ৳{" "}
                            {formatPrice(price)}
                          </span>

                          {originalPrice > price && (
                            <span className="text-xs text-gray-400 line-through">
                              ৳{" "}
                              {formatPrice(
                                originalPrice
                              )}
                            </span>
                          )}
                        </div>

                        {/* Discount */}

                        {discount > 0 && (
                          <div className="mt-1">
                            <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-medium text-green-600">
                              ৳{" "}
                              {formatPrice(
                                originalPrice -
                                  price
                              )}{" "}
                              OFF
                            </span>
                          </div>
                        )}

                        {/* Buttons */}

                        <div className="mt-3 flex items-center gap-2">

                          <Link
                            href={`/product/${product.slug}`}
                            className="flex h-8 flex-1 items-center justify-center rounded-full border border-gray-200 text-xs font-medium transition hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                          >
                            {outOfStock
                              ? "Out of Stock"
                              : product.isPreOrder
                              ? "Pre Order"
                              : "Shop Now"}
                          </Link>

                          <button
                            type="button"
                            disabled={outOfStock}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-gray-900 hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            title="Add to cart"
                          >
                            <ShoppingCart size={14} />
                          </button>

                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}