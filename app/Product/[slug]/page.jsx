/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  const slug = params?.slug;

  // IMPORTANT: Store action name is addTocart
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
  // FETCH PRODUCT
  // =====================================================
  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function fetchProduct() {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_BASE}/products/getALLproducts?slug=${encodeURIComponent(
            Array.isArray(slug) ? slug[0] : slug
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }

        const data = await response.json();
        const currentSlug = Array.isArray(slug) ? slug[0] : slug;

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
        } else if (data?.product) {
          foundProduct = data.product;
        } else if (data?._id || data?.slug) {
          foundProduct = data;
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
            : variant?.color?.name || variant?.color?.value || "";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          : variant?.color?.name || variant?.color?.value || "";

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
          : variant?.color?.name || variant?.color?.value || "";

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
          : variant?.color?.name || variant?.color?.value || "";

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
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  // =====================================================
  // CART
  // =====================================================
  const handleAddToCart = () => {
    if (typeof addTocart !== "function") {
      console.error(
        "addTocart is missing. Check your Store/store.js action name."
      );
      alert(
        "Cart function পাওয়া যাচ্ছে না। Store/store.js ফাইলটি পরীক্ষা করুন।"
      );
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

    if (quantity > currentStock) {
      alert("Selected quantity exceeds available stock.");
      return;
    }

    const cartProduct = {
      ...product,
      quantity,
      selectedColor,
      selectedRam,
      selectedStorage,
      selectedVariant: selectedVariant || null,
      price: displayPrice,
      discountPrice: displayPrice,
      sku: selectedVariant?.sku || product?.sku || "",
    };

    addTocart(cartProduct);
  };

  // =====================================================
  // BUY / PRE-ORDER
  // =====================================================
  const handlePreOrder = () => {
    if (hasVariants && !selectedVariant) {
      alert("Please select a valid Color, RAM and Storage combination.");
      return;
    }

    if (currentStock <= 0) {
      alert("This variant is out of stock.");
      return;
    }

    console.log("Selected product order:", {
      product: product.name,
      productId: product._id,
      color: selectedColor,
      ram: selectedRam,
      storage: selectedStorage,
      price: displayPrice,
      stock: currentStock,
      quantity,
      sku: selectedVariant?.sku || product.sku || "",
      variant: selectedVariant,
    });

    alert("Product selected. Checkout integration is not connected here yet.");
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
          item?.viewedAt
            ? item
            : { ...item, viewedAt: now }
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
        className={`${inter.className} min-h-screen bg-white flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
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
        className={`${inter.className} min-h-screen bg-white flex flex-col items-center justify-center px-4`}
      >
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Product Not Found
        </h1>

        <p className="text-gray-500 mt-2 text-center text-[15px]">
          The product you are looking for does not exist or has been removed.
        </p>

        <Link
          href="/"
          className="mt-7 px-7 py-2.5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-all shadow-sm"
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
      className={`${inter.className} bg-[#fafafa] text-gray-900 min-h-screen`}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex items-center gap-1.5 text-[13px] text-gray-500">
          <Link href="/" className="hover:text-orange-600 transition-colors">
            Home
          </Link>

          <ChevronRight size={13} className="text-gray-400" />
          <span>Mobile Phone</span>
          <ChevronRight size={13} className="text-gray-400" />

          <span className="text-gray-800 font-medium truncate max-w-[180px]">
            {product.brand || product.name?.split(" ")[0] || "Product"}
          </span>
        </nav>
      </div>

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-7 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] xl:grid-cols-[500px_1fr] gap-10 lg:gap-14">
          {/* IMAGE GALLERY */}
          <div className="space-y-5">
            <div className="relative aspect-square w-full rounded-3xl bg-white border border-gray-100 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={
                    selectedColor
                      ? `${product.name} - ${selectedColor}`
                      : product.name
                  }
                  className="w-full h-full object-contain p-8 md:p-10 transition-all duration-500"
                />
              ) : (
                <div className="text-gray-400 text-sm">
                  No Image Available
                </div>
              )}

              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
                  <span className="inline-flex items-center px-5 py-2 rounded-full bg-rose-50 text-rose-600 text-sm font-medium border border-rose-200/80 shadow-sm">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedImage(index);
                      setSelectedColorImage("");
                    }}
                    className={`relative flex-shrink-0 w-[76px] h-[76px] sm:w-20 sm:h-20 rounded-2xl border-2 overflow-hidden bg-white transition-all duration-300 ${
                      !selectedColorImage && selectedImage === index
                        ? "border-orange-500 shadow-md shadow-orange-500/10"
                        : "border-gray-200/80 hover:border-gray-300"
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

          {/* PRODUCT INFORMATION */}
          <div className="flex flex-col pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-semibold text-blue-600 tracking-wide">
                {product.brand?.toLowerCase() || "brand"}
              </span>

              <button
                type="button"
                onClick={() => alert("Compare feature is not connected yet.")}
                className="flex items-center gap-1.5 text-orange-500 font-medium text-[13px] hover:text-orange-600 transition-colors"
              >
                <ArrowLeftRight size={15} />
                Add to Compare
              </button>
            </div>

            <h1 className="text-[26px] sm:text-[32px] font-semibold text-gray-900 leading-[1.25] tracking-tight">
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px]">
              <span className="font-semibold text-gray-900">
                {displayPrice > 0
                  ? `৳${displayPrice.toLocaleString()}`
                  : "TBA"}{" "}
                <span className="font-normal text-gray-500">
                  (Cash Price)
                </span>
              </span>

              {originalPrice && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400 line-through">
                    ৳{originalPrice.toLocaleString()}
                  </span>
                </>
              )}

              <span className="text-gray-300">|</span>

              <span className="text-gray-600">
                Availability:{" "}
                {!variantFound ? (
                  <span className="font-medium text-rose-500">
                    Variant Not Available
                  </span>
                ) : isOutOfStock ? (
                  <span className="font-medium text-rose-500">
                    Out Of Stock
                  </span>
                ) : (
                  <span className="font-medium text-emerald-600">
                    In Stock ({currentStock})
                  </span>
                )}
              </span>

              <span className="text-gray-300">|</span>

              <span className="text-gray-600">
                Code:{" "}
                <span className="font-medium text-blue-600 underline underline-offset-2 decoration-blue-300">
                  {selectedVariant?.sku || product.sku || "N/A"}
                </span>
              </span>
            </div>

            {/* COLOR AND STORAGE */}
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {colors.length > 0 && (
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                  <h3 className="text-[13px] font-medium text-gray-600 mb-3 tracking-wide">
                    Color
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {colors.map((color, index) => {
                      const available = isColorAvailable(color.name);

                      return (
                        <button
                          key={`${color.name}-${index}`}
                          type="button"
                          disabled={!available}
                          onClick={() => handleColorSelect(color)}
                          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[13px] font-medium transition-all ${
                            selectedColor === color.name
                              ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                              : "border-gray-200 text-gray-700 hover:border-gray-300"
                          } ${
                            !available
                              ? "opacity-40 cursor-not-allowed line-through"
                              : ""
                          }`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300/80 shadow-inner"
                            style={{ backgroundColor: color.code }}
                          />
                          {color.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {storageOptions.length > 0 && (
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                  <h3 className="text-[13px] font-medium text-gray-600 mb-3 tracking-wide">
                    Storage
                  </h3>

                  <div className="flex flex-wrap gap-2">
                    {storageOptions.map((storage, index) => {
                      const available = isStorageAvailable(storage);

                      return (
                        <button
                          key={`${storage}-${index}`}
                          type="button"
                          disabled={!available}
                          onClick={() => setSelectedStorage(storage)}
                          className={`px-3.5 py-1.5 rounded-full border text-[13px] font-medium transition-all ${
                            selectedStorage === storage
                              ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                              : "border-gray-200 text-gray-700 hover:border-gray-300"
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
            </div>

            {/* RAM */}
            {ramOptions.length > 0 && (
              <div className="mt-4 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
                <h3 className="text-[13px] font-medium text-gray-600 mb-3 tracking-wide">
                  RAM
                </h3>

                <div className="flex flex-wrap gap-2">
                  {ramOptions.map((ram, index) => {
                    const available = isRamAvailable(ram);

                    return (
                      <button
                        key={`${ram}-${index}`}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedRam(ram)}
                        className={`px-3.5 py-1.5 rounded-full border text-[13px] font-medium transition-all ${
                          selectedRam === ram
                            ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
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
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-[13px] text-rose-600">
                This Color, RAM and Storage combination is not available.
              </div>
            )}

            {/* QUANTITY */}
            <div className="mt-7">
              <h3 className="text-[13px] font-medium text-gray-600 mb-3 tracking-wide">
                Select Quantity
              </h3>

              <div className="inline-flex items-center gap-1 bg-gray-100/80 rounded-full p-1 border border-gray-200/60">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={currentStock <= 0 || quantity <= 1}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus size={15} />
                </button>

                <span className="min-w-[40px] text-center font-semibold text-gray-900 text-[15px]">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={currentStock <= 0 || quantity >= currentStock}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* EMI AND WHATSAPP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
              <button
                type="button"
                className="h-[48px] rounded-2xl bg-[#fff8f0] border border-orange-100/80 flex items-center justify-center gap-2.5 text-gray-800 hover:bg-orange-50/80 transition-all text-[13.5px]"
              >
                <Percent size={16} className="text-orange-500" />
                <span>EMI Available for orders above ৳ 5000</span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-[48px] rounded-2xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center gap-2.5 text-gray-800 hover:bg-emerald-100/60 transition-all text-[13.5px] font-medium"
              >
                <MessageCircle size={17} className="text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* DELIVERY */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-white px-4 py-3.5 text-[13.5px] text-gray-700 shadow-sm">
              <Truck size={17} className="text-gray-500 flex-shrink-0" />
              <span>
                Delivery Timescale:{" "}
                <span className="font-medium text-gray-900">3-5 Days</span>
              </span>
            </div>

            {/* CART AND BUY BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={currentStock <= 0 || (hasVariants && !selectedVariant)}
                className={`mt-7 w-full h-[50px] rounded-2xl font-semibold text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 ${
                  currentStock <= 0 || (hasVariants && !selectedVariant)
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 active:scale-[0.985] text-white shadow-lg shadow-orange-500/25"
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
                onClick={handlePreOrder}
                disabled={currentStock <= 0 || (hasVariants && !selectedVariant)}
                className={`mt-7 w-full h-[50px] rounded-2xl font-semibold text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 ${
                  currentStock <= 0 || (hasVariants && !selectedVariant)
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 active:scale-[0.985] text-white shadow-lg shadow-orange-500/25"
                }`}
              >
                <ShoppingBag size={18} />
                {currentStock <= 0
                  ? "Out of Stock"
                  : hasVariants && !selectedVariant
                    ? "Select Variant"
                    : "Buy"}
              </button>
            </div>
          </div>
        </div>

        {/* SPECIFICATIONS AND RECENTLY VIEWED */}
        <section className="mt-16 sm:mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-10 items-start">
            <div className="min-w-0">
              <div className="mb-5">
                <h2 className="text-[24px] sm:text-[26px] font-semibold text-gray-900 tracking-tight">
                  Specification
                </h2>
                <p className="mt-1 text-[14px] text-gray-500">
                  Product details and specifications
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-[0_2px_15px_-5px_rgba(0,0,0,0.08)]">
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

                    if (
                      ["brand", "model"].includes(key.toLowerCase())
                    ) {
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

            <aside className="min-w-0 lg:sticky lg:top-24">
              <div className="mb-5">
                <h2 className="text-[24px] sm:text-[26px] font-semibold text-gray-900 tracking-tight">
                  Recently Viewed
                </h2>
                <p className="mt-1 text-[14px] text-gray-500">
                  Products you viewed recently
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-[0_2px_15px_-5px_rgba(0,0,0,0.08)]">
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
    <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] border-b border-gray-100 last:border-b-0">
      <div className="px-5 py-3.5 bg-gray-50/80 text-[13.5px] text-gray-600 font-medium">
        {label}
      </div>
      <div className="px-5 py-3.5 text-[13.5px] font-medium text-gray-900 border-l border-gray-100 break-words">
        {value}
      </div>
    </div>
  );
}