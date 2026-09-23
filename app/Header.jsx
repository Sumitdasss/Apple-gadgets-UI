
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Moon,
  Sun,
  ShoppingBag,
  User,
  Menu,
  X,
  TrendingUp,
  Clock3,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const API_BASE =
  "https://apple-gadgets-ui-backend.vercel.app";

const SEARCH_HISTORY_KEY = "apple_gadgets_search_history";

export default function Header() {
  // =====================================================
  // SEARCH
  // =====================================================

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const [productsLoading, setProductsLoading] =
    useState(false);

  // =====================================================
  // SEARCH HISTORY / TRENDING
  // =====================================================

  const [searchHistory, setSearchHistory] = useState([]);

  // =====================================================
  // CATEGORY
  // =====================================================

  const [isOpen, setIsOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

  const [
    expandedMobileCategories,
    setExpandedMobileCategories,
  ] = useState({});

  // =====================================================
  // MOBILE MENU
  // =====================================================

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  // =====================================================
  // THEME
  // =====================================================

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // =====================================================
  // REFS
  // =====================================================

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  // =====================================================
  // MOUNT
  // =====================================================

  useEffect(() => {
    setMounted(true);

    try {
      const saved = localStorage.getItem(
        SEARCH_HISTORY_KEY
      );

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setSearchHistory(parsed);
        }
      }
    } catch (error) {
      console.error(
        "Search history loading error:",
        error
      );
    }
  }, []);

  // =====================================================
  // TRENDING SEARCH
  // =====================================================

  const trendingSearches = useMemo(() => {
    const defaultTrending = [
      "iPhone 18 Pro Max",
      "iPhone 18 Pro",
      "Samsung Galaxy S25 Ultra",
      "MacBook Pro M5",
    ];

    if (!Array.isArray(searchHistory)) {
      return defaultTrending;
    }

    const sorted = [...searchHistory]
      .filter(
        (item) =>
          item &&
          typeof item.keyword === "string" &&
          item.keyword.trim()
      )
      .sort(
        (a, b) =>
          Number(b.count || 0) -
          Number(a.count || 0)
      )
      .map((item) => item.keyword.trim())
      .filter(Boolean);

    const unique = [];

    for (const keyword of sorted) {
      const exists = unique.some(
        (item) =>
          item.toLowerCase() ===
          keyword.toLowerCase()
      );

      if (!exists) {
        unique.push(keyword);
      }
    }

    const finalTrending = unique.slice(0, 6);

    if (finalTrending.length < 4) {
      for (const item of defaultTrending) {
        const exists = finalTrending.some(
          (keyword) =>
            keyword.toLowerCase() ===
            item.toLowerCase()
        );

        if (!exists) {
          finalTrending.push(item);
        }

        if (finalTrending.length >= 4) {
          break;
        }
      }
    }

    return finalTrending.slice(0, 6);
  }, [searchHistory]);

  // =====================================================
  // SAVE SEARCH HISTORY
  // =====================================================

  const saveSearchHistory = useCallback(
    (keyword) => {
      const cleanKeyword =
        String(keyword || "").trim();

      if (!cleanKeyword) return;

      try {
        const saved =
          localStorage.getItem(
            SEARCH_HISTORY_KEY
          );

        const current = saved
          ? JSON.parse(saved)
          : [];

        const list = Array.isArray(current)
          ? current
          : [];

        const existingIndex = list.findIndex(
          (item) =>
            String(item?.keyword || "")
              .toLowerCase() ===
            cleanKeyword.toLowerCase()
        );

        let updated = [...list];

        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            keyword:
              updated[existingIndex]
                .keyword || cleanKeyword,
            count:
              Number(
                updated[existingIndex].count || 0
              ) + 1,
            lastSearched: Date.now(),
          };
        } else {
          updated.push({
            keyword: cleanKeyword,
            count: 1,
            lastSearched: Date.now(),
          });
        }

        // বেশি বড় history না রাখার জন্য
        updated = updated
          .sort(
            (a, b) =>
              Number(b.count || 0) -
              Number(a.count || 0)
          )
          .slice(0, 30);

        localStorage.setItem(
          SEARCH_HISTORY_KEY,
          JSON.stringify(updated)
        );

        setSearchHistory(updated);
      } catch (error) {
        console.error(
          "Search history save error:",
          error
        );
      }
    },
    []
  );

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);

        const response = await fetch(
          `${API_BASE}/getallcatgoris`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load categories"
          );
        }

        const list = Array.isArray(data)
          ? data
          : data.categories ||
            data.data ||
            [];

        const getParentId = (item) => {
          return (
            item?.parent?._id ||
            item?.parent ||
            null
          );
        };

        const buildChildren = (parentId) => {
          return list
            .filter(
              (item) =>
                String(getParentId(item)) ===
                String(parentId)
            )
            .map((item) => ({
              ...item,
              children: buildChildren(
                item._id
              ),
            }));
        };

        const roots = list.filter(
          (item) => !getParentId(item)
        );

        const tree = roots.map((item) => ({
          ...item,
          children: buildChildren(
            item._id
          ),
        }));

        setCategories(tree);
      } catch (error) {
        console.error(
          "Header category loading error:",
          error
        );

        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);

        const response = await fetch(
          `${API_BASE}/getallProduct`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Failed to load products"
          );
        }

        const list = Array.isArray(data)
          ? data
          : data.products ||
            data.data ||
            [];

        setAllProducts(list);

        setSearchResults(
          list.slice(0, 8)
        );
      } catch (error) {
        console.error(
          "Header product loading error:",
          error
        );

        setAllProducts([]);
        setSearchResults([]);
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // =====================================================
  // SLUG GENERATOR
  // =====================================================

  const makeSlug = useCallback((item) => {
    if (item?.slug) {
      return item.slug;
    }

    return String(item?.name || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, []);

  // =====================================================
  // PRODUCT IMAGE
  // =====================================================

  const getProductImage = useCallback(
    (product) => {
      if (
        Array.isArray(product?.images) &&
        product.images.length > 0
      ) {
        return product.images[0];
      }

      if (product?.image) {
        return product.image;
      }

      return "";
    },
    []
  );

  // =====================================================
  // PRODUCT PRICE
  // =====================================================

  const getProductPrice = useCallback(
    (product) => {
      const price = Number(
        product?.price || 0
      );

      const discountPrice =
        product?.discountPrice !== null &&
        product?.discountPrice !== undefined &&
        product?.discountPrice !== ""
          ? Number(product.discountPrice)
          : null;

      const hasDiscount =
        discountPrice !== null &&
        discountPrice > 0 &&
        discountPrice < price;

      return {
        price,
        discountPrice,
        hasDiscount,
        finalPrice: hasDiscount
          ? discountPrice
          : price,
        discountAmount: hasDiscount
          ? price - discountPrice
          : 0,
      };
    },
    []
  );

  // =====================================================
  // SEARCH CHANGE
  // =====================================================

  const handleSearchChange = useCallback(
    (value) => {
      setSearch(value);

      const keyword = value
        .trim()
        .toLowerCase();

      if (!keyword) {
        setSearchResults(
          allProducts.slice(0, 8)
        );
        return;
      }

      const filtered = allProducts
        .filter((product) => {
          const name = String(
            product?.name || ""
          ).toLowerCase();

          const brand = String(
            product?.brand || ""
          ).toLowerCase();

          const sku = String(
            product?.sku || ""
          ).toLowerCase();

          const category = String(
            product?.category?.name ||
              product?.category ||
              ""
          ).toLowerCase();

          const shortDescription = String(
            product?.shortDescription || ""
          ).toLowerCase();

          const description = String(
            product?.description || ""
          ).toLowerCase();

          return (
            name.includes(keyword) ||
            brand.includes(keyword) ||
            sku.includes(keyword) ||
            category.includes(keyword) ||
            shortDescription.includes(keyword) ||
            description.includes(keyword)
          );
        })
        .slice(0, 12);

      setSearchResults(filtered);
    },
    [allProducts]
  );

  // =====================================================
  // SEARCH SUBMIT
  // =====================================================

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();

      const keyword = search.trim();

      if (!keyword) {
        setSearchFocused(true);
        return;
      }

      // Save search
      saveSearchHistory(keyword);

      setSearchFocused(false);
      setIsOpen(false);

      // Go to search page
      window.location.href =
        `/search?q=${encodeURIComponent(
          keyword
        )}`;
    },
    [search, saveSearchHistory]
  );

  // =====================================================
  // TRENDING SEARCH CLICK
  // =====================================================

  const handleTrendingSearch = useCallback(
    (value) => {
      const keyword = String(
        value || ""
      ).trim();

      if (!keyword) return;

      setSearch(keyword);

      saveSearchHistory(keyword);

      handleSearchChange(keyword);

      setSearchFocused(true);
    },
    [
      handleSearchChange,
      saveSearchHistory,
    ]
  );

  // =====================================================
  // CLOSE SEARCH
  // =====================================================

  const closeSearch = useCallback(() => {
    setSearchFocused(false);
  }, []);

  // =====================================================
  // OUTSIDE CLICK + ESCAPE
  // =====================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const desktopInside =
        desktopSearchRef.current?.contains(
          event.target
        );

      const mobileInside =
        mobileSearchRef.current?.contains(
          event.target
        );

      if (
        !desktopInside &&
        !mobileInside
      ) {
        setSearchFocused(false);
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSearchFocused(false);
        setIsOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  // =====================================================
  // MOBILE CATEGORY TOGGLE
  // =====================================================

  const toggleMobileCategory = (id) => {
    setExpandedMobileCategories(
      (prev) => ({
        ...prev,
        [id]: !prev[id],
      })
    );
  };

  // =====================================================
  // CLOSE MOBILE MENU
  // =====================================================

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // =====================================================
  // CLOSE EVERYTHING
  // =====================================================

  const closeAll = () => {
    setSearchFocused(false);
    setIsOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-[9999] w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">

      {/* =================================================
          MAIN HEADER
      ================================================= */}

      <div className="mx-auto max-w-[1440px] px-3 py-2.5 sm:px-4 lg:py-3">

        <div className="flex items-center justify-between gap-2 lg:gap-5">

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() =>
              setIsMobileMenuOpen(
                (prev) => !prev
              )
            }
            aria-label="Toggle Menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-800 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-800 lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X size={25} />
            ) : (
              <Menu size={25} />
            )}
          </button>

          {/* LOGO */}

          <Link
            href="/"
            aria-label="Homepage"
            onClick={closeAll}
            className="flex shrink-0 items-center"
          >
            <img
              src="https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2Flogo-3717.png&w=1920&q=100"
              alt="AppleGadgets"
              className="h-auto w-[105px] object-contain sm:w-[135px] lg:w-[175px] xl:w-[190px]"
            />
          </Link>

          {/* =================================================
              DESKTOP SEARCH
          ================================================= */}

          <div
            ref={desktopSearchRef}
            className="relative hidden min-w-0 flex-1 lg:flex lg:max-w-[600px]"
          >
            <form
              onSubmit={handleSearch}
              className="flex h-[46px] w-full items-center rounded-full border border-gray-200/70 bg-gray-100/80 px-2 transition-all focus-within:border-[#f47421] focus-within:bg-white focus-within:shadow-md dark:border-slate-700/60 dark:bg-slate-800/80 dark:focus-within:border-[#f47421] dark:focus-within:bg-slate-800"
            >

              {/* CATEGORY */}

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setIsOpen(
                      (prev) => !prev
                    )
                  }
                  className="group flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold text-gray-700 transition hover:text-[#f47421] dark:text-gray-200"
                >
                  <span>Category</span>

                  <ChevronDown
                    size={15}
                    className={`transition-transform ${
                      isOpen
                        ? "rotate-180 text-[#f47421]"
                        : "text-gray-500"
                    }`}
                  />
                </button>

                {/* CATEGORY DROPDOWN */}

                <div
                  className={`absolute left-0 top-[50px] z-[10000] w-[270px] rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 ${
                    isOpen
                      ? "visible translate-y-0 opacity-100"
                      : "invisible -translate-y-2 opacity-0"
                  }`}
                >
                  <div className="max-h-[420px] overflow-y-auto rounded-xl p-1">

                    {categoriesLoading ? (
                      <div className="px-3 py-4 text-sm text-gray-400">
                        Loading categories...
                      </div>
                    ) : categories.length ===
                      0 ? (
                      <div className="px-3 py-4 text-sm text-gray-400">
                        No categories found
                      </div>
                    ) : (
                      categories.map(
                        (category) => (
                          <Link
                            key={
                              category._id
                            }
                            href={`/category/${makeSlug(
                              category
                            )}`}
                            onClick={closeAll}
                            className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] font-medium text-gray-700 transition hover:bg-orange-50 hover:text-[#f47421] dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:text-[#f47421]"
                          >
                            <span>
                              {
                                category.name
                              }
                            </span>

                            {category
                              .children
                              ?.length >
                              0 && (
                              <ChevronRight
                                size={14}
                              />
                            )}
                          </Link>
                        )
                      )
                    )}

                  </div>
                </div>
              </div>

              <div className="h-5 w-px shrink-0 bg-gray-300 dark:bg-slate-700" />

              {/* SEARCH INPUT */}

              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">

                <Search
                  size={18}
                  className="shrink-0 text-gray-400"
                />

                <input
                  type="search"
                  value={search}
                  onFocus={() => {
                    setSearchFocused(
                      true
                    );

                    if (!search.trim()) {
                      setSearchResults(
                        allProducts.slice(
                          0,
                          8
                        )
                      );
                    }
                  }}
                  onChange={(e) =>
                    handleSearchChange(
                      e.target.value
                    )
                  }
                  placeholder="Search products..."
                  aria-label="Search products"
                  className="w-full bg-transparent text-[14px] font-medium text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
                />

              </div>

              {/* SEARCH BUTTON */}

              <button
                type="submit"
                className="flex shrink-0 items-center justify-center rounded-full bg-[#f47421] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[#e06211] active:scale-95"
              >
                Search
              </button>

            </form>

            {/* DESKTOP SEARCH PANEL */}

            {searchFocused && (
              <SearchPanel
                search={search}
                searchResults={searchResults}
                productsLoading={
                  productsLoading
                }
                trendingSearches={
                  trendingSearches
                }
                onTrendingClick={
                  handleTrendingSearch
                }
                onClose={closeSearch}
                getProductImage={
                  getProductImage
                }
                getProductPrice={
                  getProductPrice
                }
                makeSlug={makeSlug}
              />
            )}
          </div>

          {/* =================================================
              RIGHT NAV
          ================================================= */}

          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 lg:gap-4 xl:gap-5">

            <Link
              href="/blog"
              className="hidden text-[14px] font-medium text-gray-700 transition hover:text-[#f47421] dark:text-gray-200 lg:block"
            >
              Blog
            </Link>

            <Link
              href="/pre-order"
              className="hidden text-[14px] font-medium text-gray-700 transition hover:text-[#f47421] dark:text-gray-200 lg:block"
            >
              Pre-order
            </Link>

            <Link
              href="/offers"
              className="hidden items-center gap-1 text-[14px] font-semibold text-[#f47421] lg:flex"
            >
              <span>🎁</span>
              <span>Offers</span>
            </Link>

            <Link
              href="/compare"
              className="hidden text-[14px] font-medium text-gray-700 transition hover:text-[#f47421] dark:text-gray-200 lg:block"
            >
              ⇄ Compare
            </Link>

            {/* THEME */}

            {mounted && (
              <button
                type="button"
                aria-label="Toggle Theme"
                onClick={() =>
                  setTheme(
                    theme === "dark"
                      ? "light"
                      : "dark"
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-[#f47421] hover:text-[#f47421] dark:border-slate-800 dark:text-gray-200 sm:h-10 sm:w-10"
              >
                {theme === "dark" ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
              </button>
            )}

            {/* CART */}

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-800 transition hover:border-[#f47421] hover:text-[#f47421] dark:border-slate-700 dark:text-gray-200 sm:h-10 sm:w-10"
            >
              <ShoppingBag size={18} />

              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f47421] px-1 text-[10px] font-bold text-white">
                0
              </span>
            </Link>

            {/* ACCOUNT */}

            <Link
              href="/account"
              aria-label="Account"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-[#f47421] hover:text-[#f47421] dark:border-slate-800 dark:text-gray-200 sm:flex"
            >
              <User size={18} />
            </Link>

          </nav>
        </div>

        {/* =================================================
            MOBILE SEARCH
        ================================================= */}

        <div
          ref={mobileSearchRef}
          className="relative mt-2.5 lg:hidden"
        >

          <form
            onSubmit={handleSearch}
            className="flex h-[44px] w-full items-center rounded-full border border-gray-200 bg-white p-1 pl-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >

            <Search
              size={17}
              className="mr-2 shrink-0 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onFocus={() => {
                setSearchFocused(
                  true
                );

                if (!search.trim()) {
                  setSearchResults(
                    allProducts.slice(
                      0,
                      8
                    )
                  );
                }
              }}
              onChange={(e) =>
                handleSearchChange(
                  e.target.value
                )
              }
              placeholder="Search product, brand..."
              className="w-full bg-transparent text-[13px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
            />

            <button
              type="submit"
              className="flex h-9 w-11 shrink-0 items-center justify-center rounded-full bg-[#f47421] text-white transition hover:bg-[#e06211]"
            >
              <Search size={18} />
            </button>

          </form>

          {/* MOBILE SEARCH PANEL */}

          {searchFocused && (
            <div className="absolute left-1/2 top-[52px] z-[10000] w-[calc(100vw-24px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

              {/* TRENDING */}

              <div className="border-b border-gray-100 p-4 dark:border-slate-800">

                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp
                    size={17}
                    className="text-[#f47421]"
                  />

                  <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                    Trending Search
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">

                  {trendingSearches.map(
                    (item, index) => (
                      <button
                        key={`${item}-${index}`}
                        type="button"
                        onClick={() =>
                          handleTrendingSearch(
                            item
                          )
                        }
                        className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[12px] text-gray-600 transition hover:border-[#f47421] hover:text-[#f47421] dark:border-slate-700 dark:text-gray-300"
                      >
                        <TrendingUp
                          size={11}
                        />

                        {item}
                      </button>
                    )
                  )}

                </div>
              </div>

              {/* PRODUCTS */}

              <div className="p-4">

                <div className="mb-4 flex items-center justify-between">

                  <h3 className="text-[16px] font-bold text-gray-900 dark:text-white">
                    {search.trim()
                      ? "Search Products"
                      : "Popular Products"}
                  </h3>

                  <button
                    type="button"
                    onClick={closeSearch}
                    className="text-xs text-gray-400 hover:text-[#f47421]"
                  >
                    Close
                  </button>

                </div>

                <div className="max-h-[55vh] overflow-y-auto">

                  {productsLoading ? (
                    <div className="py-16 text-center text-sm text-gray-400">
                      Loading products...
                    </div>
                  ) : searchResults.length ===
                    0 ? (
                    <div className="py-16 text-center">

                      <Search
                        size={30}
                        className="mx-auto mb-3 text-gray-300"
                      />

                      <p className="text-sm font-medium text-gray-500">
                        No products found
                      </p>

                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">

                      {searchResults.map(
                        (product) => (
                          <ProductSearchCard
                            key={
                              product._id
                            }
                            product={
                              product
                            }
                            getProductImage={
                              getProductImage
                            }
                            getProductPrice={
                              getProductPrice
                            }
                            makeSlug={
                              makeSlug
                            }
                            onClick={
                              closeAll
                            }
                          />
                        )
                      )}

                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* =====================================================
          DESKTOP CATEGORY BAR
      ===================================================== */}

      <nav className="hidden w-full border-t border-gray-100 bg-gray-50/70 dark:border-slate-800/80 dark:bg-slate-900/60 lg:block">

        <div className="mx-auto flex h-[48px] max-w-[1440px] items-center justify-center gap-5 px-4 xl:gap-8">

          {categoriesLoading ? (
            <span className="text-sm text-gray-400">
              Loading categories...
            </span>
          ) : categories.length === 0 ? (
            <span className="text-sm text-gray-400">
              No categories
            </span>
          ) : (
            categories.map(
              (category) => (
                <DesktopCategory
                  key={category._id}
                  category={category}
                  makeSlug={makeSlug}
                />
              )
            )
          )}

        </div>
      </nav>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-0 z-[9998] h-screen overflow-y-auto bg-white px-4 pb-8 pt-[120px] shadow-2xl dark:bg-slate-900 lg:hidden">

          <div className="mx-auto max-w-[600px]">

            <div className="mb-4 flex items-center justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Menu
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  Categories
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeMobileMenu
                }
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 dark:border-slate-700 dark:text-gray-300"
              >
                <X size={20} />
              </button>

            </div>

            <div className="mb-5 grid grid-cols-2 gap-2">

              <Link
                href="/blog"
                onClick={
                  closeMobileMenu
                }
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-gray-200"
              >
                Blog
              </Link>

              <Link
                href="/offers"
                onClick={
                  closeMobileMenu
                }
                className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-[#f47421] dark:border-orange-900/40 dark:bg-orange-900/20"
              >
                🎁 Offers
              </Link>

              <Link
                href="/pre-order"
                onClick={
                  closeMobileMenu
                }
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-gray-200"
              >
                Pre-order
              </Link>

              <Link
                href="/compare"
                onClick={
                  closeMobileMenu
                }
                className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:text-gray-200"
              >
                ⇄ Compare
              </Link>

            </div>

            {categoriesLoading ? (
              <div className="py-8 text-center text-sm text-gray-400">
                Loading categories...
              </div>
            ) : categories.length ===
              0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No categories found
              </div>
            ) : (
              <div className="space-y-2">

                {categories.map(
                  (category) => {
                    const expanded =
                      expandedMobileCategories[
                        category._id
                      ];

                    return (
                      <div
                        key={
                          category._id
                        }
                        className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700"
                      >

                        <div className="flex items-center justify-between px-4 py-3.5">

                          <Link
                            href={`/category/${makeSlug(
                              category
                            )}`}
                            onClick={
                              closeMobileMenu
                            }
                            className="flex-1 text-sm font-bold text-gray-800 dark:text-gray-100"
                          >
                            {
                              category.name
                            }
                          </Link>

                          {category
                            .children
                            ?.length >
                            0 && (
                            <button
                              type="button"
                              onClick={() =>
                                toggleMobileCategory(
                                  category._id
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-slate-800"
                            >
                              <ChevronDown
                                size={17}
                                className={`transition-transform ${
                                  expanded
                                    ? "rotate-180 text-[#f47421]"
                                    : ""
                                }`}
                              />
                            </button>
                          )}

                        </div>

                        {expanded &&
                          category
                            .children
                            ?.length >
                            0 && (
                            <MobileCategoryChildren
                              items={
                                category.children
                              }
                              level={1}
                              expandedState={
                                expandedMobileCategories
                              }
                              toggle={
                                toggleMobileCategory
                              }
                              makeSlug={
                                makeSlug
                              }
                              closeMenu={
                                closeMobileMenu
                              }
                            />
                          )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>
        </div>
      )}

    </header>
  );
}

/* =========================================================
   DESKTOP CATEGORY
========================================================= */

function DesktopCategory({
  category,
  makeSlug,
}) {
  return (
    <div className="group relative h-full">

      <Link
        href={`/category/${makeSlug(
          category
        )}`}
        className="flex h-full items-center gap-1.5 whitespace-nowrap text-[14px] font-medium text-gray-700 transition hover:text-[#f47421] dark:text-gray-300"
      >
        <span>{category.name}</span>

        {category.children?.length >
          0 && (
          <ChevronDown
            size={12}
            className="transition-transform group-hover:rotate-180"
          />
        )}
      </Link>

      {category.children?.length >
        0 && (
        <div className="invisible absolute left-0 top-full z-[9999] min-w-[235px] translate-y-1 rounded-xl border border-gray-100 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-slate-800 dark:bg-slate-900">

          {category.children.map(
            (subCategory) => (
              <DesktopSubCategory
                key={
                  subCategory._id
                }
                category={
                  subCategory
                }
                makeSlug={
                  makeSlug
                }
              />
            )
          )}

        </div>
      )}

    </div>
  );
}

/* =========================================================
   DESKTOP SUB CATEGORY
========================================================= */

function DesktopSubCategory({
  category,
  makeSlug,
}) {
  return (
    <div className="group/sub relative">

      <Link
        href={`/category/${makeSlug(
          category
        )}`}
        className="flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-gray-700 transition hover:bg-orange-50 hover:text-[#f47421] dark:text-gray-300 dark:hover:bg-slate-800"
      >
        <span>{category.name}</span>

        {category.children?.length >
          0 && (
          <ChevronRight
            size={14}
            className="text-gray-400"
          />
        )}
      </Link>

      {category.children?.length >
        0 && (
        <div className="invisible absolute left-full top-0 z-[9999] min-w-[235px] -translate-x-2 rounded-xl border border-gray-100 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover/sub:visible group-hover/sub:translate-x-0 group-hover/sub:opacity-100 dark:border-slate-800 dark:bg-slate-900">

          {category.children.map(
            (childCategory) => (
              <DesktopSubCategory
                key={
                  childCategory._id
                }
                category={
                  childCategory
                }
                makeSlug={
                  makeSlug
                }
              />
            )
          )}

        </div>
      )}

    </div>
  );
}

/* =========================================================
   MOBILE CATEGORY CHILDREN
========================================================= */

function MobileCategoryChildren({
  items,
  level,
  expandedState,
  toggle,
  makeSlug,
  closeMenu,
}) {
  return (
    <div
      className={`space-y-1 border-t border-gray-100 bg-gray-50/70 p-2 dark:border-slate-700 dark:bg-slate-800/40 ${
        level > 1
          ? "ml-3 border-l-2 border-l-[#f47421]"
          : ""
      }`}
    >

      {items.map((item) => {
        const expanded =
          expandedState[item._id];

        return (
          <div
            key={item._id}
            className="rounded-lg bg-white dark:bg-slate-800"
          >

            <div className="flex items-center justify-between px-3 py-2.5">

              <Link
                href={`/category/${makeSlug(
                  item
                )}`}
                onClick={closeMenu}
                className={`flex-1 font-medium text-gray-700 dark:text-gray-200 ${
                  level === 1
                    ? "text-sm"
                    : level === 2
                    ? "text-xs"
                    : "text-[11px]"
                }`}
              >
                {item.name}
              </Link>

              {item.children?.length >
                0 && (
                <button
                  type="button"
                  onClick={() =>
                    toggle(
                      item._id
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400"
                >
                  <ChevronDown
                    size={
                      level === 1
                        ? 16
                        : 14
                    }
                    className={`transition-transform ${
                      expanded
                        ? "rotate-180 text-[#f47421]"
                        : ""
                    }`}
                  />
                </button>
              )}

            </div>

            {expanded &&
              item.children
                ?.length >
                0 && (
                <MobileCategoryChildren
                  items={
                    item.children
                  }
                  level={
                    level + 1
                  }
                  expandedState={
                    expandedState
                  }
                  toggle={toggle}
                  makeSlug={
                    makeSlug
                  }
                  closeMenu={
                    closeMenu
                  }
                />
              )}

          </div>
        );
      })}

    </div>
  );
}

/* =========================================================
   PRODUCT SEARCH CARD
========================================================= */

function ProductSearchCard({
  product,
  getProductImage,
  getProductPrice,
  makeSlug,
  onClick,
}) {
  const image =
    getProductImage(product);

  const {
    price,
    finalPrice,
    hasDiscount,
    discountAmount,
  } = getProductPrice(product);

  const slug = makeSlug(product);

  return (
    <Link
      href={`/Product/${
        slug || product._id
      }`}
      onClick={onClick}
      className="group block"
    >

      <div className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">

        {/* IMAGE */}

        <div className="mb-2 flex h-[125px] items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-slate-700">

          {image ? (
            <img
              src={image}
              alt={
                product.name ||
                "Product"
              }
              className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-center text-[10px] text-gray-400">
              No Image
            </div>
          )}

        </div>

        {/* NAME */}

        <h4 className="line-clamp-2 min-h-[38px] text-[13px] font-semibold leading-[18px] text-gray-900 dark:text-white">
          {product.name}
        </h4>

        {/* PRICE */}

        <div className="mt-2 flex flex-wrap items-center gap-1.5">

          <span className="text-[14px] font-bold text-gray-900 dark:text-white">
            ৳{" "}
            {finalPrice.toLocaleString()}
          </span>

          {hasDiscount && (
            <span className="text-[10px] text-gray-400 line-through">
              ৳{" "}
              {price.toLocaleString()}
            </span>
          )}

        </div>

        {/* DISCOUNT */}

        {hasDiscount && (
          <span className="mt-1.5 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-600 dark:bg-green-900/30 dark:text-green-400">
            ৳{" "}
            {discountAmount.toLocaleString()}{" "}
            OFF
          </span>
        )}

      </div>

    </Link>
  );
}

/* =========================================================
   DESKTOP SEARCH PANEL
========================================================= */

function SearchPanel({
  search,
  searchResults,
  productsLoading,
  trendingSearches,
  onTrendingClick,
  onClose,
  getProductImage,
  getProductPrice,
  makeSlug,
}) {
  return (
    <div className="absolute left-1/2 top-[58px] z-[9998] w-[min(950px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] dark:border-slate-700 dark:bg-slate-900">

      <div className="grid grid-cols-[190px_minmax(0,1fr)]">

        {/* =================================================
            TRENDING
        ================================================= */}

        <div className="border-r border-gray-100 p-5 dark:border-slate-800">

          <div className="mb-5 flex items-center gap-2">

            <TrendingUp
              size={18}
              className="text-[#f47421]"
            />

            <h3 className="text-[17px] font-bold text-gray-900 dark:text-white">
              Trending Search
            </h3>

          </div>

          <div className="space-y-3">

            {trendingSearches.map(
              (item, index) => (
                <button
                  key={`${item}-${index}`}
                  type="button"
                  onClick={() =>
                    onTrendingClick(
                      item
                    )
                  }
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-gray-600 transition hover:bg-orange-50 hover:text-[#f47421] dark:text-gray-300 dark:hover:bg-slate-800"
                >

                  <TrendingUp
                    size={13}
                    className="shrink-0 text-gray-400"
                  />

                  <span className="line-clamp-2">
                    {item}
                  </span>

                </button>
              )
            )}

          </div>

        </div>

        {/* =================================================
            PRODUCTS
        ================================================= */}

        <div className="min-w-0 p-5">

          <div className="mb-5 flex items-center justify-between">

            <div>

              <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">
                {search.trim()
                  ? "Search Products"
                  : "Popular Products"}
              </h3>

              {search.trim() && (
                <p className="mt-1 text-xs text-gray-400">
                  Results for {search}
                </p>
              )}

            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-gray-400 transition hover:text-[#f47421]"
            >
              Close
            </button>

          </div>

          <div className="max-h-[570px] overflow-y-auto pr-1">

            {productsLoading ? (
              <div className="flex min-h-[250px] items-center justify-center">
                <p className="text-sm text-gray-400">
                  Loading products...
                </p>
              </div>
            ) : searchResults.length ===
              0 ? (
              <div className="flex min-h-[250px] items-center justify-center">

                <div className="text-center">

                  <Search
                    size={34}
                    className="mx-auto mb-3 text-gray-300"
                  />

                  <p className="text-sm font-medium text-gray-500">
                    No products found
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Try another product
                    name
                  </p>

                </div>

              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">

                {searchResults.map(
                  (product) => (
                    <ProductSearchCard
                      key={
                        product._id
                      }
                      product={
                        product
                      }
                      getProductImage={
                        getProductImage
                      }
                      getProductPrice={
                        getProductPrice
                      }
                      makeSlug={
                        makeSlug
                      }
                      onClick={
                        onClose
                      }
                    />
                  )
                )}

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}