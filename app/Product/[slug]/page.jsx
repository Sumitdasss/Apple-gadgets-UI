/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Inter } from "next/font/google";
import {
  ChevronRight,
  Minus,
  Plus,
  ArrowLeftRight,
  MessageCircle,
  Percent,
  ShoppingBag,
  Truck,
  Check,
  ShieldCheck,
} from "lucide-react";

import RecentlyViewed from "../../Componant/RecentlyViewed";
import useStore from "../../Store/store.js";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const { addTocart } = useStore();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedColorImage, setSelectedColorImage] = useState("");
  const [selectedRam, setSelectedRam] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // =====================================================
  // AUTH CHECK
  // =====================================================
  const requireLogin = () => {
    if (typeof window === "undefined") return false;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Add to Cart করতে হলে আগে Login করুন!");

      const currentPath = window.location.pathname;

      router.push(
        `/Auth?redirect=${encodeURIComponent(currentPath)}`
      );

      return false;
    }

    return true;
  };

  const handleAddToCart2 = (product) => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push(
        `/Auth?redirect=${encodeURIComponent("/CheakOut")}&message=login_required`
      );
      return;
    }

    addTocart(product);
    router.push("/CheakOut");
  };

  // =====================================================
  // FETCH PRODUCT
  // =====================================================
  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function fetchProduct() {
      try {
        setLoading(true);

        const currentSlug = Array.isArray(slug) ? slug[0] : slug;

        const response = await fetch(
          `${API_BASE}/products/getALLproducts?slug=${encodeURIComponent(
            currentSlug
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const data = await response.json();

        let foundProduct = null;

        if (Array.isArray(data)) {
          foundProduct =
            data.find(
              (item) =>
                item?.slug === currentSlug ||
                item?._id === currentSlug
            ) || null;
        } else if (Array.isArray(data?.products)) {
          foundProduct =
            data.products.find(
              (item) =>
                item?.slug === currentSlug ||
                item?._id === currentSlug
            ) || null;
        } else if (Array.isArray(data?.data)) {
          foundProduct =
            data.data.find(
              (item) =>
                item?.slug === currentSlug ||
                item?._id === currentSlug
            ) || null;
        } else if (data?.product) {
          foundProduct = data.product;
        } else if (data?.data?.product) {
          foundProduct = data.data.product;
        } else if (data?._id || data?.slug) {
          foundProduct = data;
        } else if (data?.data?._id || data?.data?.slug) {
          foundProduct = data.data;
        }

        if (cancelled) return;

        setProduct(foundProduct);

        setSelectedImage(0);
        setSelectedColorImage("");
        setSelectedColor("");
        setSelectedRam("");
        setSelectedStorage("");
        setSelectedVariant(null);
        setQuantity(1);

        if (foundProduct?.colors?.length) {
          const firstColor = foundProduct.colors[0];

          if (typeof firstColor === "object" && firstColor !== null) {
            const colorName =
              firstColor.name || firstColor.value || "";

            const colorImage = firstColor.image || "";

            setSelectedColor(colorName);
            setSelectedColorImage(colorImage);

            if (colorImage && Array.isArray(foundProduct.images)) {
              const index = foundProduct.images.indexOf(colorImage);

              if (index >= 0) {
                setSelectedImage(index);
              }
            }
          } else {
            setSelectedColor(firstColor);
          }
        }

        if (foundProduct?.variants?.length) {
          const firstVariant = foundProduct.variants[0];

          setSelectedRam(firstVariant?.ram || "");
          setSelectedStorage(firstVariant?.storage || "");
        } else if (foundProduct?.sizes?.length) {
          const firstSize = foundProduct.sizes[0];

          setSelectedStorage(
            typeof firstSize === "object"
              ? firstSize?.name ||
                  firstSize?.value ||
                  firstSize?.storage ||
                  ""
              : firstSize
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Product details error:", error);
          setProduct(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // =====================================================
  // PRODUCT IMAGES
  // =====================================================
  const images = useMemo(() => {
    if (!product) return [];

    if (Array.isArray(product.images) && product.images.length) {
      return product.images.filter(Boolean);
    }

    return product.image ? [product.image] : [];
  }, [product]);

  // =====================================================
  // COLORS
  // =====================================================
  const colors = useMemo(() => {
    if (!Array.isArray(product?.colors)) return [];

    return product.colors
      .map((color) => {
        if (typeof color === "string") {
          return {
            name: color,
            code: "#d1d5db",
            image: "",
          };
        }

        return {
          name: color?.name || color?.value || "",
          code: color?.code || color?.color || "#d1d5db",
          image: color?.image || "",
        };
      })
      .filter((color) => color.name);
  }, [product]);

  // =====================================================
  // VARIANTS
  // =====================================================
  const variants = useMemo(
    () => (Array.isArray(product?.variants) ? product.variants : []),
    [product]
  );

  const ramOptions = useMemo(
    () => [...new Set(variants.map((v) => v?.ram).filter(Boolean))],
    [variants]
  );

  const variantStorageOptions = useMemo(
    () => [...new Set(variants.map((v) => v?.storage).filter(Boolean))],
    [variants]
  );

  const oldStorageOptions = useMemo(() => {
    if (!Array.isArray(product?.sizes)) return [];

    return product.sizes
      .map((size) =>
        typeof size === "string"
          ? size
          : size?.name || size?.value || size?.storage || ""
      )
      .filter(Boolean);
  }, [product]);

  const storageOptions =
    variants.length > 0 ? variantStorageOptions : oldStorageOptions;

  // =====================================================
  // VARIANT MATCHING
  // =====================================================
  const findVariant = (color, ram, storage) => {
    return (
      variants.find((variant) => {
        const variantColor =
          typeof variant?.color === "string"
            ? variant.color
            : variant?.color?.name ||
              variant?.color?.value ||
              "";

        return (
          variantColor === color &&
          (variant?.ram || "") === ram &&
          (variant?.storage || "") === storage
        );
      }) || null
    );
  };

  useEffect(() => {
    if (!variants.length) {
      setSelectedVariant(null);
      return;
    }

    setSelectedVariant(
      findVariant(selectedColor, selectedRam, selectedStorage)
    );
  }, [variants, selectedColor, selectedRam, selectedStorage]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  // =====================================================
  // STOCK AND PRICE
  // =====================================================
  const currentStock = selectedVariant
    ? Number(selectedVariant.stock ?? 0)
    : Number(product?.stock ?? 0);

  const displayPrice =
    selectedVariant?.price !== undefined &&
    selectedVariant?.price !== null
      ? Number(selectedVariant.price)
      : Number(product?.discountPrice ?? product?.price ?? 0);

  const originalPrice =
    !selectedVariant &&
    product?.discountPrice != null &&
    product?.price != null &&
    Number(product.price) > Number(product.discountPrice)
      ? Number(product.price)
      : null;

  const hasVariants = variants.length > 0;
  const variantFound = !hasVariants || Boolean(selectedVariant);
  const isOutOfStock = currentStock <= 0;

  // =====================================================
  // VARIANT AVAILABILITY
  // =====================================================
  const isRamAvailable = (ram) =>
    !variants.length ||
    variants.some((variant) => {
      const color =
        typeof variant?.color === "string"
          ? variant.color
          : variant?.color?.name ||
            variant?.color?.value ||
            "";

      return (
        (!selectedColor || color === selectedColor) &&
        (!selectedStorage || variant?.storage === selectedStorage) &&
        variant?.ram === ram
      );
    });

  const isStorageAvailable = (storage) =>
    !variants.length ||
    variants.some((variant) => {
      const color =
        typeof variant?.color === "string"
          ? variant.color
          : variant?.color?.name ||
            variant?.color?.value ||
            "";

      return (
        (!selectedColor || color === selectedColor) &&
        (!selectedRam || variant?.ram === selectedRam) &&
        variant?.storage === storage
      );
    });

  const isColorAvailable = (colorName) =>
    !variants.length ||
    variants.some((variant) => {
      const color =
        typeof variant?.color === "string"
          ? variant.color
          : variant?.color?.name ||
            variant?.color?.value ||
            "";

      return (
        color === colorName &&
        (!selectedRam || variant?.ram === selectedRam) &&
        (!selectedStorage || variant?.storage === selectedStorage)
      );
    });

  // =====================================================
  // SELECT OPTIONS
  // =====================================================
  const handleColorSelect = (color) => {
    setSelectedColor(color.name);

    if (color.image) {
      setSelectedColorImage(color.image);

      const index = images.indexOf(color.image);

      if (index >= 0) setSelectedImage(index);
    } else {
      setSelectedColorImage("");
    }
  };

  const increaseQuantity = () => {
    if (currentStock > quantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  // =====================================================
  // CREATE CART PRODUCT
  // =====================================================
  const createCartProduct = () => ({
    ...product,
    quantity,
    selectedColor,
    selectedRam,
    selectedStorage,
    selectedVariant: selectedVariant || null,
    price: displayPrice,
    discountPrice: displayPrice,
    sku: selectedVariant?.sku || product?.sku || "",
  });

  // =====================================================
  // ADD TO CART
  // =====================================================
  const handleAddToCart = () => {
    if (!requireLogin()) return;

    if (typeof addTocart !== "function") {
      alert("Cart function পাওয়া যাচ্ছে না। Store/store.js ফাইলটি পরীক্ষা করুন।");
      return;
    }

    if (!product) {
      alert("Product পাওয়া যাচ্ছে না।");
      return;
    }

    if (hasVariants && !selectedVariant) {
      alert("Please select a valid Color, RAM and Storage combination.");
      return;
    }

    if (currentStock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    if (quantity < 1 || quantity > currentStock) {
      alert("Selected quantity exceeds available stock.");
      return;
    }

    const cartProduct = createCartProduct();
    addTocart(cartProduct);
    alert("Product successfully added to cart!");
  };

  // =====================================================
  // BUY NOW
  // =====================================================
  const handlePreOrder = () => {
    if (!requireLogin()) return;

    if (typeof addTocart !== "function") {
      alert("Cart function পাওয়া যাচ্ছে না।");
      return;
    }

    if (!product) {
      alert("Product পাওয়া যাচ্ছে না।");
      return;
    }

    if (hasVariants && !selectedVariant) {
      alert("Please select a valid Color, RAM and Storage combination.");
      return;
    }

    if (currentStock <= 0) {
      alert("This variant is out of stock.");
      return;
    }

    if (quantity < 1 || quantity > currentStock) {
      alert("Selected quantity exceeds available stock.");
      return;
    }

    addTocart(createCartProduct());
    router.push("/CheakOut");
  };

  // =====================================================
  // WHATSAPP
  // =====================================================
  const whatsappMessage = encodeURIComponent(
    `Hello, I want to know about ${product?.name || "this product"}`
  );

  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  // =====================================================
  // RECENTLY VIEWED
  // =====================================================
  useEffect(() => {
    if (!product?._id || typeof window === "undefined") return;

    try {
      const now = Date.now();
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

      const saved = JSON.parse(
        localStorage.getItem("recentlyViewed") || "[]"
      );

      const savedProducts = Array.isArray(saved) ? saved : [];

      const validProducts = savedProducts
        .map((item) =>
          item?.viewedAt ? item : { ...item, viewedAt: now }
        )
        .filter((item) => {
          const viewedAt = Number(item?.viewedAt || 0);
          return viewedAt > 0 && now - viewedAt < THIRTY_DAYS;
        });

      const newProduct = {
        _id: product._id,
        name: product.name,
        slug: product.slug || product._id,
        brand: product.brand || "",
        price: Number(product.price || 0),
        discountPrice:
          product.discountPrice != null
            ? Number(product.discountPrice)
            : null,
        images:
          Array.isArray(product.images) && product.images.length
            ? product.images
            : product.image
              ? [product.image]
              : [],
        viewedAt: now,
      };

      const filtered = validProducts.filter(
        (item) => item?._id !== product._id
      );

      const updated = [newProduct, ...filtered].slice(0, 10);

      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
      window.dispatchEvent(new Event("recentlyViewedUpdated"));
    } catch (error) {
      console.error("Recently viewed save error:", error);
    }
  }, [product]);

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div
        className={`${inter.className} min-h-screen bg-[#f8f9fb] flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm tracking-wide">
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================
  if (!product) {
    return (
      <div
        className={`${inter.className} min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center px-4`}
      >
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Product Not Found
        </h1>
        <p className="text-gray-500 mt-2 text-center text-[15px]">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="mt-8 px-8 py-3 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all shadow-sm"
        >
          Go Home
        </Link>
      </div>
    );
  }

  // =====================================================
  // MAIN IMAGE
  // =====================================================
  const mainImage =
    selectedColorImage || images[selectedImage] || images[0] || "";

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <main
      className={`${inter.className} bg-[#f8f9fb] text-gray-900 min-h-screen`}
    >
      {/* Breadcrumb */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5">
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-500">
          <Link href="/" className="hover:text-orange-600 transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span>Mobile Phone</span>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-800 font-medium truncate max-w-[200px]">
            {product.brand || product.name?.split(" ")[0] || "Product"}
          </span>
        </nav>
      </div>

      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[480px_1fr] xl:grid-cols-[520px_1fr] gap-8 lg:gap-12">
          
          {/* ===================== IMAGE GALLERY ===================== */}
          <div className="space-y-4">
            <div className="relative aspect-square w-full rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden group">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={
                    selectedColor
                      ? `${product.name} - ${selectedColor}`
                      : product.name
                  }
                  className="w-full h-full object-contain p-6 md:p-10 transition-transform duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="text-gray-400 text-sm">No Image Available</div>
              )}

              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                  <span className="inline-flex items-center px-5 py-2 rounded-full bg-rose-50 text-rose-600 text-sm font-medium border border-rose-200 shadow-sm">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedImage(index);
                      setSelectedColorImage("");
                    }}
                    className={`relative flex-shrink-0 w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-2xl border-2 overflow-hidden bg-white transition-all duration-200 ${
                      !selectedColorImage && selectedImage === index
                        ? "border-orange-500 shadow-md shadow-orange-500/15"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain p-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ===================== PRODUCT INFO ===================== */}
          <div className="flex flex-col">
            {/* Brand + Compare */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-blue-600 tracking-wide uppercase">
                {product.brand || "Brand"}
              </span>

              <button
                type="button"
                onClick={() => alert("Compare feature is not connected yet.")}
                className="flex items-center gap-1.5 text-orange-500 font-medium text-[13px] hover:text-orange-600 transition-colors"
              >
                <ArrowLeftRight size={15} />
                Compare
              </button>
            </div>

            {/* Product Name */}
            <h1 className="text-[26px] sm:text-[30px] lg:text-[32px] font-semibold text-gray-900 leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Price + Stock + SKU */}
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[14.5px]">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  {displayPrice > 0
                    ? `৳${displayPrice.toLocaleString()}`
                    : "TBA"}
                </span>
                {originalPrice && (
                  <span className="text-gray-400 line-through text-base">
                    ৳{originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <span className="hidden sm:inline text-gray-300">|</span>

              <div className="flex items-center gap-1.5">
                {!variantFound ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[13px] font-medium">
                    Variant Not Available
                  </span>
                ) : isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-[13px] font-medium">
                    Out of Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[13px] font-medium">
                    <Check size={13} />
                    In Stock ({currentStock})
                  </span>
                )}
              </div>

              <span className="hidden sm:inline text-gray-300">|</span>

              <span className="text-gray-600 text-[13.5px]">
                Code:{" "}
                <span className="font-medium text-blue-600">
                  {selectedVariant?.sku || product.sku || "N/A"}
                </span>
              </span>
            </div>

            {/* Color Selection */}
            {colors.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[13px] font-medium text-gray-600 mb-3">
                  Color{" "}
                  {selectedColor && (
                    <span className="text-gray-900 font-semibold">
                      — {selectedColor}
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((color, index) => {
                    const available = isColorAvailable(color.name);
                    const isSelected = selectedColor === color.name;

                    return (
                      <button
                        key={`${color.name}-${index}`}
                        type="button"
                        disabled={!available}
                        onClick={() => handleColorSelect(color)}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-[13.5px] font-medium transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        } ${
                          !available
                            ? "opacity-40 cursor-not-allowed line-through"
                            : ""
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 shadow-inner"
                          style={{ backgroundColor: color.code }}
                        />
                        {color.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Storage Selection */}
            {storageOptions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[13px] font-medium text-gray-600 mb-3">
                  Storage
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {storageOptions.map((storage, index) => {
                    const available = isStorageAvailable(storage);
                    const isSelected = selectedStorage === storage;

                    return (
                      <button
                        key={`${storage}-${index}`}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedStorage(storage)}
                        className={`px-4 py-2 rounded-full border text-[13.5px] font-medium transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        } ${
                          !available
                            ? "opacity-40 cursor-not-allowed line-through"
                            : ""
                        }`}
                      >
                        {storage}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RAM Selection */}
            {ramOptions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[13px] font-medium text-gray-600 mb-3">
                  RAM
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {ramOptions.map((ram, index) => {
                    const available = isRamAvailable(ram);
                    const isSelected = selectedRam === ram;

                    return (
                      <button
                        key={`${ram}-${index}`}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedRam(ram)}
                        className={`px-4 py-2 rounded-full border text-[13.5px] font-medium transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                        } ${
                          !available
                            ? "opacity-40 cursor-not-allowed line-through"
                            : ""
                        }`}
                      >
                        {ram}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasVariants && !selectedVariant && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13.5px] text-rose-600">
                This Color, RAM and Storage combination is not available.
              </div>
            )}

            {/* Quantity */}
            <div className="mt-8">
              <h3 className="text-[13px] font-medium text-gray-600 mb-3">
                Quantity
              </h3>
              <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 border border-gray-200/70">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={currentStock <= 0 || quantity <= 1}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-[44px] text-center font-semibold text-gray-900 text-[16px]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={currentStock <= 0 || quantity >= currentStock}
                  className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* EMI + WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
              <button
                type="button"
                className="h-[48px] rounded-2xl bg-[#fff8f0] border border-orange-100 flex items-center justify-center gap-2.5 text-gray-800 hover:bg-orange-50 transition-all text-[13.5px]"
              >
                <Percent size={16} className="text-orange-500" />
                <span>EMI Available (above ৳5,000)</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-[48px] rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2.5 text-gray-800 hover:bg-emerald-100/70 transition-all text-[13.5px] font-medium"
              >
                <MessageCircle size={17} className="text-emerald-600" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Delivery Info */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-[13.5px] text-gray-700 shadow-sm">
              <Truck size={18} className="text-gray-500 flex-shrink-0" />
              <span>
                Delivery Time:{" "}
                <span className="font-semibold text-gray-900">3–5 Days</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={
                  currentStock <= 0 || (hasVariants && !selectedVariant)
                }
                className={`h-[52px] rounded-2xl font-semibold text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 ${
                  currentStock <= 0 || (hasVariants && !selectedVariant)
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 active:scale-[0.98]"
                }`}
              >
                <ShoppingBag size={18} />
                {currentStock <= 0
                  ? "Out of Stock"
                  : hasVariants && !selectedVariant
                    ? "Select Variant"
                    : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={() => handleAddToCart2(createCartProduct())}
                disabled={
                  currentStock <= 0 || (hasVariants && !selectedVariant)
                }
                className={`h-[52px] rounded-2xl font-semibold text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 ${
                  currentStock <= 0 || (hasVariants && !selectedVariant)
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 active:scale-[0.98]"
                }`}
              >
                <ShoppingBag size={18} />
                {currentStock <= 0
                  ? "Out of Stock"
                  : hasVariants && !selectedVariant
                    ? "Select Variant"
                    : product?.isPreOrder
                      ? "Pre-order Now"
                      : "Buy Now"}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap items-center gap-4 text-[12.5px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                <span>100% Authentic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck size={15} className="text-blue-600" />
                <span>Fast Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== SPECIFICATION + RECENTLY VIEWED ===================== */}
        <section className="mt-16 sm:mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10 items-start">
            {/* Specification */}
            <div>
              <div className="mb-5">
                <h2 className="text-[22px] sm:text-[24px] font-semibold text-gray-900 tracking-tight">
                  Specification
                </h2>
                <p className="mt-1 text-[14px] text-gray-500">
                  Detailed product information
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <SpecificationRow
                  label="Brand"
                  value={product.brand || "Apple"}
                />
                <SpecificationRow label="Model" value={product.name} />

                {Array.isArray(product.specifications) &&
                  product.specifications.map((spec, index) => {
                    const key = String(spec?.key || "").trim();
                    const value = String(spec?.value || "").trim();

                    if (!key || !value) return null;
                    if (["brand", "model"].includes(key.toLowerCase())) {
                      return null;
                    }

                    return (
                      <SpecificationRow
                        key={spec?._id || `${key}-${index}`}
                        label={key}
                        value={value}
                      />
                    );
                  })}
              </div>
            </div>

            {/* Recently Viewed */}
            <aside className="lg:sticky lg:top-24">
              <div className="mb-5">
                <h2 className="text-[22px] sm:text-[24px] font-semibold text-gray-900 tracking-tight">
                  Recently Viewed
                </h2>
                <p className="mt-1 text-[14px] text-gray-500">
                  Products you viewed recently
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <RecentlyViewed />
              </div>
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}

// =====================================================
// SPECIFICATION ROW
// =====================================================
function SpecificationRow({ label, value }) {
  return (
    <div className="grid grid-cols-[130px_1fr] sm:grid-cols-[160px_1fr] border-b border-gray-100 last:border-b-0">
      <div className="px-5 py-3.5 bg-gray-50/80 text-[13.5px] text-gray-600 font-medium">
        {label}
      </div>
      <div className="px-5 py-3.5 text-[13.5px] font-medium text-gray-900 border-l border-gray-100 break-words">
        {value}
      </div>
    </div>
  );
}