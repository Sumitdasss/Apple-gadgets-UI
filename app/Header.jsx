
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
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:4000";

export default function Header() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [expandedMobileCategories, setExpandedMobileCategories] =
    useState({});

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ============================================
  // LOAD CATEGORIES FROM DATABASE
  // ============================================
  useEffect(() => {
    setMounted(true);

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);

        const response = await fetch(`${API_BASE}/getallcatgoris`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load categories"
          );
        }

        const list = Array.isArray(data)
          ? data
          : data.categories || data.data || [];

        // ============================================
        // GET PARENT ID
        // ============================================
        const getParentId = (item) => {
          return item.parent?._id || item.parent || null;
        };

        // ============================================
        // BUILD TREE
        // ============================================
        const buildChildren = (parentId) => {
          return list
            .filter(
              (item) => getParentId(item) === parentId
            )
            .map((item) => ({
              ...item,
              children: buildChildren(item._id),
            }));
        };

        // ============================================
        // ROOT CATEGORIES
        // ============================================
        const roots = list.filter(
          (item) => !getParentId(item)
        );

        const tree = roots.map((item) => ({
          ...item,
          children: buildChildren(item._id),
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

  // ============================================
  // SLUG GENERATOR
  // ============================================
  const makeSlug = (item) => {
    if (item?.slug) {
      return item.slug;
    }

    return item?.name
      ?.toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // ============================================
  // MOBILE CATEGORY TOGGLE
  // ============================================
  const toggleMobileCategory = (id) => {
    setExpandedMobileCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ============================================
  // SEARCH
  // ============================================
  const handleSearch = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    window.location.href = `/search?q=${encodeURIComponent(
      search.trim()
    )}`;
  };

  return (
    <header className="sticky top-0 z-[9999] w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/95">
      {/* =====================================================
          MAIN HEADER
      ===================================================== */}
      <div className="mx-auto max-w-[1440px] px-4 py-2.5 lg:py-3">
        <div className="flex items-center justify-between gap-2 lg:gap-4">
          {/* =================================================
              MOBILE MENU BUTTON
          ================================================= */}
          <button
            type="button"
            onClick={() =>
              setIsMobileMenuOpen((prev) => !prev)
            }
            aria-label="Toggle Menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-800 dark:text-gray-200 lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X size={26} />
            ) : (
              <Menu size={26} />
            )}
          </button>

          {/* =================================================
              LOGO
          ================================================= */}
          <Link
            href="/"
            aria-label="Homepage"
            className="flex shrink-0 items-center transition-transform duration-200 active:scale-95"
          >
            <img
              src="https://www.applegadgetsbd.com/_next/image?url=https%3A%2F%2Fadminapi.applegadgetsbd.com%2Fstorage%2Fmedia%2Flarge%2Flogo-3717.png&w=1920&q=100"
              alt="AppleGadgets"
              className="h-auto w-[130px] object-contain sm:w-[160px] lg:w-[190px]"
            />
          </Link>

          {/* =================================================
              DESKTOP SEARCH
          ================================================= */}
          <form
            onSubmit={handleSearch}
            className="hidden h-[46px] flex-1 items-center rounded-full border border-gray-200/70 bg-gray-100/80 px-2 transition-all focus-within:border-[#f47421] focus-within:bg-white focus-within:shadow-md dark:border-slate-700/60 dark:bg-slate-800/80 dark:focus-within:border-[#f47421] dark:focus-within:bg-slate-800 lg:flex lg:max-w-[580px]"
          >
            {/* CATEGORY SEARCH DROPDOWN */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setIsOpen((prev) => !prev)
                }
                className="group flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-gray-700 transition hover:text-[#f47421] dark:text-gray-200"
              >
                <span>Category</span>

                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${
                    isOpen
                      ? "rotate-180 text-[#f47421]"
                      : "text-gray-500"
                  }`}
                />
              </button>

              {/* SEARCH CATEGORY DROPDOWN */}
              <div
                className={`absolute left-0 top-[50px] z-[99999] w-[260px] rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 ${
                  isOpen
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-2 opacity-0"
                }`}
              >
                <div className="max-h-[420px] overflow-y-auto rounded-xl p-1">
                  {categoriesLoading ? (
                    <div className="px-3 py-3 text-sm text-gray-400">
                      Loading categories...
                    </div>
                  ) : categories.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-gray-400">
                      No categories found
                    </div>
                  ) : (
                    categories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/category/${makeSlug(
                          category
                        )}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-[14px] font-medium text-gray-700 transition hover:bg-orange-50 hover:text-[#f47421] dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:text-[#f47421]"
                      >
                        {category.name}

                        {category.children?.length > 0 && (
                          <ChevronRight size={14} />
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="h-5 w-px shrink-0 bg-gray-300 dark:bg-slate-700" />

            {/* SEARCH INPUT */}
            <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
              <Search
                size={18}
                className="text-gray-400 dark:text-gray-500"
              />

              <input
                type="search"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search products..."
                aria-label="Search products"
                className="w-full bg-transparent text-[14px] font-medium text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            <button
              type="submit"
              className="flex shrink-0 items-center justify-center rounded-full bg-[#f47421] px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#e06211] active:scale-95"
            >
              Search
            </button>
          </form>

          {/* =================================================
              RIGHT NAVIGATION
          ================================================= */}
          <nav className="flex items-center gap-1.5 sm:gap-3 lg:gap-5">
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
              className="hidden items-center gap-1 text-[14px] font-semibold text-[#f47421] transition hover:opacity-80 lg:flex"
            >
              <span>🎁</span>
              <span>Offers</span>
            </Link>

            <Link
              href="/compare"
              className="hidden text-[14px] font-medium text-gray-700 transition hover:text-[#f47421] dark:text-gray-200 lg:flex"
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
                    theme === "dark" ? "light" : "dark"
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:border-[#f47421] hover:text-[#f47421] dark:border-slate-800 dark:text-gray-200 dark:hover:border-[#f47421] dark:hover:text-[#f47421] sm:h-10 sm:w-10"
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
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 text-gray-800 transition-colors hover:border-[#f47421] hover:text-[#f47421] dark:border-slate-700 dark:text-gray-200 sm:h-10 sm:w-10"
            >
              <ShoppingBag size={18} />

              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#f47421] px-1 text-[10px] font-bold text-white shadow-sm">
                0
              </span>
            </Link>

            {/* ACCOUNT */}
            <Link
              href="/account"
              aria-label="Account"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition-colors hover:border-[#f47421] hover:text-[#f47421] dark:border-slate-800 dark:text-gray-200 dark:hover:border-[#f47421] dark:hover:text-[#f47421] sm:flex"
            >
              <User size={18} />
            </Link>
          </nav>
        </div>

        {/* =================================================
            MOBILE SEARCH
        ================================================= */}
        <div className="mt-2.5 lg:hidden">
          <form
            onSubmit={handleSearch}
            className="flex h-[44px] w-full items-center justify-between rounded-full border border-gray-200 bg-white p-1 pl-4 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <input
              type="search"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search product, brand, and more..."
              className="w-full bg-transparent text-[13px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
            />

            <button
              type="submit"
              className="flex h-9 w-11 shrink-0 items-center justify-center rounded-full bg-[#f47421] text-white transition-all hover:bg-[#e06211] active:scale-95"
            >
              <Search size={18} />
            </button>
          </form>
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
            categories.map((category) => (
              <div
                key={category._id}
                className="group relative h-full"
              >
                {/* ==========================================
                    ROOT CATEGORY HEADING
                ========================================== */}
                <Link
                  href={`/category/${makeSlug(category)}`}
                  className="flex h-full items-center gap-1.5 whitespace-nowrap text-[14px] font-medium text-gray-700 transition-colors duration-200 hover:text-[#f47421] dark:text-gray-300 dark:hover:text-[#f47421]"
                >
                  <span>{category.name}</span>

                  {category.children?.length > 0 && (
                    <ChevronDown
                      size={12}
                      className="transition-transform duration-200 group-hover:rotate-180"
                    />
                  )}
                </Link>

                {/* ==========================================
                    LEVEL 1
                    CATEGORY → SUB CATEGORY
                ========================================== */}
                {category.children?.length > 0 && (
                  <div className="invisible absolute left-0 top-full z-[9999] min-w-[230px] translate-y-1 rounded-xl border border-gray-100 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 dark:border-slate-800 dark:bg-slate-900">
                    {category.children.map((subCategory) => (
                      <div
                        key={subCategory._id}
                        className="group/sub relative"
                      >
                        {/* SUB CATEGORY */}
                        <Link
                          href={`/category/${makeSlug(
                            subCategory
                          )}`}
                          className="flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-orange-50 hover:text-[#f47421] dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-[#f47421]"
                        >
                          <span>
                            {subCategory.name}
                          </span>

                          {subCategory.children
                            ?.length > 0 && (
                            <ChevronRight
                              size={14}
                              className="text-gray-400"
                            />
                          )}
                        </Link>

                        {/* ==================================
                            LEVEL 2
                            SUB CATEGORY → CHILD CATEGORY
                        ================================== */}
                        {subCategory.children?.length >
                          0 && (
                          <div className="invisible absolute left-full top-0 z-[9999] min-w-[230px] -translate-x-2 rounded-xl border border-gray-100 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover/sub:visible group-hover/sub:translate-x-0 group-hover/sub:opacity-100 dark:border-slate-800 dark:bg-slate-900">
                            {subCategory.children.map(
                              (childCategory) => (
                                <div
                                  key={childCategory._id}
                                  className="group/child relative"
                                >
                                  {/* CHILD CATEGORY */}
                                  <Link
                                    href={`/category/${makeSlug(
                                      childCategory
                                    )}`}
                                    className="flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-orange-50 hover:text-[#f47421] dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-[#f47421]"
                                  >
                                    <span>
                                      {
                                        childCategory.name
                                      }
                                    </span>

                                    {childCategory
                                      .children
                                      ?.length >
                                      0 && (
                                      <ChevronRight
                                        size={14}
                                        className="text-gray-400"
                                      />
                                    )}
                                  </Link>

                                  {/* =================================
                                      LEVEL 3
                                      CHILD → SUB CHILD
                                  ================================= */}
                                  {childCategory.children
                                    ?.length > 0 && (
                                    <div className="invisible absolute left-full top-0 z-[9999] min-w-[230px] -translate-x-2 rounded-xl border border-gray-100 bg-white py-2 opacity-0 shadow-xl transition-all duration-200 group-hover/child:visible group-hover/child:translate-x-0 group-hover/child:opacity-100 dark:border-slate-800 dark:bg-slate-900">
                                      {childCategory.children.map(
                                        (
                                          subChildCategory
                                        ) => (
                                          <Link
                                            key={
                                              subChildCategory._id
                                            }
                                            href={`/category/${makeSlug(
                                              subChildCategory
                                            )}`}
                                            className="block px-4 py-2.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-orange-50 hover:text-[#f47421] dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-[#f47421]"
                                          >
                                            {
                                              subChildCategory.name
                                            }
                                          </Link>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </nav>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-x-0 top-[110px] z-[9999] max-h-[calc(100vh-120px)] overflow-y-auto border-b border-gray-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:hidden">
          <div className="flex flex-col gap-2">
            <span className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Categories
            </span>

            {categoriesLoading ? (
              <div className="py-4 text-center text-sm text-gray-400">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-400">
                No categories found
              </div>
            ) : (
              categories.map((category) => {
                const categoryExpanded =
                  expandedMobileCategories[
                    category._id
                  ];

                return (
                  <div
                    key={category._id}
                    className="rounded-xl border border-gray-100 dark:border-slate-800"
                  >
                    {/* ROOT CATEGORY */}
                    <div className="flex items-center justify-between px-3 py-3">
                      <Link
                        href={`/category/${makeSlug(
                          category
                        )}`}
                        onClick={() =>
                          setIsMobileMenuOpen(false)
                        }
                        className="text-sm font-semibold text-gray-800 hover:text-[#f47421] dark:text-gray-100"
                      >
                        {category.name}
                      </Link>

                      {category.children?.length >
                        0 && (
                        <button
                          type="button"
                          onClick={() =>
                            toggleMobileCategory(
                              category._id
                            )
                          }
                          className="p-1 text-gray-500 hover:text-[#f47421]"
                        >
                          <ChevronDown
                            size={18}
                            className={`transition-transform duration-200 ${
                              categoryExpanded
                                ? "rotate-180 text-[#f47421]"
                                : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* LEVEL 1 */}
                    {categoryExpanded &&
                      category.children?.length >
                        0 && (
                        <div className="space-y-1 bg-gray-50/70 p-2 dark:bg-slate-800/40">
                          {category.children.map(
                            (subCategory) => {
                              const subExpanded =
                                expandedMobileCategories[
                                  subCategory._id
                                ];

                              return (
                                <div
                                  key={
                                    subCategory._id
                                  }
                                  className="rounded-lg bg-white dark:bg-slate-800"
                                >
                                  <div className="flex items-center justify-between px-3 py-2.5">
                                    <Link
                                      href={`/category/${makeSlug(
                                        subCategory
                                      )}`}
                                      onClick={() =>
                                        setIsMobileMenuOpen(
                                          false
                                        )
                                      }
                                      className="text-xs font-semibold text-gray-800 dark:text-gray-200"
                                    >
                                      {
                                        subCategory.name
                                      }
                                    </Link>

                                    {subCategory
                                      .children
                                      ?.length >
                                      0 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleMobileCategory(
                                            subCategory._id
                                          )
                                        }
                                        className="p-1 text-gray-500 hover:text-[#f47421]"
                                      >
                                        <ChevronDown
                                          size={16}
                                          className={`transition-transform ${
                                            subExpanded
                                              ? "rotate-180 text-[#f47421]"
                                              : ""
                                          }`}
                                        />
                                      </button>
                                    )}
                                  </div>

                                  {/* LEVEL 2 */}
                                  {subExpanded &&
                                    subCategory
                                      .children
                                      ?.length >
                                      0 && (
                                      <div className="ml-3 border-l-2 border-[#f47421] py-1 pl-3">
                                        {subCategory.children.map(
                                          (
                                            childCategory
                                          ) => {
                                            const childExpanded =
                                              expandedMobileCategories[
                                                childCategory._id
                                              ];

                                            return (
                                              <div
                                                key={
                                                  childCategory._id
                                                }
                                                className="rounded-md"
                                              >
                                                <div className="flex items-center justify-between py-2">
                                                  <Link
                                                    href={`/category/${makeSlug(
                                                      childCategory
                                                    )}`}
                                                    onClick={() =>
                                                      setIsMobileMenuOpen(
                                                        false
                                                      )
                                                    }
                                                    className="text-[11px] font-medium text-gray-600 hover:text-[#f47421] dark:text-gray-300"
                                                  >
                                                    {
                                                      childCategory.name
                                                    }
                                                  </Link>

                                                  {childCategory
                                                    .children
                                                    ?.length >
                                                    0 && (
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        toggleMobileCategory(
                                                          childCategory._id
                                                        )
                                                      }
                                                      className="p-1 text-gray-400"
                                                    >
                                                      <ChevronDown
                                                        size={
                                                          14
                                                        }
                                                        className={`transition-transform ${
                                                          childExpanded
                                                            ? "rotate-180 text-[#f47421]"
                                                            : ""
                                                        }`}
                                                      />
                                                    </button>
                                                  )}
                                                </div>

                                                {/* LEVEL 3 */}
                                                {childExpanded &&
                                                  childCategory
                                                    .children
                                                    ?.length >
                                                    0 && (
                                                    <div className="ml-3 border-l border-gray-200 pl-3 dark:border-slate-700">
                                                      {childCategory.children.map(
                                                        (
                                                          subChildCategory
                                                        ) => (
                                                          <Link
                                                            key={
                                                              subChildCategory._id
                                                            }
                                                            href={`/category/${makeSlug(
                                                              subChildCategory
                                                            )}`}
                                                            onClick={() =>
                                                              setIsMobileMenuOpen(
                                                                false
                                                              )
                                                            }
                                                            className="block py-1.5 text-[10px] text-gray-500 hover:text-[#f47421] dark:text-gray-400"
                                                          >
                                                            {
                                                              subChildCategory.name
                                                            }
                                                          </Link>
                                                        )
                                                      )}
                                                    </div>
                                                  )}
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </header>
  );
}

