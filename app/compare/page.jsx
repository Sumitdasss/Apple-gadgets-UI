"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Search, X, ChevronRight } from "lucide-react";
import useCompareStore from "../Store/compareStore.js";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

export default function ComparePage() {
  const { compareProducts, removeFromCompare, addToCompare } = useCompareStore();
  const [searchValue, setSearchValue] = useState(["", "", ""]);
  const [searchResults, setSearchResults] = useState([[], [], []]);
  const [searching, setSearching] = useState([false, false, false]);

  // =====================================================
  // Build specification rows exactly like Product Details page
  // =====================================================
  const specificationRows = useMemo(() => {
    // Always start with Brand & Model (same as detail page)
    const rows = [
      { key: "brand", label: "Brand" },
      { key: "model", label: "Model" },
    ];

    // Collect all unique specification keys from selected products
    // (preserving order as much as possible)
    const seen = new Set(["brand", "model"]);

    compareProducts.forEach((product) => {
      if (!Array.isArray(product.specifications)) return;

      product.specifications.forEach((spec) => {
        const key = String(spec?.key || "").trim();
        if (!key) return;

        const lowerKey = key.toLowerCase();
        if (seen.has(lowerKey)) return;
        if (["brand", "model"].includes(lowerKey)) return;

        seen.add(lowerKey);
        rows.push({
          key: key, // keep original casing for display
          label: key,
        });
      });
    });

    return rows;
  }, [compareProducts]);

  // =====================================================
  // Get value for a product + row (same logic as detail page)
  // =====================================================
  const getValue = (product, rowKey) => {
    if (!product) return "—";

    const lowerKey = rowKey.toLowerCase();

    // Brand
    if (lowerKey === "brand") {
      return product.brand || "—";
    }

    // Model → product name
    if (lowerKey === "model") {
      return product.name || "—";
    }

    // Look inside specifications array
    if (Array.isArray(product.specifications)) {
      const found = product.specifications.find(
        (s) => String(s?.key || "").trim().toLowerCase() === lowerKey
      );
      if (found?.value) return found.value;
    }

    // Fallback to direct property (if you store any)
    if (product[rowKey]) return product[rowKey];
    if (product[lowerKey]) return product[lowerKey];

    return "—";
  };

  // =====================================================
  // Search
  // =====================================================
  const handleSearch = async (index, value) => {
    const newValues = [...searchValue];
    newValues[index] = value;
    setSearchValue(newValues);

    if (!value.trim()) {
      const newResults = [...searchResults];
      newResults[index] = [];
      setSearchResults(newResults);
      return;
    }

    const newSearching = [...searching];
    newSearching[index] = true;
    setSearching(newSearching);

    try {
      const res = await fetch(
        `${API_BASE}/api/dashboard/products?search=${encodeURIComponent(
          value.trim()
        )}`
      );
      const data = await res.json();
      const products = Array.isArray(data)
        ? data
        : data?.products || data?.data || [];

      const newResults = [...searchResults];
      newResults[index] = products.slice(0, 8);
      setSearchResults(newResults);
    } catch (err) {
      console.error(err);
    } finally {
      const newSearching = [...searching];
      newSearching[index] = false;
      setSearching(newSearching);
    }
  };

  const handleSelectProduct = (index, product) => {
    // Make sure we keep the full product (especially specifications)
    addToCompare(product);

    const newValues = [...searchValue];
    newValues[index] = "";
    setSearchValue(newValues);

    const newResults = [...searchResults];
    newResults[index] = [];
    setSearchResults(newResults);
  };

  const emptySlots = Math.max(0, 3 - compareProducts.length);

  return (
    <main className={`${inter.className} min-h-screen bg-[#f8f9fb] text-gray-900`}>
      {/* Breadcrumb */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5">
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-500">
          <Link href="/" className="hover:text-orange-600 transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-800 font-medium">Compare</span>
        </nav>
      </div>

      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 pb-20">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-8">
          Compare Selected Product
        </h1>

        {/* Compare table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header – product cards */}
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
            {/* Left info column */}
            <div className="hidden md:block border-r border-gray-100 bg-gray-50/50 p-5">
              <h3 className="font-semibold text-gray-900 text-[15px]">
                Compare Products
              </h3>
              <p className="text-[13px] text-gray-500 mt-1.5 leading-relaxed">
                Find and select products to see the differences and similarities between them
              </p>
            </div>

            {/* Product slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Selected products */}
              {compareProducts.map((product) => (
                <div
                  key={product._id}
                  className="border-b sm:border-b-0 sm:border-r border-gray-100 last:border-r-0 p-5 flex flex-col items-center text-center relative"
                >
                  <button
                    onClick={() => removeFromCompare(product._id)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-rose-50 text-gray-500 hover:text-rose-600 flex items-center justify-center transition-colors"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>

                  <div className="w-28 h-28 sm:w-32 sm:h-32 mb-4 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  <h4 className="font-medium text-[14px] text-gray-900 line-clamp-2 mb-2">
                    {product.name}
                  </h4>

                  <div className="text-lg font-bold text-gray-900 mb-4">
                    ৳{product.price?.toLocaleString() || "—"}
                  </div>

                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => removeFromCompare(product._id)}
                      className="flex-1 h-9 rounded-full border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Remove
                    </button>
                    <Link
                      href={`/Product/${product.slug}`}
                      className="flex-1 h-9 rounded-full bg-orange-500 text-white text-[13px] font-medium flex items-center justify-center hover:bg-orange-600 transition"
                    >
                      Shop Now
                    </Link>
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: emptySlots }).map((_, i) => {
                const slotIndex = compareProducts.length + i;
                return (
                  <div
                    key={`empty-${i}`}
                    className="border-b sm:border-b-0 sm:border-r border-gray-100 last:border-r-0 p-5 flex flex-col relative"
                  >
                    <div className="relative mb-4">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchValue[slotIndex] || ""}
                        onChange={(e) => handleSearch(slotIndex, e.target.value)}
                        className="w-full h-10 pl-9 pr-3 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                      />
                    </div>

                    {/* Search dropdown */}
                    {searchResults[slotIndex]?.length > 0 && (
                      <div className="absolute z-30 left-5 right-5 top-[70px] max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                        {searchResults[slotIndex].map((p) => (
                          <button
                            key={p._id}
                            onClick={() => handleSelectProduct(slotIndex, p)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-orange-50 text-left transition"
                          >
                            <img
                              src={p.images?.[0] || p.image || ""}
                              alt=""
                              className="w-10 h-10 object-contain rounded"
                            />
                            <div className="min-w-0">
                              <p className="text-[13px] font-medium text-gray-900 truncate">
                                {p.name}
                              </p>
                              <p className="text-[12px] text-gray-500">
                                ৳
                                {Number(
                                  p.discountPrice ?? p.price ?? 0
                                ).toLocaleString()}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex-1 flex items-center justify-center min-h-[180px]">
                      <div className="w-16 h-16 rounded-full bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                        <Search size={22} className="text-gray-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specification rows – same style as Product Details */}
          {compareProducts.length > 0 && (
            <div className="border-t border-gray-100">
              {specificationRows.map((row) => (
                <div
                  key={row.key}
                  className="grid grid-cols-1 md:grid-cols-[220px_1fr] border-b border-gray-100 last:border-b-0"
                >
                  {/* Label */}
                  <div className="px-5 py-3.5 bg-gray-50/80 text-[13.5px] font-medium text-gray-600 border-r border-gray-100">
                    {row.label}
                  </div>

                  {/* Values */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {compareProducts.map((product) => (
                      <div
                        key={product._id}
                        className="px-5 py-3.5 text-[13.5px] text-gray-900 border-r border-gray-100 last:border-r-0 break-words"
                      >
                        {getValue(product, row.key)}
                      </div>
                    ))}

                    {/* empty cells */}
                    {Array.from({ length: emptySlots }).map((_, i) => (
                      <div
                        key={`empty-cell-${i}`}
                        className="px-5 py-3.5 border-r border-gray-100 last:border-r-0"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {compareProducts.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg font-medium mb-2">No products to compare</p>
            <p className="text-sm mb-6">
              Go to any product page and click the{" "}
              <span className="text-orange-500">Compare</span> button.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition"
            >
              Browse Products
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}