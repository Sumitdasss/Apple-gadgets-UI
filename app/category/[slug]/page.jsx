/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/globals */
/* eslint-disable react-hooks/static-components */

"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";

import { useParams, usePathname, useSearchParams } from "next/navigation";

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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

// ============================================
// DESIGN TOKENS
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

// ============================================
// KNOWN FILTER GROUPS
// ============================================

const KNOWN_FILTER_GROUPS = [
  {
    key: "brand",
    label: "Brand",
    synonyms: ["brand", "brand name"],
  },
  {
    key: "series",
    label: "Series / Model",
    synonyms: ["series", "series name", "model series", "model", "model name"],
  },
  {
    key: "display",
    label: "Display size",
    synonyms: [
      "display",
      "display size",
      "screen",
      "screen size",
      "displaysize",
      "screensize",
    ],
  },
  {
    key: "processor",
    label: "Processor",
    synonyms: ["processor", "cpu", "chip", "chipset", "processor name"],
  },
  {
    key: "battery",
    label: "Battery capacity",
    synonyms: [
      "battery",
      "battery capacity",
      "battery size",
      "batterycapacity",
    ],
  },
  {
    key: "storage",
    label: "Storage",
    synonyms: [
      "storage",
      "storage capacity",
      "internal storage",
      "rom",
      "capacity",
    ],
  },
  {
    key: "ram",
    label: "RAM",
    synonyms: ["ram", "ram size", "memory", "memory size"],
  },
];

// ============================================
// IGNORED SPEC KEYS
// ============================================

const IGNORED_SPEC_KEYS = new Set([
  "description",
  "overview",
  "summary",
  "details",
  "highlight",
  "highlights",
  "sku",
  "name",
  "title",
  "warranty details",
  "box contents",
  "in the box",
  "what's in the box",
]);

const MAX_FILTER_VALUE_LENGTH = 40;
const MAX_AUTO_FILTER_OPTIONS = 25;

// ============================================
// STABLE FILTER CHECKBOX
// IMPORTANT:
// This component is OUTSIDE CategoryPageContent.
// So searchText update will NOT remount it.
// ============================================

function FilterCheckbox({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[12px] text-[#4B4943] transition-colors hover:text-[#211F1C] sm:text-[13px]">
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border"
        style={{
          borderColor: checked ? COLOR.accent : COLOR.lineStrong,
          backgroundColor: checked ? COLOR.accent : COLOR.paper,
        }}
      >
        {checked && <Check size={11} strokeWidth={3} className="text-white" />}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />

      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

// ============================================
// STABLE FILTER SECTION
// ============================================

function FilterSection({ label, count, isOpen, onToggle, children }) {
  return (
    <div
      className="px-4 py-3.5"
      style={{
        borderBottom: `1px solid ${COLOR.line}`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3"
      >
        <span
          className="min-w-0 text-left text-[13px] font-medium"
          style={{
            color: COLOR.ink,
          }}
        >
          {label}

          {count > 0 && (
            <span
              className="ml-1.5 text-[11px] font-normal"
              style={{
                color: COLOR.inkMuted,
              }}
            >
              ({count})
            </span>
          )}
        </span>

        {isOpen ? (
          <ChevronUp
            size={15}
            className="shrink-0"
            style={{
              color: COLOR.inkMuted,
            }}
          />
        ) : (
          <ChevronDown
            size={15}
            className="shrink-0"
            style={{
              color: COLOR.inkMuted,
            }}
          />
        )}
      </button>

      {isOpen && (
        <div className="mt-2.5 max-h-48 space-y-0.5 overflow-y-auto pr-1">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// STABLE FILTER CONTENT
// IMPORTANT FIX:
// This component is OUTSIDE CategoryPageContent.
// ============================================

function FilterContent({
  searchText,
  setSearchText,

  priceMin,
  setPriceMin,

  priceMax,
  setPriceMax,

  excludeStock,
  setExcludeStock,

  filterSections,
  selectedFilters,

  getSelectedCount,
  toggleFilterValue,

  isSectionOpen,
  toggleSection,

  clearAllFilters,
}) {
  return (
    <>
      {/* ======================================
          SEARCH
      ====================================== */}

      <div
        className="px-4 py-3.5"
        style={{
          borderBottom: `1px solid ${COLOR.line}`,
        }}
      >
        <label
          className="mb-2 block text-[12.5px] font-medium"
          style={{
            color: COLOR.ink,
          }}
        >
          Search products
        </label>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{
              color: COLOR.inkMuted,
            }}
          />

          <input
            type="search"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
            placeholder="Search product..."
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full rounded-[10px] pl-9 pr-9 text-[12.5px] outline-none"
            style={{
              backgroundColor: COLOR.surface,
              border: `1px solid ${COLOR.line}`,
              color: COLOR.ink,
            }}
          />

          {searchText && (
            <button
              type="button"
              aria-label="Clear search"
              onMouseDown={(e) => {
                e.preventDefault();
              }}
              onClick={() => {
                setSearchText("");
              }}
              className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center"
              style={{
                color: COLOR.inkMuted,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ======================================
          PRICE
      ====================================== */}

      <div
        className="px-4 py-3.5"
        style={{
          borderBottom: `1px solid ${COLOR.line}`,
        }}
      >
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between"
        >
          <span
            className="text-[13px] font-medium"
            style={{
              color: COLOR.ink,
            }}
          >
            Price range
          </span>

          {isSectionOpen("price") ? (
            <ChevronUp
              size={15}
              style={{
                color: COLOR.inkMuted,
              }}
            />
          ) : (
            <ChevronDown
              size={15}
              style={{
                color: COLOR.inkMuted,
              }}
            />
          )}
        </button>

        {isSectionOpen("price") && (
          <div className="mt-2.5 flex items-center gap-2">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="Min"
              className="h-9 min-w-0 w-full rounded-[9px] px-3 text-[12px] outline-none"
              style={{
                backgroundColor: COLOR.surface,
                border: `1px solid ${COLOR.line}`,
                color: COLOR.ink,
              }}
            />

            <span
              className="shrink-0 text-[12px]"
              style={{
                color: COLOR.inkMuted,
              }}
            >
              –
            </span>

            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="Max"
              className="h-9 min-w-0 w-full rounded-[9px] px-3 text-[12px] outline-none"
              style={{
                backgroundColor: COLOR.surface,
                border: `1px solid ${COLOR.line}`,
                color: COLOR.ink,
              }}
            />
          </div>
        )}
      </div>

      {/* ======================================
          STOCK
      ====================================== */}

      <div
        className="px-4 py-3.5"
        style={{
          borderBottom: `1px solid ${COLOR.line}`,
        }}
      >
        <FilterCheckbox
          label="Exclude out of stock"
          checked={excludeStock}
          onChange={(e) => setExcludeStock(e.target.checked)}
        />
      </div>

      {/* ======================================
          DYNAMIC FILTERS
      ====================================== */}

      {filterSections.map((section) => (
        <FilterSection
          key={section.key}
          label={section.label}
          count={getSelectedCount(section.key)}
          isOpen={isSectionOpen(section.key)}
          onToggle={() => toggleSection(section.key)}
        >
          {section.options.map((item) => (
            <FilterCheckbox
              key={item}
              label={item}
              checked={(selectedFilters[section.key] || []).includes(item)}
              onChange={() => toggleFilterValue(section.key, item)}
            />
          ))}
        </FilterSection>
      ))}

      {/* ======================================
          CLEAR
      ====================================== */}

      <div className="px-4 py-3.5">
        <button
          type="button"
          onClick={clearAllFilters}
          className="w-full rounded-[10px] py-2.5 text-[12px] font-medium transition-colors hover:bg-[#F6F5F2]"
          style={{
            border: `1px solid ${COLOR.line}`,
            color: COLOR.ink,
          }}
        >
          Clear all filters
        </button>
      </div>
    </>
  );
}

// ============================================
// MAIN CONTENT
// ============================================

function CategoryPageContent() {
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const slug = params?.slug;

  // ============================================
  // SEARCH PAGE
  // ============================================

  const isSearchPage = pathname === "/search";

  const urlSearch = searchParams.get("q") || searchParams.get("search") || "";

  // ============================================
  // BREADCRUMB
  // ============================================

  const breadcrumbItems = useMemo(() => {
    const segments = pathname?.split("/").filter(Boolean);

    return segments || [];
  }, [pathname]);

  const formatBreadcrumb = (segment) => {
    return decodeURIComponent(segment)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // ============================================
  // PRODUCTS
  // ============================================

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================================
  // SEARCH
  // ============================================

  const [searchText, setSearchText] = useState(urlSearch);

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
  // FILTERS
  // ============================================

  const [selectedFilters, setSelectedFilters] = useState({});

  // ============================================
  // SORT
  // ============================================

  const [sortBy, setSortBy] = useState("default");

  // ============================================
  // CLOSED SECTIONS
  // ============================================

  const [closedSections, setClosedSections] = useState({});

  // ============================================
  // MOBILE FILTER DRAWER
  // ============================================

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ============================================
  // PAGINATION
  // ============================================

  const PRODUCTS_PER_PAGE = 12;

  const [currentPage, setCurrentPage] = useState(1);

  // ============================================
  // SECTION
  // ============================================

  const isSectionOpen = (key) => !closedSections[key];

  const toggleSection = (key) => {
    setClosedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ============================================
  // SYNC URL SEARCH
  // ============================================

  useEffect(() => {
    setSearchText(urlSearch);
  }, [urlSearch]);

  // ============================================
  // ESCAPE MOBILE DRAWER
  // ============================================

  useEffect(() => {
    if (!isFilterOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isFilterOpen]);

  // ============================================
  // BODY SCROLL LOCK
  // ============================================

  useEffect(() => {
    if (isFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterOpen]);

  // ============================================
  // CATEGORY NAME
  // ============================================

  const categoryName = useMemo(() => {
    if (isSearchPage) {
      return urlSearch.trim() ? `Search: ${urlSearch}` : "Search Products";
    }

    if (!slug) return "";

    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [slug, isSearchPage, urlSearch]);

  // ============================================
  // GET PRODUCTS
  // ============================================

  useEffect(() => {
    if (!slug && !isSearchPage) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const hasSearch = urlSearch.trim() !== "";

        const endpoint =
          isSearchPage || hasSearch
            ? `${API_BASE}/getallProduct`
            : `${API_BASE}/getallProduct?category=${encodeURIComponent(slug)}`;

        const response = await fetch(endpoint, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();

        const productList = Array.isArray(data)
          ? data
          : data?.products || data?.data || [];

        setProducts(productList);
      } catch (error) {
        console.error("Category products error:", error);

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug, urlSearch, isSearchPage]);

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
  // SPECIFICATIONS
  // ============================================

  const getSpecEntries = (product) => {
    const specifications = product?.specifications;

    if (!Array.isArray(specifications)) {
      return [];
    }

    return specifications.filter((item) => item && typeof item === "object");
  };

  const getSpecKeyLabel = (item) => {
    return String(
      item.key ||
        item.name ||
        item.title ||
        item.label ||
        item.specification ||
        item.attribute ||
        "",
    ).trim();
  };

  const getSpecItemValues = (item) => {
    const value =
      item.value ?? item.data ?? item.specificationValue ?? item.content ?? "";

    const values = [];

    if (Array.isArray(value)) {
      value.forEach((itemValue) => {
        if (
          itemValue !== undefined &&
          itemValue !== null &&
          String(itemValue).trim() !== ""
        ) {
          values.push(String(itemValue).trim());
        }
      });
    } else if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      values.push(String(value).trim());
    }

    return values;
  };

  const getSpecificationValues = (product, keys = []) => {
    const normalizedKeys = keys.map((key) => String(key).trim().toLowerCase());

    const result = [];

    getSpecEntries(product).forEach((item) => {
      const itemKey = getSpecKeyLabel(item).toLowerCase();

      if (!normalizedKeys.includes(itemKey)) {
        return;
      }

      result.push(...getSpecItemValues(item));
    });

    return [...new Set(result)];
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

    return getSpecificationValues(product, ["brand", "brand name"]);
  };

  // ============================================
  // RAW RAM
  // ============================================

  const getRawRamValues = (product) => {
    const ram = product?.ram;

    if (!Array.isArray(ram)) {
      return [];
    }

    return ram
      .filter(
        (item) =>
          item !== undefined && item !== null && String(item).trim() !== "",
      )
      .map((item) => String(item).trim());
  };

  // ============================================
  // STORAGE
  // ============================================

  const getStorageValues = (product) => {
    const ramValues = getRawRamValues(product);

    const storageValues = [];

    ramValues.forEach((value) => {
      const text = String(value).trim();

      if (!text) return;

      const ramMatch = text.match(/\b\d+(?:\.\d+)?\s*GB\s*RAM\b/i);

      if (ramMatch) {
        const beforeRam = text.slice(0, ramMatch.index).trim();

        const storageMatch = beforeRam.match(/\b\d+(?:\.\d+)?\s*(?:TB|GB)\b/i);

        if (storageMatch) {
          storageValues.push(storageMatch[0].replace(/\s+/g, "").toUpperCase());
        }

        return;
      }

      const onlyStorageMatch = text.match(/^\d+(?:\.\d+)?\s*(?:TB|GB)$/i);

      if (onlyStorageMatch) {
        storageValues.push(
          onlyStorageMatch[0].replace(/\s+/g, "").toUpperCase(),
        );
      }
    });

    const storageGroup = KNOWN_FILTER_GROUPS.find(
      (group) => group.key === "storage",
    );

    const specStorage = getSpecificationValues(
      product,
      storageGroup?.synonyms || [],
    );

    return [...new Set([...storageValues, ...specStorage])];
  };

  // ============================================
  // RAM
  // ============================================

  const getRamValues = (product) => {
    const ramValues = getRawRamValues(product);

    const parsed = ramValues
      .map((value) => {
        const text = String(value).trim();

        if (!text) return "";

        const withRam = text.match(/\b\d+(?:\.\d+)?\s*GB\s*RAM\b/i);

        if (withRam) {
          return withRam[0]
            .replace(/\s*RAM\b/i, "")
            .replace(/\s+/g, "")
            .toUpperCase();
        }

        const plainGb = text.match(/^\d+(?:\.\d+)?\s*GB$/i);

        if (plainGb) {
          return plainGb[0].replace(/\s+/g, "").toUpperCase();
        }

        return text;
      })
      .filter(Boolean);

    const ramGroup = KNOWN_FILTER_GROUPS.find((group) => group.key === "ram");

    const specRam = getSpecificationValues(product, ramGroup?.synonyms || []);

    return [...new Set([...parsed, ...specRam])];
  };

  // ============================================
  // DISPLAY SIZE
  // ============================================

  const getDisplayValues = (product) => {
    const displayGroup = KNOWN_FILTER_GROUPS.find(
      (group) => group.key === "display",
    );

    const rawValues = getSpecificationValues(
      product,
      displayGroup?.synonyms || [],
    );

    const cleaned = rawValues
      .map((value) => {
        const text = String(value).trim();

        if (!text) return "";

        const primaryMatch = text.match(
          /\b(\d+(?:\.\d+)?)\s*(?:inches?|inch|")\b/i,
        );

        if (primaryMatch) {
          return `${primaryMatch[1]} inches`;
        }

        if (text.length > MAX_FILTER_VALUE_LENGTH) {
          return "";
        }

        return text;
      })
      .filter(Boolean);

    return [...new Set(cleaned)];
  };

  // ============================================
  // GENERIC FILTER VALUE
  // ============================================

  const getValuesForFilter = (product, config) => {
    if (config.key === "brand") {
      return getBrandValues(product);
    }

    if (config.key === "storage") {
      return getStorageValues(product);
    }

    if (config.key === "ram") {
      return getRamValues(product);
    }

    if (config.key === "display") {
      return getDisplayValues(product);
    }

    return getSpecificationValues(product, config.synonyms);
  };

  // ============================================
  // SORT FILTER OPTIONS
  // ============================================

  const sortFilterOptions = (values) => {
    const getNumber = (value) => {
      const text = String(value).toUpperCase();

      const match = text.match(/\d+(?:\.\d+)?/);

      if (!match) return null;

      const number = Number(match[0]);

      if (text.includes("TB")) {
        return number * 1024;
      }

      return number;
    };

    const allNumeric = values.every((value) => getNumber(value) !== null);

    if (allNumeric) {
      return [...values].sort((a, b) => getNumber(a) - getNumber(b));
    }

    return [...values].sort();
  };

  // ============================================
  // KNOWN SYNONYMS
  // ============================================

  const knownSynonymSet = useMemo(() => {
    const set = new Set();

    KNOWN_FILTER_GROUPS.forEach((group) => {
      group.synonyms.forEach((synonym) => {
        set.add(synonym.toLowerCase());
      });
    });

    return set;
  }, []);

  // ============================================
  // DYNAMIC FILTER CONFIGS
  // ============================================

  const dynamicFilterConfigs = useMemo(() => {
    const collected = new Map();

    products.forEach((product) => {
      getSpecEntries(product).forEach((item) => {
        const rawLabel = getSpecKeyLabel(item);

        const normalized = rawLabel.toLowerCase();

        if (!normalized) return;

        if (knownSynonymSet.has(normalized)) {
          return;
        }

        if (IGNORED_SPEC_KEYS.has(normalized)) {
          return;
        }

        const values = getSpecItemValues(item).filter(
          (value) => value.length <= MAX_FILTER_VALUE_LENGTH,
        );

        if (values.length === 0) {
          return;
        }

        if (!collected.has(normalized)) {
          collected.set(normalized, {
            label: rawLabel,
            values: new Set(),
          });
        }

        const entry = collected.get(normalized);

        values.forEach((value) => entry.values.add(value));
      });
    });

    const configs = [];

    collected.forEach((entry, normalizedKey) => {
      const uniqueValues = [...entry.values];

      if (uniqueValues.length < 2) {
        return;
      }

      if (uniqueValues.length > MAX_AUTO_FILTER_OPTIONS) {
        return;
      }

      configs.push({
        key: `spec:${normalizedKey}`,
        label: entry.label,
        values: uniqueValues,
        synonyms: [normalizedKey],
      });
    });

    configs.sort((a, b) => a.label.localeCompare(b.label));

    return configs;
  }, [products, knownSynonymSet]);

  // ============================================
  // FILTER SECTIONS
  // ============================================

  const filterSections = useMemo(() => {
    const allConfigs = [...KNOWN_FILTER_GROUPS, ...dynamicFilterConfigs];

    return allConfigs
      .map((config) => {
        const values = products.flatMap((product) =>
          getValuesForFilter(product, config),
        );

        const uniqueValues = [...new Set(values)].filter(
          (value) =>
            Boolean(value) && String(value).length <= MAX_FILTER_VALUE_LENGTH,
        );

        return {
          ...config,
          options: sortFilterOptions(uniqueValues),
        };
      })
      .filter((section) => section.options.length > 0);
  }, [products, dynamicFilterConfigs]);

  // ============================================
  // SEARCH TEXT
  // ============================================

  const getSearchText = (value) => {
    if (value === undefined || value === null) {
      return "";
    }

    if (Array.isArray(value)) {
      return value.map((item) => getSearchText(item)).join(" ");
    }

    if (typeof value === "object") {
      return [
        value.name,
        value.title,
        value.label,
        value.value,
        value.slug,
        value._id,
      ]
        .filter(Boolean)
        .map((item) => getSearchText(item))
        .join(" ");
    }

    return String(value);
  };

  // ============================================
  // SEARCH PRODUCT
  // ============================================

  const searchProduct = (product, searchValue) => {
    if (!searchValue.trim()) {
      return true;
    }

    const search = searchValue.trim().toLowerCase();

    const searchableValues = [
      product?.name,
      product?.slug,
      product?.brand,
      product?.sku,
      product?.category,
      product?.subCategory,
      product?.childCategory,
      product?.subChildCategory,
      product?.price,
      product?.discountPrice,
      product?.shortDescription,
      product?.description,
    ];

    if (Array.isArray(product?.ram)) {
      searchableValues.push(...product.ram);
    }

    if (Array.isArray(product?.colors)) {
      searchableValues.push(...product.colors);
    }

    if (Array.isArray(product?.sizes)) {
      searchableValues.push(...product.sizes);
    }

    getSpecEntries(product).forEach((item) => {
      searchableValues.push(getSpecKeyLabel(item));

      searchableValues.push(...getSpecItemValues(item));
    });

    return searchableValues.some((value) =>
      getSearchText(value).toLowerCase().includes(search),
    );
  };

  // ============================================
  // TOGGLE FILTER
  // ============================================

  const toggleFilterValue = (filterKey, value) => {
    setSelectedFilters((prev) => {
      const current = prev[filterKey] || [];

      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return {
        ...prev,
        [filterKey]: next,
      };
    });
  };

  const getSelectedCount = (filterKey) =>
    (selectedFilters[filterKey] || []).length;

  // ============================================
  // ACTIVE FILTER COUNT
  // ============================================

  const activeFilterCount = useMemo(() => {
    const optionCount = Object.values(selectedFilters).reduce(
      (total, values) => total + values.length,
      0,
    );

    const priceCount = priceMin !== "" ? 1 : 0;

    const maxPriceCount = priceMax !== "" ? 1 : 0;

    const searchCount = searchText.trim() !== "" ? 1 : 0;

    return optionCount + priceCount + maxPriceCount + searchCount;
  }, [selectedFilters, priceMin, priceMax, searchText]);

  // ============================================
  // CLEAR ALL
  // ============================================

  const clearAllFilters = () => {
    setSearchText("");
    setPriceMin("");
    setPriceMax("");
    setExcludeStock(true);
    setSelectedFilters({});
    setSortBy("default");
    setCurrentPage(1);
  };

  // ============================================
  // FILTER PRODUCTS
  // ============================================

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchText.trim() !== "") {
      result = result.filter((product) => searchProduct(product, searchText));
    }

    if (priceMin !== "") {
      result = result.filter(
        (product) => getProductPrice(product) >= Number(priceMin),
      );
    }

    if (priceMax !== "") {
      result = result.filter(
        (product) => getProductPrice(product) <= Number(priceMax),
      );
    }

    if (excludeStock) {
      result = result.filter(
        (product) =>
          product.stock === undefined ||
          product.stock === null ||
          Number(product.stock) > 0,
      );
    }

    filterSections.forEach((config) => {
      const selectedValues = selectedFilters[config.key];

      if (!selectedValues || selectedValues.length === 0) {
        return;
      }

      result = result.filter((product) => {
        const values = getValuesForFilter(product, config);

        return values.some((value) => selectedValues.includes(value));
      });
    });

    if (sortBy === "low") {
      result.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    }

    if (sortBy === "high") {
      result.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    }

    if (sortBy === "newest") {
      result.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    return result;
  }, [
    products,
    searchText,
    priceMin,
    priceMax,
    excludeStock,
    selectedFilters,
    filterSections,
    sortBy,
  ]);

  // ============================================
  // PAGINATION
  // ============================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, priceMin, priceMax, excludeStock, selectedFilters, sortBy]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;

    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // ============================================
  // PAGINATION NUMBERS
  // ============================================

  const paginationItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from(
        {
          length: totalPages,
        },
        (_, index) => index + 1,
      );
    }

    const pages = new Set([
      1,
      totalPages,
      currentPage,
      currentPage - 1,
      currentPage + 1,
    ]);

    return [...pages]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);
  }, [totalPages, currentPage]);

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main
        className="min-h-screen"
        style={{
          backgroundColor: COLOR.paper,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div
            className="h-3.5 w-52 animate-pulse rounded"
            style={{
              backgroundColor: COLOR.mist,
            }}
          />

          <div
            className="mt-4 h-9 w-44 animate-pulse rounded"
            style={{
              backgroundColor: COLOR.mist,
            }}
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-[260px_1fr]">
            <div
              className="hidden h-[700px] animate-pulse rounded-[20px] lg:block"
              style={{
                backgroundColor: COLOR.mist,
              }}
            />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
              {Array.from({
                length: 6,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-[360px] animate-pulse rounded-[22px]"
                  style={{
                    backgroundColor: COLOR.mist,
                  }}
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
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap");

        html {
          scroll-behavior: smooth;
        }

        body {
          overflow-x: hidden;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 pb-14 pt-5 sm:px-6 lg:px-8">
        {/* ========================================
            BREADCRUMB
        ======================================== */}

        <div
          className="mb-3 flex flex-wrap items-center gap-1.5 text-[11.5px]"
          style={{
            color: COLOR.inkMuted,
          }}
        >
          <Link href="/" className="transition-colors hover:text-[#211F1C]">
            Home
          </Link>

          {breadcrumbItems.map((segment, index) => {
            const href = "/" + breadcrumbItems.slice(0, index + 1).join("/");

            const isLast = index === breadcrumbItems.length - 1;

            return (
              <React.Fragment key={`${segment}-${index}`}>
                <span>/</span>

                {isLast ? (
                  <span
                    style={{
                      color: COLOR.ink,
                      fontWeight: 500,
                    }}
                  >
                    {formatBreadcrumb(segment)}
                  </span>
                ) : (
                  <Link
                    href={href}
                    className="transition-colors hover:text-[#211F1C]"
                  >
                    {formatBreadcrumb(segment)}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ========================================
            TITLE
        ======================================== */}

        <h1
          className="mb-6 text-[28px] tracking-tight sm:mb-7 sm:text-[34px] lg:text-[38px]"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontWeight: 600,
            color: COLOR.ink,
          }}
        >
          {categoryName}
        </h1>

        {/* ========================================
            SEARCH RESULT NOTICE
        ======================================== */}

        {searchText.trim() !== "" && (
          <div
            className="mb-5 rounded-[12px] px-4 py-3"
            style={{
              backgroundColor: COLOR.surface,
              border: `1px solid ${COLOR.line}`,
            }}
          >
            <p
              className="truncate text-[13px]"
              style={{
                color: COLOR.inkSoft,
              }}
            >
              Searching all products for{" "}
              <span
                className="font-semibold"
                style={{
                  color: COLOR.ink,
                }}
              >
                {searchText}
              </span>
            </p>

            <p
              className="mt-1 text-[11px]"
              style={{
                color: COLOR.inkMuted,
              }}
            >
              Product category does not limit this search.
            </p>
          </div>
        )}

        {/* ========================================
            MAIN LAYOUT
        ======================================== */}

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* ======================================
              DESKTOP SIDEBAR
          ====================================== */}

          <aside
            className="hidden h-fit overflow-hidden rounded-[20px] lg:block"
            style={{
              backgroundColor: COLOR.paper,
              border: `1px solid ${COLOR.line}`,
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-4"
              style={{
                borderBottom: `1px solid ${COLOR.line}`,
              }}
            >
              <h2
                className="text-[15px] font-semibold"
                style={{
                  color: COLOR.ink,
                }}
              >
                Filters
              </h2>

              <SlidersHorizontal
                size={16}
                style={{
                  color: COLOR.inkMuted,
                }}
              />
            </div>

            <FilterContent
              searchText={searchText}
              setSearchText={setSearchText}
              priceMin={priceMin}
              setPriceMin={setPriceMin}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              excludeStock={excludeStock}
              setExcludeStock={setExcludeStock}
              filterSections={filterSections}
              selectedFilters={selectedFilters}
              getSelectedCount={getSelectedCount}
              toggleFilterValue={toggleFilterValue}
              isSectionOpen={isSectionOpen}
              toggleSection={toggleSection}
              clearAllFilters={clearAllFilters}
            />
          </aside>

          {/* ======================================
              MOBILE DRAWER
          ====================================== */}

          {isFilterOpen && (
            <div className="fixed inset-0 z-[9999] lg:hidden">
              {/* BACKDROP */}

              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setIsFilterOpen(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
              />

              {/* DRAWER */}

              <aside
                className="absolute right-0 top-0 flex h-[100dvh] w-[88%] max-w-[380px] flex-col overflow-hidden shadow-2xl"
                style={{
                  backgroundColor: COLOR.paper,
                }}
              >
                {/* HEADER */}

                <div
                  className="flex shrink-0 items-center justify-between px-4 py-3.5"
                  style={{
                    borderBottom: `1px solid ${COLOR.line}`,
                  }}
                >
                  <div>
                    <h2
                      className="text-[16px] font-semibold"
                      style={{
                        color: COLOR.ink,
                      }}
                    >
                      Filters
                    </h2>

                    <p
                      className="mt-0.5 text-[10.5px]"
                      style={{
                        color: COLOR.inkMuted,
                      }}
                    >
                      Refine your products
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label="Close filters"
                    onClick={() => setIsFilterOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: COLOR.surface,
                      color: COLOR.inkSoft,
                    }}
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* CONTENT */}

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <FilterContent
                    searchText={searchText}
                    setSearchText={setSearchText}
                    priceMin={priceMin}
                    setPriceMin={setPriceMin}
                    priceMax={priceMax}
                    setPriceMax={setPriceMax}
                    excludeStock={excludeStock}
                    setExcludeStock={setExcludeStock}
                    filterSections={filterSections}
                    selectedFilters={selectedFilters}
                    getSelectedCount={getSelectedCount}
                    toggleFilterValue={toggleFilterValue}
                    isSectionOpen={isSectionOpen}
                    toggleSection={toggleSection}
                    clearAllFilters={clearAllFilters}
                  />
                </div>

                {/* FOOTER */}

                <div
                  className="shrink-0 p-3.5"
                  style={{
                    borderTop: `1px solid ${COLOR.line}`,
                    backgroundColor: COLOR.paper,
                  }}
                >
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="h-11 flex-1 rounded-full text-[12px] font-medium"
                      style={{
                        border: `1px solid ${COLOR.line}`,
                        color: COLOR.ink,
                        backgroundColor: COLOR.paper,
                      }}
                    >
                      Clear
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="h-11 flex-[1.5] rounded-full text-[12px] font-semibold text-white"
                      style={{
                        backgroundColor: COLOR.ink,
                      }}
                    >
                      Show {filteredProducts.length} Products
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* ======================================
              PRODUCTS
          ====================================== */}

          <section className="min-w-0">
            {/* ====================================
                TOP BAR
            ==================================== */}

            <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
              {/* LEFT */}

              <div className="flex min-w-0 flex-1 items-center gap-2">
                {/* MOBILE FILTER */}

                <button
                  type="button"
                  onClick={() => setIsFilterOpen(true)}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[11.5px] font-medium lg:hidden"
                  style={{
                    backgroundColor: COLOR.ink,
                    color: "#fff",
                  }}
                >
                  <SlidersHorizontal size={13} />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-white px-1 text-[9px] font-semibold text-[#211F1C]">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <p
                  className="min-w-0 truncate text-[11.5px] sm:text-[12.5px]"
                  style={{
                    color: COLOR.inkSoft,
                  }}
                >
                  Showing{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color: COLOR.ink,
                    }}
                  >
                    {filteredProducts.length}
                  </span>{" "}
                  items
                </p>
              </div>

              {/* SORT */}

              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 appearance-none rounded-full py-1 pl-3 pr-8 text-[11.5px] outline-none sm:h-10 sm:pl-4 sm:pr-9 sm:text-[12.5px]"
                  style={{
                    backgroundColor: COLOR.paper,
                    border: `1px solid ${COLOR.line}`,
                    color: COLOR.ink,
                  }}
                >
                  <option value="default">Sort by</option>

                  <option value="newest">Newest</option>

                  <option value="low">Price: low to high</option>

                  <option value="high">Price: high to low</option>
                </select>

                <ArrowDownUp
                  size={12}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 sm:right-3.5"
                  style={{
                    color: COLOR.inkMuted,
                  }}
                />
              </div>
            </div>

            {/* ====================================
                ACTIVE SEARCH
            ==================================== */}

            {searchText.trim() !== "" && (
              <div
                className="mb-4 flex min-w-0 items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 sm:px-3.5"
                style={{
                  backgroundColor: COLOR.surface,
                  border: `1px solid ${COLOR.line}`,
                }}
              >
                <p
                  className="min-w-0 truncate text-[11.5px] sm:text-[12.5px]"
                  style={{
                    color: COLOR.inkSoft,
                  }}
                >
                  Results for{" "}
                  <span
                    className="font-semibold"
                    style={{
                      color: COLOR.ink,
                    }}
                  >
                    {searchText}
                  </span>
                </p>

                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="shrink-0 rounded-full px-2 py-1 text-[10.5px] font-medium sm:text-[12px]"
                  style={{
                    color: COLOR.accent,
                  }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* ====================================
                NO PRODUCTS
            ==================================== */}

            {filteredProducts.length === 0 ? (
              <div
                className="flex min-h-[420px] items-center justify-center rounded-[20px]"
                style={{
                  border: `1px dashed ${COLOR.lineStrong}`,
                  backgroundColor: COLOR.surface,
                }}
              >
                <div className="px-5 text-center">
                  <h2
                    className="text-[17px] font-semibold"
                    style={{
                      fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                      color: COLOR.ink,
                    }}
                  >
                    No products found
                  </h2>

                  <p
                    className="mt-1 text-[13px]"
                    style={{
                      color: COLOR.inkMuted,
                    }}
                  >
                    Try changing your filters or search.
                  </p>

                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-4 rounded-full px-5 py-2 text-[12.5px] font-medium text-white"
                    style={{
                      backgroundColor: COLOR.ink,
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* ==================================
                    PRODUCT GRID
                ================================== */}

                <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                  {paginatedProducts.map((product) => {
                    const price = getProductPrice(product);

                    const originalPrice = getOriginalPrice(product);

                    const discount =
                      originalPrice > price
                        ? Math.round(
                            ((originalPrice - price) / originalPrice) * 100,
                          )
                        : 0;

                    const image = getProductImage(product);

                    const outOfStock = Number(product.stock) <= 0;

                    return (
                      <div
                        key={product._id}
                        className="group relative min-w-0 overflow-hidden rounded-[18px] transition-shadow duration-300 sm:rounded-[22px]"
                        style={{
                          backgroundColor: COLOR.paper,
                          border: `1px solid ${COLOR.line}`,
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.boxShadow =
                            "0 12px 32px rgba(33,31,28,0.10)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.boxShadow = "none")
                        }
                      >
                        {/* IMAGE */}

                        <Link
                          href={`/Product/${product.slug}`}
                          className="relative block h-[165px] w-full overflow-hidden sm:h-[230px] lg:h-[240px]"
                          style={{
                            backgroundColor: COLOR.mist,
                          }}
                        >
                          <div className="relative h-full w-full p-2.5 sm:p-6">
                            <img
                              src={image}
                              alt={product.name || "Product"}
                              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>

                          {discount > 0 && (
                            <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
                              <span
                                className="rounded-full px-2 py-1 text-[7.5px] font-medium text-white sm:px-2.5 sm:text-[10.5px]"
                                style={{
                                  backgroundColor: COLOR.ink,
                                }}
                              >
                                Save ৳ {formatPrice(originalPrice - price)}
                              </span>
                            </div>
                          )}
                        </Link>

                        {/* INFO */}

                        <div className="px-2.5 pb-2.5 pt-3 sm:px-4 sm:pb-4 sm:pt-3.5">
                          <Link
                            href={`/Product/${product.slug}`}
                            className="block"
                          >
                            <h3
                              className="line-clamp-2 min-h-[34px] text-[11.5px] font-medium sm:min-h-0 sm:text-[14.5px]"
                              style={{
                                color: COLOR.ink,
                              }}
                            >
                              {product.name}
                            </h3>
                          </Link>

                          <div className="mt-1.5 flex min-w-0 flex-wrap items-baseline gap-1 sm:gap-2">
                            <span
                              className="text-[13px] font-semibold sm:text-[17px]"
                              style={{
                                color: COLOR.ink,
                              }}
                            >
                              ৳ {formatPrice(price)}
                            </span>

                            {originalPrice > price && (
                              <span
                                className="text-[9px] line-through sm:text-[12.5px]"
                                style={{
                                  color: COLOR.inkMuted,
                                }}
                              >
                                ৳ {formatPrice(originalPrice)}
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 flex items-center gap-1.5 sm:mt-3 sm:gap-2">
                            <Link
                              href={`/product/${product.slug}`}
                              className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-full text-[9.5px] font-medium sm:h-10 sm:text-[13px]"
                              style={
                                outOfStock
                                  ? {
                                      border: `1px solid ${COLOR.line}`,
                                      backgroundColor: COLOR.surface,
                                      color: COLOR.inkMuted,
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
                              disabled={outOfStock}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
                              style={{
                                border: `1px solid ${COLOR.line}`,
                                color: COLOR.inkSoft,
                              }}
                              title="Add to cart"
                            >
                              <ShoppingCart size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ==================================
                    PAGINATION
                ================================== */}

                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <p
                      className="text-[11px] sm:text-[11.5px]"
                      style={{
                        color: COLOR.inkMuted,
                      }}
                    >
                      Showing{" "}
                      <span
                        className="font-semibold"
                        style={{
                          color: COLOR.ink,
                        }}
                      >
                        {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}
                      </span>{" "}
                      –{" "}
                      <span
                        className="font-semibold"
                        style={{
                          color: COLOR.ink,
                        }}
                      >
                        {Math.min(
                          currentPage * PRODUCTS_PER_PAGE,
                          filteredProducts.length,
                        )}
                      </span>{" "}
                      of{" "}
                      <span
                        className="font-semibold"
                        style={{
                          color: COLOR.ink,
                        }}
                      >
                        {filteredProducts.length}
                      </span>
                    </p>

                    <div className="flex max-w-full items-center gap-1 overflow-x-auto px-1 pb-1">
                      {/* PREVIOUS */}

                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage((prev) => Math.max(1, prev - 1));

                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                        }}
                        className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full"
                        style={{
                          border: `1px solid ${COLOR.line}`,
                          backgroundColor: COLOR.paper,
                          color: COLOR.ink,
                          opacity: currentPage === 1 ? 0.35 : 1,
                        }}
                      >
                        <ChevronLeft size={15} />
                      </button>

                      {/* PAGE NUMBERS */}

                      {paginationItems.map((page, index) => {
                        const previous = paginationItems[index - 1];

                        const showDots = previous && page - previous > 1;

                        return (
                          <React.Fragment key={page}>
                            {showDots && (
                              <span
                                className="flex h-9 w-6 shrink-0 items-center justify-center text-[11px]"
                                style={{
                                  color: COLOR.inkMuted,
                                }}
                              >
                                ...
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPage(page);

                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                              className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full px-2.5 text-[11px] font-medium"
                              style={{
                                backgroundColor:
                                  currentPage === page
                                    ? COLOR.ink
                                    : COLOR.paper,
                                color:
                                  currentPage === page ? "#fff" : COLOR.ink,
                                border: `1px solid ${
                                  currentPage === page ? COLOR.ink : COLOR.line
                                }`,
                              }}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}

                      {/* NEXT */}

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          );

                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          });
                        }}
                        className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-full"
                        style={{
                          border: `1px solid ${COLOR.line}`,
                          backgroundColor: COLOR.paper,
                          color: COLOR.ink,
                          opacity: currentPage === totalPages ? 0.35 : 1,
                        }}
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

// ============================================
// SUSPENSE WRAPPER
// ============================================

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="h-4 w-52 animate-pulse rounded bg-gray-100" />

            <div className="mt-5 h-10 w-48 animate-pulse rounded bg-gray-100" />

            <div className="mt-8 grid gap-5 lg:grid-cols-[260px_1fr]">
              <div className="hidden h-[650px] animate-pulse rounded-[20px] bg-gray-100 lg:block" />

              <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
                {Array.from({
                  length: 6,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[360px] animate-pulse rounded-[22px] bg-gray-100"
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      }
    >
      <CategoryPageContent />
    </Suspense>
  );
}
