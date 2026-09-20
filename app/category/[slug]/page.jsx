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
  Search,
  X,
  Check,
} from "lucide-react";

const API_BASE =
  "https://apple-gadgets-ui-backend.vercel.app";

// ============================================
// DESIGN TOKENS
//
// "Titanium" palette — warm greige surfaces,
// graphite ink and a brushed-bronze accent,
// echoing the finish of the products this
// storefront sells.
// ============================================

const COLOR = {
  paper: "#FFFFFF",
  surface: "#FAFAF7",
  mist: "#F6F5F2",
  line: "#EDEAE2",
  lineStrong: "#D8D4C9",
  ink: "#211F1C",
  inkSoft: "#4B4943",
  inkMuted: "#8A8680",
  accent: "#A9743B",
  accentDark: "#8F5F2C",
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params?.slug;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================
  // SEARCH
  // ============================================

  const [searchText, setSearchText] = useState("");

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
  const [selectedProcessor, setSelectedProcessor] =
    useState([]);
  const [selectedBattery, setSelectedBattery] =
    useState([]);
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
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
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
          `${API_BASE}/getallProduct?category=${encodeURIComponent(
            slug
          )}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch products"
          );
        }

        const data = await response.json();

        const productList = Array.isArray(data)
          ? data
          : data.products ||
            data.data ||
            [];

        console.log(
          "CATEGORY PRODUCTS:",
          productList
        );

        setProducts(productList);
      } catch (error) {
        console.error(
          "Category products error:",
          error
        );

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

    if (
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
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

    if (
      typeof product.images === "string"
    ) {
      return product.images;
    }

    return "/placeholder.png";
  };

  // ============================================
  // PRICE
  // ============================================

  const getProductPrice = (product) => {
    return Number(
      product?.discountPrice ||
        product?.price ||
        0
    );
  };

  const getOriginalPrice = (product) => {
    return Number(product?.price || 0);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat(
      "en-BD"
    ).format(price);
  };

  // ============================================
  // SPECIFICATION HELPER
  //
  // Actual DB:
  //
  // specifications: [
  //   {
  //     key: "Model",
  //     value: "iPhone 17 Pro Max"
  //   }
  // ]
  //
  // ============================================

  const getSpecificationValues = (
    product,
    keys = []
  ) => {
    const specifications =
      product?.specifications;

    if (!Array.isArray(specifications)) {
      return [];
    }

    const normalizedKeys = keys.map(
      (key) =>
        String(key)
          .trim()
          .toLowerCase()
    );

    const result = [];

    specifications.forEach((item) => {
      if (
        !item ||
        typeof item !== "object"
      ) {
        return;
      }

      const itemKey = String(
        item.key ||
          item.name ||
          item.title ||
          item.label ||
          item.specification ||
          item.attribute ||
          ""
      )
        .trim()
        .toLowerCase();

      if (
        !normalizedKeys.includes(itemKey)
      ) {
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
            result.push(
              String(itemValue).trim()
            );
          }
        });
      } else if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        result.push(
          String(value).trim()
        );
      }
    });

    return [...new Set(result)];
  };

  // ============================================
  // PRODUCT SEARCH
  //
  // Search করবে:
  // name
  // slug
  // brand
  // SKU
  // root ram
  // specifications key
  // specifications value
  // ============================================

  const searchProduct = (
    product,
    searchValue
  ) => {
    if (!searchValue.trim()) {
      return true;
    }

    const search =
      searchValue.trim().toLowerCase();

    const searchableValues = [];

    // ------------------------------------------
    // BASIC PRODUCT DATA
    // ------------------------------------------

    searchableValues.push(
      product?.name
    );

    searchableValues.push(
      product?.slug
    );

    searchableValues.push(
      product?.brand
    );

    searchableValues.push(
      product?.sku
    );

    // ------------------------------------------
    // PRICE
    // ------------------------------------------

    searchableValues.push(
      product?.price
    );

    searchableValues.push(
      product?.discountPrice
    );

    // ------------------------------------------
    // ROOT RAM
    //
    // Example:
    // [
    //   "2TB 12GB RAM",
    //   "1TB 12GB RAM"
    // ]
    // ------------------------------------------

    if (
      Array.isArray(product?.ram)
    ) {
      searchableValues.push(
        ...product.ram
      );
    }

    // ------------------------------------------
    // SPECIFICATIONS
    //
    // key + value
    // ------------------------------------------

    if (
      Array.isArray(
        product?.specifications
      )
    ) {
      product.specifications.forEach(
        (item) => {
          if (
            !item ||
            typeof item !== "object"
          ) {
            return;
          }

          searchableValues.push(
            item.key
          );

          searchableValues.push(
            item.name
          );

          searchableValues.push(
            item.title
          );

          searchableValues.push(
            item.label
          );

          searchableValues.push(
            item.value
          );

          searchableValues.push(
            item.data
          );

          searchableValues.push(
            item.specificationValue
          );

          searchableValues.push(
            item.content
          );
        }
      );
    }

    // ------------------------------------------
    // SEARCH
    // ------------------------------------------

    return searchableValues.some(
      (value) => {
        if (
          value === undefined ||
          value === null
        ) {
          return false;
        }

        if (Array.isArray(value)) {
          return value.some(
            (item) =>
              String(item)
                .toLowerCase()
                .includes(search)
          );
        }

        return String(value)
          .toLowerCase()
          .includes(search);
      }
    );
  };

  // ============================================
  // BRAND
  // ============================================

  const getBrandValues = (product) => {
    if (
      product?.brand !== undefined &&
      product?.brand !== null &&
      String(product.brand).trim() !== ""
    ) {
      if (
        typeof product.brand === "object"
      ) {
        const value =
          product.brand.name ||
          product.brand.title ||
          product.brand.value ||
          "";

        return value
          ? [String(value).trim()]
          : [];
      }

      return [
        String(product.brand).trim(),
      ];
    }

    return getSpecificationValues(
      product,
      ["brand", "brand name"]
    );
  };

  // ============================================
  // SERIES
  //
  // Model/Series থেকে dynamically আসবে
  // ============================================

  const getSeriesValues = (product) => {
    return getSpecificationValues(
      product,
      [
        "series",
        "series name",
        "model series",
        "model",
        "model name",
      ]
    );
  };

  // ============================================
  // DISPLAY
  // ============================================

  const getDisplayValues = (product) => {
    return getSpecificationValues(
      product,
      [
        "display",
        "display size",
        "screen",
        "screen size",
        "displaysize",
        "screensize",
      ]
    );
  };

  // ============================================
  // PROCESSOR
  // ============================================

  const getProcessorValues = (
    product
  ) => {
    return getSpecificationValues(
      product,
      [
        "processor",
        "cpu",
        "chip",
        "chipset",
        "processor name",
      ]
    );
  };

  // ============================================
  // BATTERY
  // ============================================

  const getBatteryValues = (product) => {
    return getSpecificationValues(
      product,
      [
        "battery",
        "battery capacity",
        "battery size",
        "batterycapacity",
      ]
    );
  };

  // ============================================
  // ROOT LEVEL RAM
  //
  // Actual DB:
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
      .map((item) =>
        String(item).trim()
      );
  };

  // ============================================
  // STORAGE
  //
  // IMPORTANT:
  //
  // "2TB 12GB RAM" => "2TB"
  // "1TB 12GB RAM" => "1TB"
  // "512GB 12GB RAM" => "512GB"
  // "256GB 12GB RAM" => "256GB"
  //
  // "12GB RAM" => NOT STORAGE
  // "12GB" => NOT STORAGE
  // ============================================

  const getStorageValues = (product) => {
    const ramValues = getRawRamValues(
      product
    );

    const storageValues = [];

    ramValues.forEach((value) => {
      const text = String(value).trim();

      if (!text) return;

      // ----------------------------------------
      // CASE 1
      // "2TB 12GB RAM"
      // "512GB 12GB RAM"
      // ----------------------------------------

      const ramMatch = text.match(
        /\b\d+(?:\.\d+)?\s*GB\s*RAM\b/i
      );

      if (ramMatch) {
        const beforeRam = text
          .slice(0, ramMatch.index)
          .trim();

        const storageMatch =
          beforeRam.match(
            /\b\d+(?:\.\d+)?\s*(?:TB|GB)\b/i
          );

        if (storageMatch) {
          storageValues.push(
            storageMatch[0]
              .replace(/\s+/g, "")
              .toUpperCase()
          );
        }

        return;
      }

      // ----------------------------------------
      // CASE 2
      // Only storage:
      // "256GB"
      // "512GB"
      // "1TB"
      // ----------------------------------------

      const onlyStorageMatch =
        text.match(
          /^\d+(?:\.\d+)?\s*(?:TB|GB)$/i
        );

      if (onlyStorageMatch) {
        storageValues.push(
          onlyStorageMatch[0]
            .replace(/\s+/g, "")
            .toUpperCase()
        );
      }
    });

    return [...new Set(storageValues)];
  };

  // ============================================
  // RAM
  //
  // "2TB 12GB RAM" => "12GB"
  // "512GB 16GB RAM" => "16GB"
  // ============================================

  const getRamValues = (product) => {
    const ramValues =
      getRawRamValues(product);

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

    console.log(
      "========== FILTER DATA =========="
    );

    console.log(
      "RAM ROOT:",
      products.map(
        (product) => product.ram
      )
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
        (product) =>
          product.specifications
      )
    );

    console.log(
      "================================="
    );
  }, [products]);

  // ============================================
  // DYNAMIC BRAND OPTIONS
  // ============================================

  const brandOptions = useMemo(() => {
    const values = products.flatMap(
      (product) =>
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
    const values = products.flatMap(
      (product) =>
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
    const values = products.flatMap(
      (product) =>
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
    const values = products.flatMap(
      (product) =>
        getStorageValues(product)
    );

    return [...new Set(values)]
      .filter(Boolean)
      .sort((a, b) => {
        const getNumber = (value) => {
          const match = String(
            value
          ).match(
            /\d+(?:\.\d+)?/
          );

          if (!match) return 0;

          const number = Number(
            match[0]
          );

          if (
            String(value)
              .toUpperCase()
              .includes("TB")
          ) {
            return number * 1024;
          }

          return number;
        };

        return (
          getNumber(a) - getNumber(b)
        );
      });
  }, [products]);

  // ============================================
  // DYNAMIC PROCESSOR OPTIONS
  // ============================================

  const processorOptions = useMemo(() => {
    const values = products.flatMap(
      (product) =>
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
    const values = products.flatMap(
      (product) =>
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
    const values = products.flatMap(
      (product) =>
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
  // CLEAR ALL FILTERS
  // ============================================

  const clearAllFilters = () => {
    setSearchText("");
    setPriceMin("");
    setPriceMax("");
    setExcludeStock(true);
    setSelectedBrand([]);
    setSelectedSeries([]);
    setSelectedDisplay([]);
    setSelectedStorage([]);
    setSelectedProcessor([]);
    setSelectedBattery([]);
    setSelectedRam([]);
    setSortBy("default");
  };

  // ============================================
  // FILTER PRODUCTS
  // ============================================

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // ------------------------------------------
    // SEARCH
    // ------------------------------------------

    if (
      searchText.trim() !== ""
    ) {
      result = result.filter(
        (product) =>
          searchProduct(
            product,
            searchText
          )
      );
    }

    // ------------------------------------------
    // PRICE MIN
    // ------------------------------------------

    if (priceMin !== "") {
      result = result.filter(
        (product) =>
          getProductPrice(product) >=
          Number(priceMin)
      );
    }

    // ------------------------------------------
    // PRICE MAX
    // ------------------------------------------

    if (priceMax !== "") {
      result = result.filter(
        (product) =>
          getProductPrice(product) <=
          Number(priceMax)
      );
    }

    // ------------------------------------------
    // STOCK
    // ------------------------------------------

    if (excludeStock) {
      result = result.filter(
        (product) =>
          product.stock ===
            undefined ||
          product.stock === null ||
          Number(product.stock) > 0
      );
    }

    // ------------------------------------------
    // BRAND
    // ------------------------------------------

    if (
      selectedBrand.length > 0
    ) {
      result = result.filter(
        (product) => {
          const values =
            getBrandValues(product);

          return values.some(
            (value) =>
              selectedBrand.includes(
                value
              )
          );
        }
      );
    }

    // ------------------------------------------
    // SERIES
    // ------------------------------------------

    if (
      selectedSeries.length > 0
    ) {
      result = result.filter(
        (product) => {
          const values =
            getSeriesValues(product);

          return values.some(
            (value) =>
              selectedSeries.includes(
                value
              )
          );
        }
      );
    }

    // ------------------------------------------
    // DISPLAY
    // ------------------------------------------

    if (
      selectedDisplay.length > 0
    ) {
      result = result.filter(
        (product) => {
          const values =
            getDisplayValues(product);

          return values.some(
            (value) =>
              selectedDisplay.includes(
                value
              )
          );
        }
      );
    }

    // ------------------------------------------
    // STORAGE
    // ------------------------------------------

    if (
      selectedStorage.length > 0
    ) {
      result = result.filter(
        (product) => {
          const values =
            getStorageValues(product);

          return values.some(
            (value) =>
              selectedStorage.includes(
                value
              )
          );
        }
      );
    }

    // ------------------------------------------
    // PROCESSOR
    // ------------------------------------------

    if (
      selectedProcessor.length > 0
    ) {
      result = result.filter(
        (product) => {
          const values =
            getProcessorValues(product);

          return values.some(
            (value) =>
              selectedProcessor.includes(
                value
              )
          );
        }
      );
    }

    // ------------------------------------------
    // BATTERY
    // ------------------------------------------

    if (
      selectedBattery.length > 0
    ) {
      result = result.filter(
        (product) => {
          const values =
            getBatteryValues(product);

          return values.some(
            (value) =>
              selectedBattery.includes(
                value
              )
          );
        }
      );
    }

    // ------------------------------------------
    // RAM
    // ------------------------------------------

    if (
      selectedRam.length > 0
    ) {
      result = result.filter(
        (product) => {
          const values =
            getRamValues(product);

          return values.some(
            (value) =>
              selectedRam.includes(
                value
              )
          );
        }
      );
    }

    // ------------------------------------------
    // SORT
    // ------------------------------------------

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
          new Date(
            b.createdAt || 0
          ) -
          new Date(
            a.createdAt || 0
          )
      );
    }

    return result;
  }, [
    products,
    searchText,
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

  const toggleSection = (
    section
  ) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // ============================================
  // CHECKBOX (custom square, accent-filled)
  // ============================================

  const FilterCheckbox = ({
    label,
    checked,
    onChange,
  }) => {
    return (
      <label className="flex cursor-pointer items-center gap-2.5 py-0.5 text-[13px] text-[#4B4943] transition-colors hover:text-[#211F1C]">
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-150"
          style={{
            borderColor: checked
              ? COLOR.accent
              : COLOR.lineStrong,
            backgroundColor: checked
              ? COLOR.accent
              : COLOR.paper,
          }}
        >
          {checked && (
            <Check
              size={11}
              strokeWidth={3}
              className="text-white"
            />
          )}
        </span>

        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />

        <span>{label}</span>
      </label>
    );
  };

  // ============================================
  // FILTER SECTION HEADER (shared shell)
  // ============================================

  const FilterSection = ({
    label,
    count,
    isOpen,
    onToggle,
    children,
  }) => {
    return (
      <div
        className="px-4 py-4"
        style={{ borderBottom: `1px solid ${COLOR.line}` }}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between"
        >
          <span
            className="text-[13.5px] font-medium"
            style={{ color: COLOR.ink }}
          >
            {label}
            {count > 0 && (
              <span
                className="ml-1.5 text-[11.5px] font-normal"
                style={{ color: COLOR.inkMuted }}
              >
                ({count})
              </span>
            )}
          </span>

          {isOpen ? (
            <ChevronUp
              size={15}
              style={{ color: COLOR.inkMuted }}
            />
          ) : (
            <ChevronDown
              size={15}
              style={{ color: COLOR.inkMuted }}
            />
          )}
        </button>

        {isOpen && (
          <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto pr-1">
            {children}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main
        className="min-h-screen"
        style={{ backgroundColor: COLOR.paper }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div
            className="h-3.5 w-52 animate-pulse rounded"
            style={{ backgroundColor: COLOR.mist }}
          />

          <div
            className="mt-4 h-9 w-44 animate-pulse rounded"
            style={{ backgroundColor: COLOR.mist }}
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-[260px_1fr]">
            <div
              className="h-[700px] animate-pulse rounded-[20px]"
              style={{ backgroundColor: COLOR.mist }}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-[360px] animate-pulse rounded-[22px]"
                  style={{ backgroundColor: COLOR.mist }}
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
    <main
      className="min-h-screen antialiased"
      style={{
        backgroundColor: COLOR.paper,
        color: COLOR.ink,
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      {/*
        Optional — for the display type in headings to render as
        drawn, add Space Grotesk in your root layout, e.g. via
        next/font/google, then swap the inline fontFamily below
        for the generated CSS variable.
      */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap");
      `}</style>

      <div className="mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-6 lg:px-8">

        {/* ====================================== */}
        {/* BREADCRUMB */}
        {/* ====================================== */}

        <div
          className="mb-3 flex items-center gap-1.5 text-[11.5px]"
          style={{ color: COLOR.inkMuted }}
        >
          <Link
            href="/"
            className="transition-colors hover:text-[#211F1C]"
          >
            Home
          </Link>

          <span>/</span>

          <span>Mobile Phone</span>

          <span>/</span>

          <span style={{ color: COLOR.ink, fontWeight: 500 }}>
            {categoryName}
          </span>
        </div>

        {/* ====================================== */}
        {/* TITLE */}
        {/* ====================================== */}

        <h1
          className="mb-7 text-[32px] tracking-tight sm:text-[38px]"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontWeight: 600,
            color: COLOR.ink,
          }}
        >
          {categoryName}
        </h1>

        {/* ====================================== */}
        {/* MAIN LAYOUT */}
        {/* ====================================== */}

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">

          {/* ==================================== */}
          {/* SIDEBAR */}
          {/* ==================================== */}

          <aside
            className="h-fit overflow-hidden rounded-[20px]"
            style={{
              backgroundColor: COLOR.paper,
              border: `1px solid ${COLOR.line}`,
            }}
          >

            {/* FILTER HEADER */}

            <div
              className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: `1px solid ${COLOR.line}` }}
            >
              <h2
                className="text-[15px] font-semibold"
                style={{ color: COLOR.ink }}
              >
                Filters
              </h2>

              <SlidersHorizontal
                size={16}
                className="lg:hidden"
                style={{ color: COLOR.inkMuted }}
              />
            </div>

            {/* ================================= */}
            {/* SEARCH */}
            {/* ================================= */}

            <div
              className="px-4 py-4"
              style={{ borderBottom: `1px solid ${COLOR.line}` }}
            >
              <label
                className="mb-2 block text-[13px] font-medium"
                style={{ color: COLOR.ink }}
              >
                Search products
              </label>

              <div className="relative">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: COLOR.inkMuted }}
                />

                <input
                  type="text"
                  value={searchText}
                  onChange={(e) =>
                    setSearchText(
                      e.target.value
                    )
                  }
                  placeholder="Search product..."
                  className="h-10 w-full rounded-[10px] pl-9 pr-8 text-[13px] outline-none transition-colors"
                  style={{
                    backgroundColor: COLOR.surface,
                    border: `1px solid ${COLOR.line}`,
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor =
                      COLOR.accent)
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor =
                      COLOR.line)
                  }
                />

                {searchText && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearchText("")
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                    style={{ color: COLOR.inkMuted }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {searchText.trim() !==
                "" && (
                <p
                  className="mt-2 text-[10.5px] leading-4"
                  style={{ color: COLOR.inkMuted }}
                >
                  Search includes product name,
                  brand, SKU, RAM and
                  specifications.
                </p>
              )}
            </div>

            {/* ================================= */}
            {/* PRICE */}
            {/* ================================= */}

            <div
              className="px-4 py-4"
              style={{ borderBottom: `1px solid ${COLOR.line}` }}
            >
              <button
                type="button"
                onClick={() =>
                  toggleSection("price")
                }
                className="flex w-full items-center justify-between"
              >
                <span
                  className="text-[13.5px] font-medium"
                  style={{ color: COLOR.ink }}
                >
                  Price range
                </span>

                {openSections.price ? (
                  <ChevronUp
                    size={15}
                    style={{ color: COLOR.inkMuted }}
                  />
                ) : (
                  <ChevronDown
                    size={15}
                    style={{ color: COLOR.inkMuted }}
                  />
                )}
              </button>

              {openSections.price && (
                <div className="mt-3 flex items-center gap-2.5">
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) =>
                      setPriceMin(
                        e.target.value
                      )
                    }
                    placeholder="Min"
                    className="h-10 w-full rounded-[10px] px-3 text-[13px] outline-none transition-colors"
                    style={{
                      backgroundColor: COLOR.surface,
                      border: `1px solid ${COLOR.line}`,
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        COLOR.accent)
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        COLOR.line)
                    }
                  />

                  <span
                    className="shrink-0 text-[13px]"
                    style={{ color: COLOR.inkMuted }}
                  >
                    –
                  </span>

                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) =>
                      setPriceMax(
                        e.target.value
                      )
                    }
                    placeholder="Max"
                    className="h-10 w-full rounded-[10px] px-3 text-[13px] outline-none transition-colors"
                    style={{
                      backgroundColor: COLOR.surface,
                      border: `1px solid ${COLOR.line}`,
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor =
                        COLOR.accent)
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor =
                        COLOR.line)
                    }
                  />
                </div>
              )}
            </div>

            {/* ================================= */}
            {/* STOCK */}
            {/* ================================= */}

            <div
              className="px-4 py-4"
              style={{ borderBottom: `1px solid ${COLOR.line}` }}
            >
              <FilterCheckbox
                label="Exclude out of stock"
                checked={excludeStock}
                onChange={(e) =>
                  setExcludeStock(
                    e.target.checked
                  )
                }
              />
            </div>

            {/* ================================= */}
            {/* BRAND */}
            {/* ================================= */}

            {brandOptions.length > 0 && (
              <FilterSection
                label="Brand"
                count={selectedBrand.length}
                isOpen={openSections.brand}
                onToggle={() =>
                  toggleSection("brand")
                }
              >
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
              </FilterSection>
            )}

            {/* ================================= */}
            {/* SERIES */}
            {/* ================================= */}

            {seriesOptions.length > 0 && (
              <FilterSection
                label="Series"
                count={selectedSeries.length}
                isOpen={openSections.series}
                onToggle={() =>
                  toggleSection("series")
                }
              >
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
              </FilterSection>
            )}

            {/* ================================= */}
            {/* DISPLAY */}
            {/* ================================= */}

            {displayOptions.length > 0 && (
              <FilterSection
                label="Display size"
                count={selectedDisplay.length}
                isOpen={openSections.display}
                onToggle={() =>
                  toggleSection("display")
                }
              >
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
              </FilterSection>
            )}

            {/* ================================= */}
            {/* STORAGE */}
            {/* ================================= */}

            {storageOptions.length > 0 && (
              <FilterSection
                label="Storage"
                count={selectedStorage.length}
                isOpen={openSections.storage}
                onToggle={() =>
                  toggleSection("storage")
                }
              >
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
              </FilterSection>
            )}

            {/* ================================= */}
            {/* PROCESSOR */}
            {/* ================================= */}

            {processorOptions.length > 0 && (
              <FilterSection
                label="Processor"
                count={selectedProcessor.length}
                isOpen={openSections.processor}
                onToggle={() =>
                  toggleSection("processor")
                }
              >
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
              </FilterSection>
            )}

            {/* ================================= */}
            {/* BATTERY */}
            {/* ================================= */}

            {batteryOptions.length > 0 && (
              <FilterSection
                label="Battery capacity"
                count={selectedBattery.length}
                isOpen={openSections.battery}
                onToggle={() =>
                  toggleSection("battery")
                }
              >
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
              </FilterSection>
            )}

            {/* ================================= */}
            {/* RAM */}
            {/* ================================= */}

            {ramOptions.length > 0 && (
              <div className="px-4 py-4">
                <button
                  type="button"
                  onClick={() =>
                    toggleSection("ram")
                  }
                  className="flex w-full items-center justify-between"
                >
                  <span
                    className="text-[13.5px] font-medium"
                    style={{ color: COLOR.ink }}
                  >
                    RAM
                    {selectedRam.length > 0 && (
                      <span
                        className="ml-1.5 text-[11.5px] font-normal"
                        style={{ color: COLOR.inkMuted }}
                      >
                        ({selectedRam.length})
                      </span>
                    )}
                  </span>

                  {openSections.ram ? (
                    <ChevronUp
                      size={15}
                      style={{ color: COLOR.inkMuted }}
                    />
                  ) : (
                    <ChevronDown
                      size={15}
                      style={{ color: COLOR.inkMuted }}
                    />
                  )}
                </button>

                {openSections.ram && (
                  <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto pr-1">
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

            {/* ================================= */}
            {/* CLEAR FILTERS */}
            {/* ================================= */}

            <div
              className="px-4 py-4"
              style={{ borderTop: `1px solid ${COLOR.line}` }}
            >
              <button
                type="button"
                onClick={
                  clearAllFilters
                }
                className="w-full rounded-[10px] py-2.5 text-[12.5px] font-medium transition-colors"
                style={{
                  border: `1px solid ${COLOR.line}`,
                  color: COLOR.ink,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    COLOR.ink;
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor =
                    COLOR.ink;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "transparent";
                  e.currentTarget.style.color = COLOR.ink;
                  e.currentTarget.style.borderColor =
                    COLOR.line;
                }}
              >
                Clear all filters
              </button>
            </div>
          </aside>

          {/* ==================================== */}
          {/* PRODUCTS */}
          {/* ==================================== */}

          <section>

            {/* TOP BAR */}

            <div className="mb-4 flex items-center justify-between gap-3">
              <p
                className="text-[12.5px]"
                style={{ color: COLOR.inkSoft }}
              >
                Showing{" "}
                <span
                  className="font-semibold"
                  style={{ color: COLOR.ink }}
                >
                  {filteredProducts.length}
                </span>{" "}
                items
              </p>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value
                    )
                  }
                  className="h-9 appearance-none rounded-full py-1 pl-4 pr-9 text-[12.5px] outline-none"
                  style={{
                    backgroundColor: COLOR.paper,
                    border: `1px solid ${COLOR.line}`,
                    color: COLOR.ink,
                  }}
                >
                  <option value="default">
                    Sort by
                  </option>

                  <option value="newest">
                    Newest
                  </option>

                  <option value="low">
                    Price: low to high
                  </option>

                  <option value="high">
                    Price: high to low
                  </option>
                </select>

                <ArrowDownUp
                  size={13}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: COLOR.inkMuted }}
                />
              </div>
            </div>

            {/* ACTIVE SEARCH */}

            {searchText.trim() !== "" && (
              <div
                className="mb-4 flex items-center justify-between rounded-[10px] px-3.5 py-2.5"
                style={{
                  backgroundColor: COLOR.surface,
                  border: `1px solid ${COLOR.line}`,
                }}
              >
                <p
                  className="text-[12.5px]"
                  style={{ color: COLOR.inkSoft }}
                >
                  Results for{" "}
                  <span
                    className="font-semibold"
                    style={{ color: COLOR.ink }}
                  >
                    {searchText}
                  </span>
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setSearchText("")
                  }
                  className="text-[12px] font-medium"
                  style={{ color: COLOR.accent }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* NO PRODUCTS */}

            {filteredProducts.length ===
            0 ? (
              <div
                className="flex min-h-[420px] items-center justify-center rounded-[20px]"
                style={{
                  border: `1px dashed ${COLOR.lineStrong}`,
                  backgroundColor: COLOR.surface,
                }}
              >
                <div className="text-center">
                  <h2
                    className="text-[17px] font-semibold"
                    style={{
                      fontFamily:
                        "'Space Grotesk', 'Inter', sans-serif",
                      color: COLOR.ink,
                    }}
                  >
                    No products found
                  </h2>

                  <p
                    className="mt-1 text-[13px]"
                    style={{ color: COLOR.inkMuted }}
                  >
                    Try changing your
                    filters or search.
                  </p>

                  <button
                    type="button"
                    onClick={
                      clearAllFilters
                    }
                    className="mt-4 rounded-full px-5 py-2 text-[12.5px] font-medium text-white transition-colors"
                    style={{ backgroundColor: COLOR.ink }}
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            ) : (
              /* PRODUCT GRID */

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map(
                  (product) => {
                    const price =
                      getProductPrice(
                        product
                      );

                    const originalPrice =
                      getOriginalPrice(
                        product
                      );

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
                      getProductImage(
                        product
                      );

                    const outOfStock =
                      Number(
                        product.stock
                      ) <= 0;

                    return (
                      <div
                        key={
                          product._id
                        }
                        className="group relative overflow-hidden rounded-[22px] transition-shadow duration-300"
                        style={{
                          backgroundColor: COLOR.paper,
                          border: `1px solid ${COLOR.line}`,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.boxShadow =
                            "0 12px 32px rgba(33,31,28,0.10)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.boxShadow =
                            "none")
                        }
                      >
                        {/* PRODUCT IMAGE */}

                        <Link
                          href={`/product/${product.slug}`}
                          className="relative block h-[250px] w-full overflow-hidden"
                          style={{
                            backgroundColor: COLOR.mist,
                          }}
                        >
                          <div className="relative h-full w-full p-6">
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
                            <div className="absolute left-3 top-3">
                              <span
                                className="rounded-full px-2.5 py-1 text-[10.5px] font-medium text-white"
                                style={{
                                  backgroundColor: COLOR.ink,
                                }}
                              >
                                Save ৳{" "}
                                {formatPrice(
                                  originalPrice -
                                    price
                                )}
                              </span>
                            </div>
                          )}
                        </Link>

                        {/* PRODUCT INFO */}

                        <div className="px-4 pb-4 pt-3.5">
                          <Link
                            href={`/product/${product.slug}`}
                            className="block"
                          >
                            <h3
                              className="line-clamp-1 text-[14.5px] font-medium transition-colors"
                              style={{ color: COLOR.ink }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color =
                                  COLOR.accent)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color =
                                  COLOR.ink)
                              }
                            >
                              {product.name}
                            </h3>
                          </Link>

                          {/* PRICE */}

                          <div className="mt-1.5 flex items-baseline gap-2">
                            <span
                              className="text-[17px] font-semibold"
                              style={{ color: COLOR.ink }}
                            >
                              ৳{" "}
                              {formatPrice(
                                price
                              )}
                            </span>

                            {originalPrice >
                              price && (
                              <span
                                className="text-[12.5px] line-through"
                                style={{ color: COLOR.inkMuted }}
                              >
                                ৳{" "}
                                {formatPrice(
                                  originalPrice
                                )}
                              </span>
                            )}
                          </div>

                          {/* BUTTONS */}

                          <div className="mt-3.5 flex items-center gap-2.5">
                            <Link
                              href={`/product/${product.slug}`}
                              className="flex h-10 flex-1 items-center justify-center rounded-full text-[13px] font-medium transition-colors"
                              style={
                                outOfStock
                                  ? {
                                      border: `1px solid ${COLOR.line}`,
                                      backgroundColor:
                                        COLOR.surface,
                                      color: COLOR.inkMuted,
                                      cursor: "not-allowed",
                                    }
                                  : {
                                      border: `1px solid ${COLOR.ink}`,
                                      backgroundColor: COLOR.ink,
                                      color: "#fff",
                                    }
                              }
                            >
                              {outOfStock
                                ? "Out of stock"
                                : product.isPreOrder
                                ? "Pre order"
                                : "Shop now"}
                            </Link>

                            <button
                              type="button"
                              disabled={
                                outOfStock
                              }
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                              style={{
                                border: `1px solid ${COLOR.line}`,
                                color: COLOR.inkSoft,
                              }}
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