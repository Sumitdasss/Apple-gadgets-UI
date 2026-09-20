/* eslint-disable react-hooks/globals */
/* eslint-disable react-hooks/static-components */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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

  // ============================================
  // PRICE
  // ============================================

  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  // ============================================
  // STOCK
  // ============================================

  const [excludeStock, setExcludeStock] = useState(true);

  // ============================================
  // FILTER STATES
  // ============================================

  const [selectedBrand, setSelectedBrand] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState([]);
  const [selectedDisplay, setSelectedDisplay] = useState([]);
  const [selectedStorage, setSelectedStorage] = useState([]);
  const [selectedProcessor, setSelectedProcessor] = useState([]);
  const [selectedBattery, setSelectedBattery] = useState([]);
  const [selectedRam, setSelectedRam] = useState([]);

  // ============================================
  // SORT
  // ============================================

  const [sortBy, setSortBy] = useState("default");

  // ============================================
  // OPEN SECTIONS
  // ============================================

  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    series: true,
    display: true,
    storage: true,
    processor: true,
    battery: true,
    ram: true,
  });

  // ============================================
  // CATEGORY NAME
  // ============================================

  const categoryName = useMemo(() => {
    if (!slug) return "";

    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [slug]);

  // ============================================
  // GET PRODUCTS
  // ============================================

  useEffect(() => {
    if (!slug) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);

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

        console.log("CATEGORY PRODUCTS:", productList);

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
  // PRODUCT IMAGE
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

  // ============================================
  // PRICE
  // ============================================

  const getProductPrice = (product) => {
    return Number(product?.discountPrice || product?.price || 0);
  };

  const getOriginalPrice = (product) => {
    return Number(product?.price || 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-BD").format(price);
  };

  // ============================================
  // SPECIFICATION HELPER
  //
  // তোমার DB:
  //
  // specifications: [
  //   {
  //     name: "Display",
  //     value: "6.9 inch"
  //   },
  //   ...
  // ]
  //
  // ============================================

  const getSpecificationValues = (product, keys = []) => {
    const specifications = product?.specifications;

    if (!Array.isArray(specifications)) {
      return [];
    }

    const normalizedKeys = keys.map((key) =>
      String(key).trim().toLowerCase()
    );

    const result = [];

    specifications.forEach((item) => {
      if (!item || typeof item !== "object") return;

      const itemName = String(
        item.name ||
          item.key ||
          item.title ||
          item.label ||
          item.specification ||
          item.attribute ||
          ""
      )
        .trim()
        .toLowerCase();

      if (!normalizedKeys.includes(itemName)) {
        return;
      }

      const value =
        item.value ??
        item.data ??
        item.specificationValue ??
        item.content ??
        "";

      if (Array.isArray(value)) {
        value.forEach((itemValue) => {
          if (
            itemValue !== undefined &&
            itemValue !== null &&
            String(itemValue).trim() !== ""
          ) {
            result.push(String(itemValue).trim());
          }
        });
      } else if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        result.push(String(value).trim());
      }
    });

    return [...new Set(result)];
  };

  // ============================================
  // BRAND
  //
  // DB:
  // brand: "Apple"
  // ============================================

  const getBrandValues = (product) => {
    if (
      product?.brand !== undefined &&
      product?.brand !== null &&
      String(product.brand).trim() !== ""
    ) {
      if (typeof product.brand === "object") {
        const value =
          product.brand.name ||
          product.brand.title ||
          product.brand.value ||
          "";

        return value ? [String(value).trim()] : [];
      }

      return [String(product.brand).trim()];
    }

    return getSpecificationValues(product, [
      "brand",
      "brand name",
    ]);
  };

  // ============================================
  // SERIES
  // ============================================

  const getSeriesValues = (product) => {
    return getSpecificationValues(product, [
      "series",
      "model series",
      "series name",
    ]);
  };

  // ============================================
  // DISPLAY
  // ============================================

  const getDisplayValues = (product) => {
    return getSpecificationValues(product, [
      "display",
      "display size",
      "screen",
      "screen size",
      "displaySize",
      "screenSize",
    ]);
  };

  // ============================================
  // PROCESSOR
  // ============================================

  const getProcessorValues = (product) => {
    return getSpecificationValues(product, [
      "processor",
      "cpu",
      "chip",
      "chipset",
      "processor name",
    ]);
  };

  // ============================================
  // BATTERY
  // ============================================

  const getBatteryValues = (product) => {
    return getSpecificationValues(product, [
      "battery",
      "battery capacity",
      "battery size",
      "batteryCapacity",
    ]);
  };

  // ============================================
  // ROOT LEVEL RAM
  //
  // তোমার actual DB:
  //
  // ram: [
  //   "2TB 12GB RAM",
  //   "1TB 12GB RAM",
  //   "512GB 12GB RAM",
  //   "256GB 12GB RAM"
  // ]
  //
  // ============================================

  const getRawRamValues = (product) => {
    const ram = product?.ram;

    if (!Array.isArray(ram)) {
      return [];
    }

    return ram
      .filter(
        (item) =>
          item !== undefined &&
          item !== null &&
          String(item).trim() !== ""
      )
      .map((item) => String(item).trim());
  };

  // ============================================
  // GET STORAGE FROM ROOT ram FIELD
  //
  // "2TB 12GB RAM" => "2TB"
  // "1TB 12GB RAM" => "1TB"
  // "512GB 12GB RAM" => "512GB"
  // "256GB 12GB RAM" => "256GB"
  //
  // ============================================

  const getStorageValues = (product) => {
  const ramValues = product?.ram;

  if (!Array.isArray(ramValues)) {
    return [];
  }

  const storageValues = [];

  ramValues.forEach((value) => {
    const text = String(value || "").trim();

    if (!text) return;

    // "12GB RAM" অংশটা সম্পূর্ণ বাদ দিচ্ছি
    const storagePart = text.replace(
      /\b\d+(?:\.\d+)?\s*GB\s*RAM\b/gi,
      ""
    );

    // এখন শুধু RAM বাদ দেওয়ার পরের অংশ থেকে storage খুঁজছি
    const match = storagePart.match(
      /\b\d+(?:\.\d+)?\s*(?:TB|GB)\b/i
    );

    if (match) {
      storageValues.push(
        match[0]
          .replace(/\s+/g, "")
          .toUpperCase()
      );
    }
  });

  return [...new Set(storageValues)];
};

  // ============================================
  // GET RAM
  //
  // "2TB 12GB RAM" => "12GB"
  // "512GB 16GB RAM" => "16GB"
  //
  // ============================================

  const getRamValues = (product) => {
    const ramValues = getRawRamValues(product);

    const finalValues = [];

    ramValues.forEach((value) => {
      const text = String(value).trim();

      const match = text.match(
        /\b\d+(?:\.\d+)?\s*GB\s*RAM\b/i
      );

      if (match) {
        finalValues.push(
          match[0]
            .replace(/\s*RAM\b/i, "")
            .replace(/\s+/g, "")
            .toUpperCase()
        );
      }
    });

    return [...new Set(finalValues)];
  };

  // ============================================
  // DEBUG
  // ============================================

  useEffect(() => {
    if (!products.length) return;

    console.log("========== FILTER DATA ==========");

    console.log(
      "RAM ROOT:",
      products.map((product) => product.ram)
    );

    console.log(
      "STORAGE:",
      products.map((product) =>
        getStorageValues(product)
      )
    );

    console.log(
      "RAM:",
      products.map((product) =>
        getRamValues(product)
      )
    );

    console.log(
      "SPECIFICATIONS:",
      products.map(
        (product) => product.specifications
      )
    );

    console.log("=================================");
  }, [products]);

  // ============================================
  // DYNAMIC BRAND OPTIONS
  // ============================================

  const brandOptions = useMemo(() => {
    const values = products.flatMap((product) =>
      getBrandValues(product)
    );

    return [...new Set(values)]
      .filter(Boolean)
      .sort();
  }, [products]);

  // ============================================
  // DYNAMIC SERIES OPTIONS
  // ============================================

  const seriesOptions = useMemo(() => {
    const values = products.flatMap((product) =>
      getSeriesValues(product)
    );

    return [...new Set(values)]
      .filter(Boolean)
      .sort();
  }, [products]);

  // ============================================
  // DYNAMIC DISPLAY OPTIONS
  // ============================================

  const displayOptions = useMemo(() => {
    const values = products.flatMap((product) =>
      getDisplayValues(product)
    );

    return [...new Set(values)]
      .filter(Boolean)
      .sort();
  }, [products]);

  // ============================================
  // DYNAMIC STORAGE OPTIONS
  // ============================================

  const storageOptions = useMemo(() => {
    const values = products.flatMap((product) =>
      getStorageValues(product)
    );

    return [...new Set(values)]
      .filter(Boolean)
      .sort((a, b) => {
        const getNumber = (value) => {
          const match = String(value).match(
            /\d+(?:\.\d+)?/
          );

          if (!match) return 0;

          const number = Number(match[0]);

          if (
            String(value)
              .toUpperCase()
              .includes("TB")
          ) {
            return number * 1024;
          }

          return number;
        };

        return getNumber(a) - getNumber(b);
      });
  }, [products]);

  // ============================================
  // DYNAMIC PROCESSOR OPTIONS
  // ============================================

  const processorOptions = useMemo(() => {
    const values = products.flatMap((product) =>
      getProcessorValues(product)
    );

    return [...new Set(values)]
      .filter(Boolean)
      .sort();
  }, [products]);

  // ============================================
  // DYNAMIC BATTERY OPTIONS
  // ============================================

  const batteryOptions = useMemo(() => {
    const values = products.flatMap((product) =>
      getBatteryValues(product)
    );

    return [...new Set(values)]
      .filter(Boolean)
      .sort();
  }, [products]);

  // ============================================
  // DYNAMIC RAM OPTIONS
  // ============================================

  const ramOptions = useMemo(() => {
    const values = products.flatMap((product) =>
      getRamValues(product)
    );

    return [...new Set(values)]
      .filter(Boolean)
      .sort((a, b) => {
        const numA =
          Number(
            String(a).match(
              /\d+(?:\.\d+)?/
            )?.[0]
          ) || 0;

        const numB =
          Number(
            String(b).match(
              /\d+(?:\.\d+)?/
            )?.[0]
          ) || 0;

        return numA - numB;
      });
  }, [products]);

  // ============================================
  // TOGGLE FILTER
  // ============================================

  const toggleArrayFilter = (
    value,
    setSelected
  ) => {
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter(
            (item) => item !== value
          )
        : [...prev, value]
    );
  };

  // ============================================
  // FILTER PRODUCTS
  // ============================================

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // PRICE MIN
    if (priceMin !== "") {
      result = result.filter(
        (product) =>
          getProductPrice(product) >=
          Number(priceMin)
      );
    }

    // PRICE MAX
    if (priceMax !== "") {
      result = result.filter(
        (product) =>
          getProductPrice(product) <=
          Number(priceMax)
      );
    }

    // STOCK
    if (excludeStock) {
      result = result.filter(
        (product) =>
          product.stock === undefined ||
          product.stock === null ||
          Number(product.stock) > 0
      );
    }

    // BRAND
    if (selectedBrand.length > 0) {
      result = result.filter((product) => {
        const values =
          getBrandValues(product);

        return values.some((value) =>
          selectedBrand.includes(value)
        );
      });
    }

    // SERIES
    if (selectedSeries.length > 0) {
      result = result.filter((product) => {
        const values =
          getSeriesValues(product);

        return values.some((value) =>
          selectedSeries.includes(value)
        );
      });
    }

    // DISPLAY
    if (selectedDisplay.length > 0) {
      result = result.filter((product) => {
        const values =
          getDisplayValues(product);

        return values.some((value) =>
          selectedDisplay.includes(value)
        );
      });
    }

    // STORAGE
    if (selectedStorage.length > 0) {
      result = result.filter((product) => {
        const values =
          getStorageValues(product);

        return values.some((value) =>
          selectedStorage.includes(value)
        );
      });
    }

    // PROCESSOR
    if (selectedProcessor.length > 0) {
      result = result.filter((product) => {
        const values =
          getProcessorValues(product);

        return values.some((value) =>
          selectedProcessor.includes(value)
        );
      });
    }

    // BATTERY
    if (selectedBattery.length > 0) {
      result = result.filter((product) => {
        const values =
          getBatteryValues(product);

        return values.some((value) =>
          selectedBattery.includes(value)
        );
      });
    }

    // RAM
    if (selectedRam.length > 0) {
      result = result.filter((product) => {
        const values =
          getRamValues(product);

        return values.some((value) =>
          selectedRam.includes(value)
        );
      });
    }

    // SORT
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
    selectedBrand,
    selectedSeries,
    selectedDisplay,
    selectedStorage,
    selectedProcessor,
    selectedBattery,
    selectedRam,
    sortBy,
  ]);

  // ============================================
  // SECTION TOGGLE
  // ============================================

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ============================================
  // CHECKBOX
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
  // LOADING
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
              {Array.from({ length: 6 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-[330px] animate-pulse rounded-2xl bg-gray-100"
                  />
                )
              )}
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

        {/* BREADCRUMB */}

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

        {/* TITLE */}

        <h1 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl">
          {categoryName}
        </h1>

        {/* MAIN LAYOUT */}

        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">

          {/* SIDEBAR */}

          <aside className="h-fit overflow-hidden rounded-lg border border-gray-200 bg-white">

            {/* FILTER HEADER */}

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

            {/* PRICE */}

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
                        setPriceMin(
                          e.target.value
                        )
                      }
                      placeholder="0"
                      className="h-9 w-full rounded border border-gray-300 px-2 text-xs outline-none focus:border-gray-500"
                    />

                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) =>
                        setPriceMax(
                          e.target.value
                        )
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

            {/* STOCK */}

            <div className="border-b border-gray-200 px-3 py-3">
              <FilterCheckbox
                label="Exclude Out of Stock"
                checked={excludeStock}
                onChange={(e) =>
                  setExcludeStock(
                    e.target.checked
                  )
                }
              />
            </div>

            {/* BRAND */}

            {brandOptions.length > 0 && (
              <div className="border-b border-gray-200 px-3 py-3">

                <button
                  type="button"
                  onClick={() =>
                    toggleSection("brand")
                  }
                  className="flex w-full items-center justify-between"
                >
                  <span className="text-sm font-semibold">
                    Brand
                  </span>

                  {openSections.brand ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {openSections.brand && (
                  <div className="mt-3 space-y-2">
                    {brandOptions.map(
                      (item) => (
                        <FilterCheckbox
                          key={item}
                          label={item}
                          checked={selectedBrand.includes(
                            item
                          )}
                          onChange={() =>
                            toggleArrayFilter(
                              item,
                              setSelectedBrand
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}

              </div>
            )}

            {/* SERIES */}

            {seriesOptions.length > 0 && (
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
                  <div className="mt-3 space-y-2">
                    {seriesOptions.map(
                      (item) => (
                        <FilterCheckbox
                          key={item}
                          label={item}
                          checked={selectedSeries.includes(
                            item
                          )}
                          onChange={() =>
                            toggleArrayFilter(
                              item,
                              setSelectedSeries
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}

              </div>
            )}

            {/* DISPLAY */}

            {displayOptions.length > 0 && (
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
                    {displayOptions.map(
                      (item) => (
                        <FilterCheckbox
                          key={item}
                          label={item}
                          checked={selectedDisplay.includes(
                            item
                          )}
                          onChange={() =>
                            toggleArrayFilter(
                              item,
                              setSelectedDisplay
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}

              </div>
            )}

            {/* STORAGE */}

            {storageOptions.length > 0 && (
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
                    {storageOptions.map(
                      (item) => (
                        <FilterCheckbox
                          key={item}
                          label={item}
                          checked={selectedStorage.includes(
                            item
                          )}
                          onChange={() =>
                            toggleArrayFilter(
                              item,
                              setSelectedStorage
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}

              </div>
            )}

            {/* PROCESSOR */}

            {processorOptions.length > 0 && (
              <div className="border-b border-gray-200 px-3 py-3">

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
                    {processorOptions.map(
                      (item) => (
                        <FilterCheckbox
                          key={item}
                          label={item}
                          checked={selectedProcessor.includes(
                            item
                          )}
                          onChange={() =>
                            toggleArrayFilter(
                              item,
                              setSelectedProcessor
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}

              </div>
            )}

            {/* BATTERY */}

            {batteryOptions.length > 0 && (
              <div className="border-b border-gray-200 px-3 py-3">

                <button
                  type="button"
                  onClick={() =>
                    toggleSection("battery")
                  }
                  className="flex w-full items-center justify-between"
                >
                  <span className="text-sm font-semibold">
                    Battery Capacity
                  </span>

                  {openSections.battery ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {openSections.battery && (
                  <div className="mt-3 space-y-2">
                    {batteryOptions.map(
                      (item) => (
                        <FilterCheckbox
                          key={item}
                          label={item}
                          checked={selectedBattery.includes(
                            item
                          )}
                          onChange={() =>
                            toggleArrayFilter(
                              item,
                              setSelectedBattery
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}

              </div>
            )}

            {/* RAM */}

            {ramOptions.length > 0 && (
              <div className="px-3 py-3">

                <button
                  type="button"
                  onClick={() =>
                    toggleSection("ram")
                  }
                  className="flex w-full items-center justify-between"
                >
                  <span className="text-sm font-semibold">
                    RAM
                  </span>

                  {openSections.ram ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>

                {openSections.ram && (
                  <div className="mt-3 space-y-2">
                    {ramOptions.map(
                      (item) => (
                        <FilterCheckbox
                          key={item}
                          label={item}
                          checked={selectedRam.includes(
                            item
                          )}
                          onChange={() =>
                            toggleArrayFilter(
                              item,
                              setSelectedRam
                            )
                          }
                        />
                      )
                    )}
                  </div>
                )}

              </div>
            )}

          </aside>

          {/* PRODUCTS */}

          <section>

            {/* TOP BAR */}

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

            {/* NO PRODUCTS */}

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

              /* PRODUCT GRID */

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">

                {filteredProducts.map(
                  (product) => {

                    const price =
                      getProductPrice(product);

                    const originalPrice =
                      getOriginalPrice(product);

                    const discount =
                      originalPrice > price
                        ? Math.round(
                            ((originalPrice -
                              price) /
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
                        className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                      >

                        {/* PRODUCT IMAGE */}

                        <Link
                          href={`/product/${product.slug}`}
                          className="relative block h-[260px] w-full overflow-hidden bg-gray-50"
                        >

                          <div className="relative h-full w-full p-5">

                            <img
                              src={image}
                              alt={
                                product.name ||
                                "Product"
                              }
                              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                            />

                          </div>

                          {/* DISCOUNT */}

                          {discount > 0 && (
                            <div className="absolute right-3 top-3">

                              <span className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                                ৳{" "}
                                {formatPrice(
                                  originalPrice -
                                    price
                                )}{" "}
                                OFF
                              </span>

                            </div>
                          )}

                        </Link>

                        {/* PRODUCT INFO */}

                        <div className="px-4 pb-4 pt-3">

                          <Link
                            href={`/product/${product.slug}`}
                            className="block"
                          >

                            <h3 className="line-clamp-1 text-[15px] font-semibold text-gray-900 transition-colors group-hover:text-orange-600">
                              {product.name}
                            </h3>

                          </Link>

                          {/* PRICE */}

                          <div className="mt-1.5 flex items-baseline gap-2">

                            <span className="text-[17px] font-bold text-gray-900">
                              ৳{" "}
                              {formatPrice(price)}
                            </span>

                            {originalPrice >
                              price && (
                              <span className="text-sm text-gray-400 line-through">
                                ৳{" "}
                                {formatPrice(
                                  originalPrice
                                )}
                              </span>
                            )}

                          </div>

                          {/* BUTTONS */}

                          <div className="mt-4 flex items-center gap-2.5">

                            <Link
                              href={`/product/${product.slug}`}
                              className={`flex h-9 flex-1 items-center justify-center rounded-full text-sm font-medium transition-all ${
                                outOfStock
                                  ? "cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-400"
                                  : "border border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
                              }`}
                            >
                              {outOfStock
                                ? "Out of Stock"
                                : product.isPreOrder
                                ? "Pre Order"
                                : "Shop Now"}
                            </Link>

                            <button
                              type="button"
                              disabled={
                                outOfStock
                              }
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-all hover:border-gray-900 hover:bg-gray-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                              title="Add to cart"
                            >
                              <ShoppingCart
                                size={15}
                              />
                            </button>

                          </div>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </section>

        </div>

      </div>
    </main>
  );
}