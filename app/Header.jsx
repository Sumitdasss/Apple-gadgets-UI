
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Moon,
  Sun,
  ShoppingBag,
  User,
  UserCircle,
  Menu,
  X,
  TrendingUp,
  LogOut,
  Package,
  Heart,
  Settings,
  Sparkles,
  Truck,
  ArrowUpRight,
  ShieldCheck,
  Clock3,
  SearchX,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useStore from "./Store/store";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";
const SEARCH_HISTORY_KEY = "apple_gadgets_search_history";

const DEFAULT_TRENDING = [
  "iPhone 18 Pro Max",
  "iPhone 18 Pro",
  "Samsung Galaxy S25 Ultra",
  "MacBook Pro M5",
];

const DATA_CACHE_TTL = 30 * 1000;

const headerDataCache = new Map();
const headerDataRequests = new Map();

async function fetchHeaderData(key, url) {
  const cached = headerDataCache.get(key);

  if (cached && Date.now() - cached.time < DATA_CACHE_TTL) {
    return cached.data;
  }

  if (headerDataRequests.has(key)) {
    return headerDataRequests.get(key);
  }

  const request = (async () => {
    const response = await fetch(url, {
      cache: "default",
      headers: {
        Accept: "application/json",
      },
    });

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      throw new Error(`API returned non-JSON response (${response.status})`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message || `API request failed (${response.status})`,
      );
    }

    headerDataCache.set(key, {
      data,
      time: Date.now(),
    });

    return data;
  })();

  headerDataRequests.set(key, request);

  try {
    return await request;
  } finally {
    if (headerDataRequests.get(key) === request) {
      headerDataRequests.delete(key);
    }
  }
}


const LOGO_URL =
  "https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2Flogo-3717.png&w=1920&q=100";

const C = {
  primary: "#18263D",
  secondary: "#52627A",
  muted: "#8290A5",
  accent: "#E96B32",
  accentHover: "#CF5421",
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-BD");

export default function Header() {
  const pathname = usePathname();
  const { cart } = useStore();
  const { theme, setTheme } = useTheme();

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [expandedMobileCategories, setExpandedMobileCategories] =
    useState({});

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const accountRef = useRef(null);

  const totalItems = Array.isArray(cart)
    ? cart.reduce(
        (total, item) => total + Number(item.quantity || 1),
        0,
      )
    : 0;

  const closeSearch = useCallback(() => {
    setSearchFocused(false);
    setCategoryMenuOpen(false);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const closeAll = useCallback(() => {
    setSearchFocused(false);
    setCategoryMenuOpen(false);
    setIsMobileMenuOpen(false);
    setAccountOpen(false);
  }, []);

  // Mount and search history
  useEffect(() => {
    setMounted(true);

    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      if (Array.isArray(parsed)) setSearchHistory(parsed);
    } catch (error) {
      console.error("Search history loading error:", error);
    }
  }, []);

  // Prevent background scrolling while the mobile menu is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [isMobileMenuOpen]);

  // Authentication
  useEffect(() => {
    let cancelled = false;

    const getSavedUser = () => {
      try {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    };

    const loadLoggedInUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setAuthLoading(false);
        }
        return;
      }

      const cachedUser = getSavedUser();

      if (cachedUser && !cancelled) {
        setUser(cachedUser);
        setAuthLoading(false);
      }

      try {
        const response = await fetch(`${API_BASE}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (!cancelled) setUser(null);
          } else if (!cancelled && !cachedUser) {
            setUser(null);
          }
          return;
        }

        const loggedInUser =
          result?.data?.user ??
          result?.data?.data?.user ??
          result?.data ??
          result?.user;

        if (!loggedInUser || typeof loggedInUser !== "object") return;

        if (!cancelled) setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
      } catch (error) {
        console.error("Account loading error:", error);
        if (!cancelled && !cachedUser) setUser(null);
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };

    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      const cachedUser = getSavedUser();

      if (token && cachedUser) {
        setUser(cachedUser);
        setAuthLoading(false);
      } else if (!token) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      loadLoggedInUser();
    };

    const handleStorageChange = (event) => {
      if (
        event.key === "token" ||
        event.key === "user" ||
        event.key === null
      ) {
        handleAuthChange();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleAuthChange();
      }
    };

    loadLoggedInUser();

    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      const saved = localStorage.getItem("user");
      const cachedUser = saved ? JSON.parse(saved) : null;

      if (cachedUser) {
        setUser(cachedUser);
        setAuthLoading(false);
      } else {
        window.dispatchEvent(new Event("auth-change"));
      }
    } catch {
      window.dispatchEvent(new Event("auth-change"));
    }
  }, [pathname]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setAccountOpen(false);
    setIsMobileMenuOpen(false);

    window.dispatchEvent(new Event("auth-change"));
    window.location.href = "/Auth";
  }, []);

  // Search history
  const saveSearchHistory = useCallback((keyword) => {
    const cleanKeyword = String(keyword || "").trim();
    if (!cleanKeyword) return;

    try {
      const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      const list = Array.isArray(parsed) ? parsed : [];

      const existingIndex = list.findIndex(
        (item) =>
          String(item?.keyword || "").toLowerCase() ===
          cleanKeyword.toLowerCase(),
      );

      let updated = [...list];

      if (existingIndex >= 0) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          keyword: updated[existingIndex].keyword || cleanKeyword,
          count: Number(updated[existingIndex].count || 0) + 1,
          lastSearched: Date.now(),
        };
      } else {
        updated.push({
          keyword: cleanKeyword,
          count: 1,
          lastSearched: Date.now(),
        });
      }

      updated = updated
        .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
        .slice(0, 30);

      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (error) {
      console.error("Search history save error:", error);
    }
  }, []);

  const trendingSearches = useMemo(() => {
    const sorted = searchHistory
      .filter((item) => item?.keyword?.trim())
      .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))
      .map((item) => item.keyword.trim());

    const unique = [];

    for (const keyword of [...sorted, ...DEFAULT_TRENDING]) {
      if (
        !unique.some(
          (item) => item.toLowerCase() === keyword.toLowerCase(),
        )
      ) {
        unique.push(keyword);
      }
    }

    return unique.slice(0, 6);
  }, [searchHistory]);

  // Categories
 // Categories - cached loading
useEffect(() => {
  let cancelled = false;

  const loadCategories = async () => {
    const cacheKey = "header-category-tree";
    const cached = headerDataCache.get(cacheKey);

    // Cached data immediately show
    if (cached && !cancelled) {
      const data = cached.data;

      const list = Array.isArray(data?.categories)
        ? data.categories
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const normalizeSubChild = (item) => ({
        ...item,
        children: [],
      });

      const normalizeChild = (item) => ({
        ...item,
        children: Array.isArray(item?.subChildCategories)
          ? item.subChildCategories.map(normalizeSubChild)
          : [],
      });

      const normalizeSub = (item) => ({
        ...item,
        children: Array.isArray(item?.childCategories)
          ? item.childCategories.map(normalizeChild)
          : [],
      });

      setCategories(
        list.map((item) => ({
          ...item,
          children: Array.isArray(item?.subCategories)
            ? item.subCategories.map(normalizeSub)
            : [],
        })),
      );

      setCategoriesLoading(false);
    } else if (!cancelled) {
      setCategoriesLoading(true);
    }

    try {
      const data = await fetchHeaderData(
        cacheKey,
        `${API_BASE}/category/tree`,
      );

      const list = Array.isArray(data?.categories)
        ? data.categories
        : Array.isArray(data?.data)
          ? data.data
          : [];

      const normalizeSubChild = (item) => ({
        ...item,
        children: [],
      });

      const normalizeChild = (item) => ({
        ...item,
        children: Array.isArray(item?.subChildCategories)
          ? item.subChildCategories.map(normalizeSubChild)
          : [],
      });

      const normalizeSub = (item) => ({
        ...item,
        children: Array.isArray(item?.childCategories)
          ? item.childCategories.map(normalizeChild)
          : [],
      });

      const normalized = list.map((item) => ({
        ...item,
        children: Array.isArray(item?.subCategories)
          ? item.subCategories.map(normalizeSub)
          : [],
      }));

      if (!cancelled) {
        setCategories(normalized);
      }
    } catch (error) {
      console.error("Header category loading error:", error);

      if (!cancelled && !cached) {
        setCategories([]);
      }
    } finally {
      if (!cancelled) {
        setCategoriesLoading(false);
      }
    }
  };

  loadCategories();

  return () => {
    cancelled = true;
  };
}, []);
  // Products
  // Products - cached loading and duplicate request prevention
useEffect(() => {
  let cancelled = false;

  const cacheKey = "header-all-products";

  const normalizeProducts = (data) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.products)) {
      return data.products;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  };

  const loadProducts = async () => {
    const cached = headerDataCache.get(cacheKey);

    // Immediately display cached products
    if (cached && !cancelled) {
      const cachedProducts = normalizeProducts(cached.data);

      setAllProducts(cachedProducts);
      setSearchResults(cachedProducts.slice(0, 8));
      setProductsLoading(false);
    } else if (!cancelled) {
      setProductsLoading(true);
    }

    try {
      const data = await fetchHeaderData(
        cacheKey,
        `${API_BASE}/products/getALLproducts`,
      );

      const list = normalizeProducts(data);

      if (!cancelled) {
        setAllProducts(list);

        // Keep current search results relevant after data refresh
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
          setSearchResults(list.slice(0, 8));
        } else {
          const filtered = list
            .filter((product) => {
              const name = String(product?.name || "").toLowerCase();
              const brand = String(product?.brand || "").toLowerCase();
              const sku = String(product?.sku || "").toLowerCase();
              const category = String(
                product?.category?.name || product?.category || "",
              ).toLowerCase();

              const shortDescription = String(
                product?.shortDescription || "",
              ).toLowerCase();

              const description = String(
                product?.description || "",
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
        }
      }
    } catch (error) {
      console.error("Header product loading error:", error);

      if (!cancelled && !cached) {
        setAllProducts([]);
        setSearchResults([]);
      }
    } finally {
      if (!cancelled) {
        setProductsLoading(false);
      }
    }
  };

  loadProducts();

  return () => {
    cancelled = true;
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // Product helpers
  const makeSlug = useCallback((item) => {
    if (item?.slug) return item.slug;

    return String(item?.name || "")
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }, []);

  const getProductImage = useCallback((product) => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      const firstImage = product.images[0];

      return typeof firstImage === "string"
        ? firstImage
        : firstImage?.url || firstImage?.secure_url || "";
    }

    if (typeof product?.image === "string") return product.image;
    return product?.image?.url || "";
  }, []);

  const getProductPrice = useCallback((product) => {
    const price = Number(product?.price || 0);

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
      finalPrice: hasDiscount ? discountPrice : price,
      discountAmount: hasDiscount ? price - discountPrice : 0,
    };
  }, []);

  const handleSearchChange = useCallback(
    (value) => {
      setSearch(value);

      const keyword = value.trim().toLowerCase();

      if (!keyword) {
        setSearchResults(allProducts.slice(0, 8));
        return;
      }

      const filtered = allProducts
        .filter((product) => {
          const name = String(product?.name || "").toLowerCase();
          const brand = String(product?.brand || "").toLowerCase();
          const sku = String(product?.sku || "").toLowerCase();
          const category = String(
            product?.category?.name || product?.category || "",
          ).toLowerCase();
          const shortDescription = String(
            product?.shortDescription || "",
          ).toLowerCase();
          const description = String(
            product?.description || "",
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
    [allProducts],
  );

  const handleSearch = useCallback(
    (event) => {
      event.preventDefault();

      const keyword = search.trim();

      if (!keyword) {
        setSearchFocused(true);
        return;
      }

      saveSearchHistory(keyword);
      closeAll();

      window.location.href = `/search?q=${encodeURIComponent(keyword)}`;
    },
    [search, saveSearchHistory, closeAll],
  );

  const handleTrendingSearch = useCallback(
    (value) => {
      const keyword = String(value || "").trim();
      if (!keyword) return;

      setSearch(keyword);
      handleSearchChange(keyword);
      setSearchFocused(true);
    },
    [handleSearchChange],
  );

  const toggleMobileCategory = useCallback((id) => {
    setExpandedMobileCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  // Outside click and Escape

  // Outside click and Escape
  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;

      const desktopInside =
        desktopSearchRef.current?.contains(target) ?? false;

      const mobileInside =
        mobileSearchRef.current?.contains(target) ?? false;

      const accountInside =
        accountRef.current?.contains(target) ?? false;

      if (!desktopInside && !mobileInside) {
        setSearchFocused(false);
        setCategoryMenuOpen(false);
      }

      if (!accountInside) {
        setAccountOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSearchFocused(false);
        setCategoryMenuOpen(false);
        setIsMobileMenuOpen(false);
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);


  return (
    <header className="sticky top-0 z-[9990] w-full font-[family-name:var(--font-manrope)] text-[13px] font-medium text-[#18263D] antialiased dark:text-[#EDF2FA]">
      {/* Announcement bar */}
      <div className="relative overflow-hidden bg-[#101828] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(233,107,50,0.2),transparent_50%)]" />

        <div className="relative mx-auto flex min-h-[34px] max-w-[1600px] items-center justify-center gap-2 px-3 text-center text-[10px] font-semibold tracking-wide sm:text-xs">
          <Sparkles size={13} className="shrink-0 text-orange-300" />
          <span>Your favourite tech, delivered with care.</span>

          <Link
            href="/offers"
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-1 font-extrabold text-[#FFB58C] transition hover:text-white"
          >
            Explore offers
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-slate-200/80 bg-white/95 shadow-[0_8px_30px_rgba(15,23,42,0.045)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#09090b]/95">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-6 xl:px-10">
          <div className="flex min-h-[76px] items-center gap-3 sm:gap-5 xl:gap-8">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:border-orange-300 hover:bg-orange-50 hover:text-[#CF5421] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-orange-500/10 lg:hidden"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              prefetch={false}
              href="/"
              onClick={closeAll}
              aria-label="Apple Gadgets homepage"
              className="flex shrink-0 items-center"
            >
              <img
                src={LOGO_URL}
                alt="Apple Gadgets"
                className="h-auto w-[100px] object-contain sm:w-[135px] xl:w-[165px]"
              />
            </Link>

            {/* Desktop search */}
            <div
              ref={desktopSearchRef}
              className="relative hidden min-w-0 flex-1 lg:block"
            >
              <form
                onSubmit={handleSearch}
                className="group flex h-[50px] items-center rounded-2xl border border-slate-200 bg-[#F5F7FB] p-1 transition-all duration-200 focus-within:border-orange-300 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(233,107,50,0.08)] dark:border-white/10 dark:bg-white/[0.045] dark:focus-within:bg-[#111113]"
              >
                <div className="relative h-full shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryMenuOpen((prev) => !prev);
                      setSearchFocused(false);
                    }}
                    aria-expanded={categoryMenuOpen}
                    className="flex h-full items-center gap-2 rounded-xl px-3 text-[12px] font-bold text-[#52627A] transition hover:bg-white hover:text-[#CF5421] dark:text-[#C0CADA] dark:hover:bg-white/5 sm:px-4"
                  >
                    <span className="hidden xl:inline">All</span>
                    Categories
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${
                        categoryMenuOpen
                          ? "rotate-180 text-[#E96B32]"
                          : ""
                      }`}
                    />
                  </button>

                  {categoryMenuOpen && (
                    <div className="absolute left-0 top-[57px] z-[10001] w-[300px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[#111113]">
                      <div className="rounded-xl bg-[#F5F7FB] px-3 py-3 dark:bg-white/[0.04]">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#E96B32]">
                          Discover
                        </p>
                        <p className="mt-1 text-sm font-extrabold">
                          Shop by category
                        </p>
                      </div>

                      <div className="mt-2 max-h-[350px] overflow-y-auto">
                        {categoriesLoading ? (
                          <SearchMessage>Loading categories...</SearchMessage>
                        ) : categories.length === 0 ? (
                          <SearchMessage>No categories found</SearchMessage>
                        ) : (
                          categories.map((category) => (
                            <Link
                              key={category._id}
                              prefetch={false}
                              href={`/category/${makeSlug(category)}`}
                              onClick={closeAll}
                              className="group flex items-center justify-between rounded-xl px-3 py-3 text-[13px] font-semibold transition hover:bg-orange-50 hover:text-[#CF5421] dark:hover:bg-orange-500/10"
                            >
                              <span>{category.name}</span>
                              <ChevronRight
                                size={15}
                                className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#E96B32]"
                              />
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mx-1 h-6 w-px bg-slate-200 dark:bg-white/10" />

                <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
                  <Search
                    size={18}
                    className="shrink-0 text-[#8290A5] transition group-focus-within:text-[#E96B32]"
                  />

                  <input
                    type="search"
                    value={search}
                    onFocus={() => {
                      setSearchFocused(true);
                      setCategoryMenuOpen(false);
                    }}
                    onChange={(event) =>
                      handleSearchChange(event.target.value)
                    }
                    placeholder="Search products, brands and more..."
                    aria-label="Search products"
                    className="w-full min-w-0 bg-transparent text-[13px] font-medium text-[#283952] outline-none placeholder:text-[#8290A5] dark:text-[#EDF2FA] dark:placeholder:text-[#8E9BB0]"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange("")}
                      aria-label="Clear search"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="flex h-[40px] shrink-0 items-center gap-2 rounded-xl bg-[#E96B32] px-4 text-[12px] font-extrabold text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#CF5421] active:scale-[0.98] xl:px-5"
                >
                  <Search size={15} />
                  <span>Search</span>
                </button>
              </form>

              {searchFocused && (
                <SearchPanel
                  search={search}
                  searchResults={searchResults}
                  productsLoading={productsLoading}
                  trendingSearches={trendingSearches}
                  onTrendingClick={handleTrendingSearch}
                  onClose={closeSearch}
                  getProductImage={getProductImage}
                  getProductPrice={getProductPrice}
                  makeSlug={makeSlug}
                />
              )}
            </div>

            {/* Header actions */}
            <nav className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 xl:gap-4">
              <Link
                prefetch={false}
                href="/blog"
                className="hidden text-[13px] font-semibold text-[#52627A] transition hover:text-[#CF5421] dark:text-[#C0CADA] xl:block"
              >
                Journal
              </Link>

              <Link
                prefetch={false}
                href="/pre-order"
                className="hidden text-[13px] font-semibold text-[#52627A] transition hover:text-[#CF5421] dark:text-[#C0CADA] xl:block"
              >
                Pre-order
              </Link>

              <Link
                prefetch={false}
                href="/offers"
                className="hidden h-10 items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 text-[12px] font-extrabold text-[#CF5421] transition hover:border-orange-300 hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-[#FFB58C] dark:hover:bg-orange-400/15 sm:flex"
              >
                <Sparkles size={15} />
                Offers
              </Link>

              <Link
                prefetch={false}
                href="/compare"
                aria-label="Compare products"
                title="Compare products"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-transparent text-[#52627A] transition hover:border-slate-200 hover:bg-slate-50 hover:text-[#CF5421] dark:text-[#C0CADA] dark:hover:border-white/10 dark:hover:bg-white/5 md:flex"
              >
                <span className="text-xl leading-none">⇄</span>
              </Link>

              {mounted && (
                <button
                  type="button"
                  aria-label="Toggle theme"
                  title={
                    theme === "dark"
                      ? "Switch to light mode"
                      : "Switch to dark mode"
                  }
                  onClick={() =>
                    setTheme(theme === "dark" ? "light" : "dark")
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#52627A] transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#CF5421] dark:border-white/10 dark:bg-white/[0.04] dark:text-[#C0CADA] dark:hover:bg-orange-500/10"
                >
                  {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
                </button>
              )}

              {/* Cart */}
              <Link
                prefetch={false}
                href="/cart"
                aria-label={`Shopping bag, ${totalItems} items`}
                title="Shopping bag"
                className="group relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:border-orange-200 hover:bg-orange-50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-orange-500/10"
              >
                <ShoppingBag
                  size={19}
                  className="text-[#40516B] transition group-hover:text-[#E96B32] dark:text-white"
                />
                <span className="absolute -right-1.5 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-[#E96B32] px-1 text-[9px] font-extrabold text-white dark:border-[#09090b]">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              </Link>

              {/* Account */}
              <div ref={accountRef} className="relative">
                {authLoading ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10">
                    <User size={18} className="text-slate-400" />
                  </div>
                ) : user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setAccountOpen((prev) => !prev)}
                      aria-expanded={accountOpen}
                      className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 transition hover:border-orange-200 hover:bg-orange-50/50 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-orange-500/10 sm:pr-3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 text-[#CF5421] dark:from-orange-500/20 dark:to-orange-400/10 dark:text-[#FFB58C]">
                        <UserCircle size={19} />
                      </span>
                      <span className="hidden max-w-[100px] text-left sm:block">
                        <span className="block max-w-[100px] truncate text-[11px] font-extrabold leading-4">
                          {user.name || "My Account"}
                        </span>
                        <span className="block text-[9px] text-[#8290A5]">
                          My account
                        </span>
                      </span>
                      <ChevronDown
                        size={14}
                        className={`hidden text-slate-400 transition sm:block ${
                          accountOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {accountOpen && (
                      <div className="absolute right-0 top-[52px] z-[10002] w-[285px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#111113]">
                        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-white p-4 dark:from-orange-500/10 dark:to-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#E96B32] shadow-sm dark:bg-white/10">
                              <UserCircle size={25} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-extrabold">
                                {user.name || "Customer"}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-[#687991] dark:text-[#AEBACD]">
                                {user.email || "Welcome back"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                            <ShieldCheck size={13} />
                            Signed in successfully
                          </div>
                        </div>

                        <div className="py-2">
                          <AccountLink href="/profile" icon={UserCircle} label="My Profile" onClick={closeAll} />
                          <AccountLink href="/orders" icon={Package} label="My Orders" onClick={closeAll} />
                          <AccountLink href="/wishlist" icon={Heart} label="My Wishlist" onClick={closeAll} />
                          <AccountLink href="/cart" icon={ShoppingBag} label="My Shopping Bag" onClick={closeAll} />
                          <AccountLink href="/settings" icon={Settings} label="Account Settings" onClick={closeAll} />
                        </div>

                        <div className="border-t border-slate-100 pt-2 dark:border-white/10">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-bold text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10">
                              <LogOut size={16} />
                            </span>
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href="/Auth"
                    prefetch={false}
                    className="flex h-10 items-center gap-2 rounded-xl bg-[#101828] px-3.5 text-white transition hover:bg-[#CF5421] sm:px-4 dark:bg-white dark:text-[#18263D] dark:hover:bg-orange-300"
                  >
                    <User size={16} />
                    <span className="hidden text-xs font-extrabold sm:block">
                      Sign in
                    </span>
                  </Link>
                )}
              </div>
            </nav>
          </div>

          {/* Mobile search */}
          <div ref={mobileSearchRef} className="relative pb-3.5 lg:hidden">
            <form
              onSubmit={handleSearch}
              className="group flex h-[46px] items-center gap-2 rounded-2xl border border-slate-200 bg-[#F5F7FB] px-3 transition focus-within:border-orange-300 focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(233,107,50,0.08)] dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:bg-[#111113]"
            >
              <Search
                size={18}
                className="shrink-0 text-[#8290A5] group-focus-within:text-[#E96B32]"
              />
              <input
                type="search"
                value={search}
                onFocus={() => setSearchFocused(true)}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search products and brands..."
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#283952] outline-none placeholder:text-[#8290A5] dark:text-[#EDF2FA] dark:placeholder:text-[#8E9BB0]"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => handleSearchChange("")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                aria-label="Submit search"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E96B32] text-white shadow-sm shadow-orange-500/20 transition hover:bg-[#CF5421] active:scale-95"
              >
                <Search size={17} />
              </button>
            </form>

            {searchFocused && (
              <div className="absolute left-0 right-0 top-[52px] z-[10000] max-h-[75vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[#111113]">
                <div className="border-b border-slate-100 p-4 dark:border-white/10">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[#E96B32] dark:bg-orange-500/10">
                      <TrendingUp size={15} />
                    </span>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#52627A] dark:text-[#C0CADA]">
                      Trending searches
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((item, index) => (
                      <button
                        key={`${item}-${index}`}
                        type="button"
                        onClick={() => handleTrendingSearch(item)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold transition hover:border-orange-300 hover:bg-orange-50 hover:text-[#CF5421] dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-orange-500/10"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold">
                        {search.trim() ? "Search results" : "Popular products"}
                      </h3>
                      {search.trim() && (
                        <p className="mt-1 max-w-[240px] truncate text-[11px] text-[#8290A5]">
                          Results for “{search}”
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={closeSearch}
                      className="rounded-lg px-3 py-2 text-xs font-bold text-[#8290A5] transition hover:bg-slate-100 hover:text-[#CF5421] dark:hover:bg-white/10"
                    >
                      Close
                    </button>
                  </div>

                  {productsLoading ? (
                    <SearchMessage>Loading products...</SearchMessage>
                  ) : searchResults.length === 0 ? (
                    <SearchMessage>No products found</SearchMessage>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {searchResults.slice(0, 8).map((product) => (
                        <ProductSearchCard
                          key={product._id}
                          product={product}
                          getProductImage={getProductImage}
                          getProductPrice={getProductPrice}
                          makeSlug={makeSlug}
                          onClick={closeAll}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop category navigation */}
        <nav className="hidden border-t border-slate-100 bg-[#F8FAFD] dark:border-white/[0.06] dark:bg-white/[0.02] lg:block">
          <div className="mx-auto flex h-[46px] max-w-[1600px] items-center justify-center gap-5 overflow-visible px-8 xl:gap-8">
            {categoriesLoading ? (
              <span className="text-xs text-[#8290A5]">Loading categories...</span>
            ) : categories.length === 0 ? (
              <span className="text-xs text-[#8290A5]">No categories found</span>
            ) : (
              categories.map((category) => (
                <DesktopCategory
                  key={category._id}
                  category={category}
                  makeSlug={makeSlug}
                />
              ))
            )}
          </div>
        </nav>
      </div>

      {/* Mobile drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[99999] h-[100dvh] w-full overflow-y-auto overscroll-contain bg-[#F7F9FC] text-[#18263D] dark:bg-[#09090b] dark:text-[#EDF2FA] lg:hidden"
          style={{
            isolation: "isolate",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className="mx-auto min-h-full max-w-[640px] px-4 pb-10 pt-5">
            <div className="mb-5 flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm dark:bg-white/[0.04]">
              <div className="flex min-w-0 items-center gap-3">
                <img
                  src={LOGO_URL}
                  alt="Apple Gadgets"
                  className="h-auto w-[105px] object-contain"
                />
                <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#E96B32]">
                    Discover
                  </p>
                  <h2 className="mt-0.5 text-sm font-extrabold">
                    Explore store
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Close menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:border-orange-300 hover:text-[#CF5421] dark:border-white/10 dark:bg-white/[0.04]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              <DrawerBenefit icon={Truck} label="Delivery" sublabel="Convenient" />
              <DrawerBenefit icon={ShieldCheck} label="Shopping" sublabel="With care" />
              <DrawerBenefit icon={Clock3} label="Support" sublabel="Here to help" />
            </div>

            <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-white/[0.025]">
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-extrabold">Quick access</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8290A5]">
                  Explore
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MobileNavLink href="/blog" label="Journal" onClick={closeMobileMenu} />
                <MobileNavLink href="/offers" label="✦ Special offers" onClick={closeMobileMenu} highlighted />
                <MobileNavLink href="/pre-order" label="Pre-order" onClick={closeMobileMenu} />
                <MobileNavLink href="/compare" label="Compare products" onClick={closeMobileMenu} />

                {user ? (
                  <>
                    <MobileNavLink href="/profile" label="My Profile" onClick={closeMobileMenu} />
                    <MobileNavLink href="/orders" label="My Orders" onClick={closeMobileMenu} />
                    <MobileNavLink href="/wishlist" label="My Wishlist" onClick={closeMobileMenu} />
                    <MobileNavLink href="/cart" label={`My Bag (${totalItems})`} onClick={closeMobileMenu} />
                    <MobileNavLink href="/settings" label="Settings" onClick={closeMobileMenu} />
                  </>
                ) : (
                  <MobileNavLink href="/Auth" label="Sign in / Register" onClick={closeMobileMenu} highlighted />
                )}
              </div>

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              )}
            </div>

            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#E96B32]">
                  Browse collection
                </p>
                <h3 className="mt-1 text-xl font-extrabold tracking-tight">
                  Categories
                </h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-[#52627A] shadow-sm dark:bg-white/[0.05] dark:text-[#C0CADA]">
                {categories.length} categories
              </span>
            </div>

            {categoriesLoading ? (
              <SearchMessage>Loading categories...</SearchMessage>
            ) : categories.length === 0 ? (
              <SearchMessage>No categories found</SearchMessage>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => {
                  const expanded = expandedMobileCategories[category._id];

                  return (
                    <div
                      key={category._id}
                      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)] dark:border-white/10 dark:bg-white/[0.025]"
                    >
                      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <Link
                          prefetch={false}
                          href={`/category/${makeSlug(category)}`}
                          onClick={closeMobileMenu}
                          className="flex-1 text-[13px] font-bold transition hover:text-[#CF5421]"
                        >
                          {category.name}
                        </Link>
                        {category.children?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleMobileCategory(category._id)}
                            aria-label={`Expand ${category.name}`}
                            aria-expanded={Boolean(expanded)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-[#52627A] transition hover:bg-orange-50 hover:text-[#CF5421] dark:bg-white/[0.05] dark:hover:bg-orange-500/10"
                          >
                            <ChevronDown
                              size={16}
                              className={`transition-transform ${expanded ? "rotate-180 text-[#E96B32]" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                      {expanded && category.children?.length > 0 && (
                        <MobileCategoryChildren
                          items={category.children}
                          level={1}
                          expandedState={expandedMobileCategories}
                          toggle={toggleMobileCategory}
                          makeSlug={makeSlug}
                          closeMenu={closeMobileMenu}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-[#101828] p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#FFB58C]">
                    Apple Gadgets
                  </p>
                  <h3 className="mt-2 text-lg font-extrabold">
                    Find your next favourite tech.
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    Explore products, discover offers and find what works for you.
                  </p>
                </div>
                <Sparkles size={25} className="shrink-0 text-[#FFB58C]" />
              </div>
              <Link
                href="/offers"
                prefetch={false}
                onClick={closeMobileMenu}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#E96B32] px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#CF5421]"
              >
                Explore offers
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function AccountLink({ href, icon: Icon, label, onClick }) {
  return (
    <Link
      href={href}
      prefetch={false}
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#52627A] transition hover:bg-orange-50 hover:text-[#CF5421] dark:text-[#C0CADA] dark:hover:bg-orange-500/10"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[#52627A] transition group-hover:bg-orange-100 group-hover:text-[#CF5421] dark:bg-white/[0.05] dark:group-hover:bg-orange-500/10">
        <Icon size={16} />
      </span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={14} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#E96B32]" />
    </Link>
  );
}

function MobileNavLink({ href, label, onClick, highlighted = false }) {
  return (
    <Link
      prefetch={false}
      href={href}
      onClick={onClick}
      className={`flex min-h-[43px] items-center rounded-xl border px-3 py-2.5 text-[12px] font-bold transition ${
        highlighted
          ? "border-orange-200 bg-orange-50 text-[#CF5421] hover:bg-orange-100 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-[#FFB58C]"
          : "border-slate-200/80 bg-white text-[#40516B] hover:border-orange-200 hover:bg-orange-50/50 dark:border-white/10 dark:bg-white/[0.025] dark:text-[#D5DEEB] dark:hover:bg-orange-500/10"
      }`}
    >
      {label}
    </Link>
  );
}

function DrawerBenefit({ icon: Icon, label, sublabel }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-2 py-3 text-center dark:border-white/10 dark:bg-white/[0.025]">
      <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#E96B32] dark:bg-orange-500/10">
        <Icon size={16} />
      </span>
      <p className="mt-2 text-[11px] font-extrabold">{label}</p>
      <p className="mt-0.5 text-[9px] text-[#8290A5]">{sublabel}</p>
    </div>
  );
}

function DesktopCategory({ category, makeSlug }) {
  const hasChildren = category?.children?.length > 0;

  return (
    <div className="group relative h-full">
      <Link
        prefetch={false}
        href={`/category/${makeSlug(category)}`}
        className="relative flex h-full items-center gap-1.5 whitespace-nowrap text-[12px] font-bold tracking-[0.01em] text-[#52627A] transition-colors duration-200 hover:text-[#CF5421] dark:text-[#C0CADA] dark:hover:text-[#FFAA78]"
      >
        {category.name}
        {hasChildren && (
          <ChevronDown size={12} className="transition-transform duration-200 group-hover:rotate-180" />
        )}
        <span className="absolute inset-x-0 bottom-0 h-[2px] origin-center scale-x-0 rounded-full bg-[#E96B32] transition-transform duration-200 group-hover:scale-x-100" />
      </Link>

      {hasChildren && (
        <div className="invisible absolute left-0 top-full z-[9999] min-w-[250px] translate-y-2 rounded-2xl border border-slate-200/90 bg-white p-2 opacity-0 shadow-[0_20px_50px_rgba(15,23,42,0.16)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-white/10 dark:bg-[#111113]">
          <div className="mb-1 rounded-xl bg-[#F5F7FB] px-3 py-2.5 dark:bg-white/[0.04]">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#E96B32]">
              Browse collection
            </p>
            <p className="mt-1 text-xs font-extrabold">{category.name}</p>
          </div>

          {category.children.map((child) => (
            <DesktopSubCategory key={child._id} category={child} makeSlug={makeSlug} />
          ))}

          <Link
            href={`/category/${makeSlug(category)}`}
            prefetch={false}
            className="mt-1 flex items-center justify-between rounded-xl border-t border-slate-100 px-3 py-3 text-xs font-extrabold text-[#E96B32] transition hover:bg-orange-50 dark:border-white/10 dark:hover:bg-orange-500/10"
          >
            View all {category.name}
            <ArrowUpRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}

function DesktopSubCategory({ category, makeSlug }) {
  const hasChildren = category?.children?.length > 0;

  return (
    <div className="group/sub relative">
      <Link
        prefetch={false}
        href={`/category/${makeSlug(category)}`}
        className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#52627A] transition-colors hover:bg-orange-50 hover:text-[#CF5421] dark:text-[#C0CADA] dark:hover:bg-orange-500/10 dark:hover:text-[#FFAA78]"
      >
        <span>{category.name}</span>
        {hasChildren && <ChevronRight size={14} className="text-slate-400" />}
      </Link>

      {hasChildren && (
        <div className="invisible absolute left-full top-0 z-[9999] min-w-[245px] -translate-x-2 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-[0_20px_50px_rgba(15,23,42,0.16)] transition-all duration-200 group-hover/sub:visible group-hover/sub:translate-x-0 group-hover/sub:opacity-100 dark:border-white/10 dark:bg-[#111113]">
          {category.children.map((child) => (
            <DesktopSubCategory key={child._id} category={child} makeSlug={makeSlug} />
          ))}
        </div>
      )}
    </div>
  );
}

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
      className={`space-y-1 border-t border-slate-100 bg-slate-50/70 p-2 dark:border-white/[0.06] dark:bg-white/[0.025] ${
        level > 1 ? "ml-3 border-l-2 border-l-[#E96B32]" : ""
      }`}
    >
      {items.map((item) => {
        const expanded = expandedState[item._id];
        const hasChildren = item?.children?.length > 0;

        return (
          <div key={item._id} className="rounded-xl bg-white dark:bg-white/[0.035]">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5">
              <Link
                prefetch={false}
                href={`/category/${makeSlug(item)}`}
                onClick={closeMenu}
                className={`flex-1 font-semibold text-[#40516B] transition hover:text-[#CF5421] dark:text-[#D5DEEB] ${
                  level === 1 ? "text-sm" : level === 2 ? "text-xs" : "text-[11px]"
                }`}
              >
                {item.name}
              </Link>

              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggle(item._id)}
                  aria-label={`Expand ${item.name}`}
                  aria-expanded={Boolean(expanded)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-orange-50 hover:text-[#CF5421] dark:hover:bg-orange-500/10"
                >
                  <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180 text-[#E96B32]" : ""}`} />
                </button>
              )}
            </div>

            {expanded && hasChildren && (
              <MobileCategoryChildren
                items={item.children}
                level={level + 1}
                expandedState={expandedState}
                toggle={toggle}
                makeSlug={makeSlug}
                closeMenu={closeMenu}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProductSearchCard({
  product,
  getProductImage,
  getProductPrice,
  makeSlug,
  onClick,
}) {
  const image = getProductImage(product);
  const { price, finalPrice, hasDiscount, discountAmount } = getProductPrice(product);
  const slug = makeSlug(product) || product._id;

  return (
    <Link
      prefetch={false}
      href={`/Product/${slug}`}
      onClick={onClick}
      className="group block min-w-0"
    >
      <div className="h-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2.5 transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_12px_30px_rgba(15,23,42,0.09)] dark:border-white/10 dark:bg-white/[0.035] dark:hover:border-orange-400/30">
        <div className="relative mb-3 flex h-[125px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-white/[0.055] dark:to-white/[0.015] sm:h-[145px]">
          {hasDiscount && (
            <span className="absolute left-2 top-2 z-10 rounded-lg bg-[#E96B32] px-2 py-1 text-[9px] font-extrabold text-white shadow-sm">
              SALE
            </span>
          )}
          {image ? (
            <img
              src={image}
              alt={product.name || "Product"}
              loading="lazy"
              className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <ShoppingBag size={22} />
              <span className="text-[10px]">No Image</span>
            </div>
          )}
        </div>

        <h4 className="line-clamp-2 min-h-[38px] text-xs font-bold leading-[19px] text-[#283952] transition group-hover:text-[#CF5421] dark:text-white sm:text-[13px]">
          {product.name}
        </h4>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-extrabold tracking-tight text-[#18263D] dark:text-white">
            ৳ {money(finalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-[#8290A5] line-through">
              ৳ {money(price)}
            </span>
          )}
        </div>

        {hasDiscount && (
          <span className="mt-2 inline-flex rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-extrabold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            Save ৳ {money(discountAmount)}
          </span>
        )}
      </div>
    </Link>
  );
}

function SearchMessage({ children }) {
  return (
    <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 text-sm font-medium text-[#8290A5]">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 dark:bg-white/[0.04]">
        <SearchX size={20} />
      </span>
      {children}
    </div>
  );
}

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
    <div className="absolute left-1/2 top-[60px] z-[9998] w-[min(1000px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.2)] dark:border-white/10 dark:bg-[#111113]">
      <div className="grid grid-cols-[205px_minmax(0,1fr)]">
        <div className="border-r border-slate-100 bg-[#F5F7FB] p-5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-[#E96B32] dark:bg-orange-500/10">
              <TrendingUp size={16} />
            </span>
            <div>
              <h3 className="text-[13px] font-extrabold">Trending</h3>
              <p className="mt-0.5 text-[10px] text-[#8290A5]">Popular searches</p>
            </div>
          </div>

          <div className="space-y-1">
            {trendingSearches.map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                onClick={() => onTrendingClick(item)}
                className="group flex w-full items-start gap-2 rounded-xl px-2.5 py-2.5 text-left text-xs font-medium text-[#52627A] transition hover:bg-white hover:text-[#CF5421] dark:text-[#C0CADA] dark:hover:bg-white/[0.05]"
              >
                <span className="mt-0.5 text-[10px] font-extrabold text-slate-300 group-hover:text-[#E96B32]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="line-clamp-2 flex-1">{item}</span>
                <ArrowUpRight size={12} className="mt-0.5 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-[#101828] p-3 text-white">
            <Sparkles size={16} className="text-[#FFB58C]" />
            <p className="mt-2 text-xs font-extrabold">Find your next tech.</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-300">
              Explore products made for your everyday.
            </p>
          </div>
        </div>

        <div className="min-w-0 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#E96B32]">
                Product discovery
              </p>
              <h3 className="mt-1 text-base font-extrabold">
                {search.trim() ? "Search results" : "Popular products"}
              </h3>
              {search.trim() && (
                <p className="mt-1 max-w-[450px] truncate text-xs text-[#8290A5]">
                  Results for “{search}”
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-[#52627A] transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#CF5421] dark:border-white/10 dark:hover:bg-orange-500/10"
            >
              <X size={13} />
              Close
            </button>
          </div>

          <div className="max-h-[510px] overflow-y-auto pr-1">
            {productsLoading ? (
              <SearchMessage>Loading products...</SearchMessage>
            ) : searchResults.length === 0 ? (
              <SearchMessage>No products found. Try another keyword.</SearchMessage>
            ) : (
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {searchResults.slice(0, 9).map((product) => (
                  <ProductSearchCard
                    key={product._id}
                    product={product}
                    getProductImage={getProductImage}
                    getProductPrice={getProductPrice}
                    makeSlug={makeSlug}
                    onClick={onClose}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
