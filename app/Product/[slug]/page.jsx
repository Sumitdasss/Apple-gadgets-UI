/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
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

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = params?.slug;

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
  // GET PRODUCT
  // =====================================================
  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${API_BASE}/getallProduct?slug=${encodeURIComponent(slug)}`
        );

        if (!res.ok) throw new Error("Failed to fetch product");

        const data = await res.json();

        let foundProduct = null;

        if (Array.isArray(data)) {
          foundProduct = data.find(
            (item) => item?.slug === slug || item?._id === slug
          );
        } else if (Array.isArray(data?.products)) {
          foundProduct = data.products.find(
            (item) => item?.slug === slug || item?._id === slug
          );
        } else if (data?.product) {
          foundProduct = data.product;
        } else {
          foundProduct = data;
        }

        setProduct(foundProduct || null);

        // First color
        if (
          foundProduct &&
          Array.isArray(foundProduct.colors) &&
          foundProduct.colors.length > 0
        ) {
          const firstColor = foundProduct.colors[0];

          if (typeof firstColor === "object" && firstColor !== null) {
            setSelectedColor(firstColor.name || firstColor.value || "");
            setSelectedColorImage(firstColor.image || "");
          } else {
            setSelectedColor(firstColor);
            setSelectedColorImage("");
          }
        } else {
          setSelectedColor("");
          setSelectedColorImage("");
        }

        // First variant
        if (
          foundProduct &&
          Array.isArray(foundProduct.variants) &&
          foundProduct.variants.length > 0
        ) {
          const firstVariant = foundProduct.variants[0];
          setSelectedRam(firstVariant?.ram || "");
          setSelectedStorage(firstVariant?.storage || "");
        } else {
          if (
            foundProduct &&
            Array.isArray(foundProduct.sizes) &&
            foundProduct.sizes.length > 0
          ) {
            const firstSize = foundProduct.sizes[0];
            setSelectedStorage(
              typeof firstSize === "object"
                ? firstSize?.name ||
                    firstSize?.value ||
                    firstSize?.storage ||
                    ""
                : firstSize
            );
          } else {
            setSelectedStorage("");
          }
          setSelectedRam("");
        }
      } catch (error) {
        console.error("Product details error:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // =====================================================
  // PRODUCT IMAGES
  // =====================================================
  const images = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    if (product.image) return [product.image];
    return [];
  }, [product]);

  // =====================================================
  // COLORS
  // =====================================================
  const colors = useMemo(() => {
    if (!Array.isArray(product?.colors)) return [];

    return product.colors
      .map((color) => {
        if (typeof color === "string") {
          return { name: color, code: "#d1d5db", image: "" };
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
  const variants = useMemo(() => {
    if (!Array.isArray(product?.variants)) return [];
    return product.variants;
  }, [product]);

  const ramOptions = useMemo(() => {
    return [
      ...new Set(variants.map((v) => v?.ram).filter(Boolean)),
    ];
  }, [variants]);

  const variantStorageOptions = useMemo(() => {
    return [
      ...new Set(variants.map((v) => v?.storage).filter(Boolean)),
    ];
  }, [variants]);

  const oldStorageOptions = useMemo(() => {
    if (!Array.isArray(product?.sizes)) return [];
    return product.sizes
      .map((size) => {
        if (typeof size === "string") return size;
        return size?.name || size?.value || size?.storage || "";
      })
      .filter(Boolean);
  }, [product]);

  const storageOptions =
    variants.length > 0 ? variantStorageOptions : oldStorageOptions;

  // =====================================================
  // FIND EXACT SELECTED VARIANT
  // =====================================================
  const findVariant = (color, ram, storage) => {
    if (!variants.length) return null;

    return (
      variants.find((variant) => {
        const variantColor =
          variant?.color?.name || variant?.color?.value || "";
        const variantRam = variant?.ram || "";
        const variantStorage = variant?.storage || "";

        return (
          variantColor === color &&
          variantRam === ram &&
          variantStorage === storage
        );
      }) || null
    );
  };

  useEffect(() => {
    if (!variants.length) {
      setSelectedVariant(null);
      return;
    }

    const exactVariant = findVariant(
      selectedColor,
      selectedRam,
      selectedStorage
    );
    setSelectedVariant(exactVariant);
  }, [variants, selectedColor, selectedRam, selectedStorage]);

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariant]);

  // =====================================================
  // STOCK & PRICE
  // =====================================================
  const currentStock = selectedVariant
    ? Number(selectedVariant.stock ?? 0)
    : Number(product?.stock ?? 0);

  const displayPrice =
    selectedVariant &&
    selectedVariant.price !== undefined &&
    selectedVariant.price !== null
      ? Number(selectedVariant.price)
      : Number(product?.discountPrice ?? product?.price ?? 0);

  const originalPrice =
    selectedVariant
      ? null
      : product?.discountPrice &&
        product?.price &&
        Number(product.price) > Number(product.discountPrice)
      ? Number(product.price)
      : null;

  const hasVariants = variants.length > 0;
  const variantFound = !hasVariants || Boolean(selectedVariant);
  const isOutOfStock = currentStock <= 0;

  // =====================================================
  // HANDLERS
  // =====================================================
  const handleColorSelect = (color) => {
    setSelectedColor(color.name);
    setSelectedColorImage(color.image || "");

    if (color.image) {
      const imageIndex = images.indexOf(color.image);
      if (imageIndex !== -1) setSelectedImage(imageIndex);
    }
  };

  const handleRamSelect = (ram) => setSelectedRam(ram);
  const handleStorageSelect = (storage) => setSelectedStorage(storage);

  const isRamAvailable = (ram) => {
    if (!variants.length) return true;
    return variants.some((variant) => {
      const colorMatch =
        !selectedColor || variant?.color?.name === selectedColor;
      const storageMatch =
        !selectedStorage || variant?.storage === selectedStorage;
      return colorMatch && variant?.ram === ram && storageMatch;
    });
  };

  const isStorageAvailable = (storage) => {
    if (!variants.length) return true;
    return variants.some((variant) => {
      const colorMatch =
        !selectedColor || variant?.color?.name === selectedColor;
      const ramMatch = !selectedRam || variant?.ram === selectedRam;
      return colorMatch && ramMatch && variant?.storage === storage;
    });
  };

  const isColorAvailable = (colorName) => {
    if (!variants.length) return true;
    return variants.some((variant) => {
      const ramMatch = !selectedRam || variant?.ram === selectedRam;
      const storageMatch =
        !selectedStorage || variant?.storage === selectedStorage;
      return (
        variant?.color?.name === colorName && ramMatch && storageMatch
      );
    });
  };

  const increaseQuantity = () => {
    if (currentStock > 0 && quantity < currentStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handlePreOrder = () => {
    if (hasVariants && !selectedVariant) {
      alert("Please select a valid Color, RAM and Storage combination.");
      return;
    }
    if (currentStock <= 0) {
      alert("This variant is out of stock.");
      return;
    }

    console.log({
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
  };

  const whatsappMessage = encodeURIComponent(
    `Hello, I want to know about ${product?.name || "this product"}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className={`${inter.className} min-h-screen bg-white flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-11 h-11 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm tracking-wide">Loading product...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================
  if (!product) {
    return (
      <div className={`${inter.className} min-h-screen bg-white flex flex-col items-center justify-center px-4`}>
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

  const mainImage =
    selectedColorImage || images[selectedImage] || images[0] || "";

  // =====================================================
  // MAIN UI
  // =====================================================
  return (
    <main className={`${inter.className} bg-[#fafafa] text-gray-900 min-h-screen`}>
      {/* BREADCRUMB */}
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

      {/* MAIN PRODUCT AREA */}
      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-7 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] xl:grid-cols-[500px_1fr] gap-10 lg:gap-14">
          
          {/* LEFT - IMAGE GALLERY */}
          <div className="space-y-5">
            {/* MAIN IMAGE */}
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
                <div className="text-gray-400 text-sm">No Image Available</div>
              )}

              {/* Premium Out of Stock Badge */}
              {isOutOfStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[2px]">
                  <span className="inline-flex items-center px-5 py-2 rounded-full bg-rose-50 text-rose-600 text-sm font-medium border border-rose-200/80 shadow-sm tracking-wide">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* THUMBNAILS */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index);
                      setSelectedColorImage("");
                    }}
                    className={`
                      relative flex-shrink-0
                      w-[76px] h-[76px] sm:w-20 sm:h-20
                      rounded-2xl border-2 overflow-hidden bg-white
                      transition-all duration-300
                      ${
                        !selectedColorImage && selectedImage === index
                          ? "border-orange-500 shadow-md shadow-orange-500/10"
                          : "border-gray-200/80 hover:border-gray-300"
                      }
                    `}
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

          {/* RIGHT - PRODUCT INFORMATION */}
          <div className="flex flex-col pt-1">
            
            {/* BRAND + COMPARE */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px] font-semibold text-blue-600 tracking-wide lowercase">
                {product.brand?.toLowerCase() || "brand"}
              </span>

              <button className="flex items-center gap-1.5 text-orange-500 font-medium text-[13px] hover:text-orange-600 transition-colors">
                <ArrowLeftRight size={15} />
                Add to Compare
              </button>
            </div>

            {/* TITLE */}
            <h1 className="text-[26px] sm:text-[32px] font-semibold text-gray-900 leading-[1.25] tracking-tight">
              {product.name}
            </h1>

            {/* PRICE + AVAILABILITY + CODE */}
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px]">
              <span className="font-semibold text-gray-900">
                {displayPrice > 0
                  ? `৳${Number(displayPrice).toLocaleString()}`
                  : "TBA"}{" "}
                <span className="font-normal text-gray-500">
                  (Cash Price)
                </span>
              </span>

              <span className="text-gray-300">|</span>

              <span className="text-gray-600">
                Availability:{" "}
                {!variantFound ? (
                  <span className="font-medium text-rose-500">
                    Variant Not Available
                  </span>
                ) : isOutOfStock ? (
                  <span className="font-medium text-rose-500">Out Of Stock</span>
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

            {/* COLOR + STORAGE */}
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* COLOR */}
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
                          disabled={!available}
                          onClick={() => handleColorSelect(color)}
                          className={`
                            flex items-center gap-2
                            px-3.5 py-1.5
                            rounded-full border text-[13px] font-medium transition-all duration-200
                            ${
                              selectedColor === color.name
                                ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                                : "border-gray-200 text-gray-700 hover:border-gray-300"
                            }
                            ${
                              !available
                                ? "opacity-40 cursor-not-allowed line-through"
                                : ""
                            }
                          `}
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

              {/* STORAGE */}
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
                          disabled={!available}
                          onClick={() => handleStorageSelect(storage)}
                          className={`
                            px-3.5 py-1.5
                            rounded-full border text-[13px] font-medium transition-all duration-200
                            ${
                              selectedStorage === storage
                                ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                                : "border-gray-200 text-gray-700 hover:border-gray-300"
                            }
                            ${
                              !available
                                ? "opacity-40 cursor-not-allowed line-through"
                                : ""
                            }
                          `}
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
                        disabled={!available}
                        onClick={() => handleRamSelect(ram)}
                        className={`
                          px-3.5 py-1.5
                          rounded-full border text-[13px] font-medium transition-all duration-200
                          ${
                            selectedRam === ram
                              ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                              : "border-gray-200 text-gray-700 hover:border-gray-300"
                          }
                          ${
                            !available
                              ? "opacity-40 cursor-not-allowed line-through"
                              : ""
                          }
                        `}
                      >
                        {ram}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VARIANT ERROR */}
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
                  onClick={increaseQuantity}
                  disabled={currentStock <= 0 || quantity >= currentStock}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* EMI + WHATSAPP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
              <button className="h-[48px] rounded-2xl bg-[#fff8f0] border border-orange-100/80 flex items-center justify-center gap-2.5 text-gray-800 hover:bg-orange-50/80 transition-all text-[13.5px]">
                <Percent size={16} className="text-orange-500" />
                <span>
                  EMI Available for orders above ৳ 5000
                </span>
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

            {/* ORDER BUTTON */}
            <button
              onClick={handlePreOrder}
              disabled={
                currentStock <= 0 || (hasVariants && !selectedVariant)
              }
              className={`
                mt-7 w-full h-[50px] rounded-2xl
                font-semibold text-[15px]
                transition-all duration-200 flex items-center justify-center gap-2.5
                ${
                  currentStock <= 0 || (hasVariants && !selectedVariant)
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 active:scale-[0.985] text-white shadow-lg shadow-orange-500/25"
                }
              `}
            >
              <ShoppingBag size={18} />
              {currentStock <= 0
                ? "Out of Stock"
                : !selectedVariant && hasVariants
                ? "Select Variant"
                : "Order Now"}
            </button>
          </div>
        </div>

        {/* SPECIFICATION */}
        <section className="mt-20">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6 tracking-tight">
            Specification
          </h2>

          <div className="rounded-2xl border border-gray-200/80 overflow-hidden bg-white shadow-sm">
            <SpecificationRow
              label="Brand"
              value={product.brand || "Apple"}
            />
            <SpecificationRow label="Model" value={product.name} />

            {getSpecification(product, "Platform") && (
              <SpecificationRow
                label="Platform"
                value={getSpecification(product, "Platform")}
              />
            )}
            {getSpecification(product, "Network") && (
              <SpecificationRow
                label="Network"
                value={getSpecification(product, "Network")}
              />
            )}
            {getSpecification(product, "Dimensions") && (
              <SpecificationRow
                label="Dimensions"
                value={getSpecification(product, "Dimensions")}
              />
            )}
            {getSpecification(product, "Weight") && (
              <SpecificationRow
                label="Weight"
                value={getSpecification(product, "Weight")}
              />
            )}
            {getSpecification(product, "SIM") && (
              <SpecificationRow
                label="SIM"
                value={getSpecification(product, "SIM")}
              />
            )}
            {getSpecification(product, "Display Type") && (
              <SpecificationRow
                label="Display Type"
                value={getSpecification(product, "Display Type")}
              />
            )}
            {getSpecification(product, "Display Size") && (
              <SpecificationRow
                label="Display Size"
                value={getSpecification(product, "Display Size")}
              />
            )}
            {getSpecification(product, "Display Resolution") && (
              <SpecificationRow
                label="Display Resolution"
                value={getSpecification(product, "Display Resolution")}
              />
            )}
            {getSpecification(product, "Memory") && (
              <SpecificationRow
                label="Memory"
                value={getSpecification(product, "Memory")}
              />
            )}
            {getSpecification(product, "Main Camera") && (
              <SpecificationRow
                label="Main Camera"
                value={getSpecification(product, "Main Camera")}
              />
            )}
            {getSpecification(product, "Selfie Camera") && (
              <SpecificationRow
                label="Selfie Camera"
                value={getSpecification(product, "Selfie Camera")}
              />
            )}

            {Array.isArray(product.specifications) &&
              product.specifications.map((spec, index) => {
                const skipKeys = [
                  "Platform",
                  "Network",
                  "Dimensions",
                  "Weight",
                  "SIM",
                  "Display Type",
                  "Display Size",
                  "Display Resolution",
                  "Memory",
                  "Main Camera",
                  "Selfie Camera",
                ];

                if (
                  skipKeys.some(
                    (key) =>
                      key.toLowerCase() ===
                      String(spec?.key || "").toLowerCase()
                  )
                ) {
                  return null;
                }

                return (
                  <SpecificationRow
                    key={index}
                    label={spec?.key || ""}
                    value={spec?.value || ""}
                  />
                );
              })}
          </div>
        </section>
      </section>
    </main>
  );
}

// =========================================================
// SPECIFICATION ROW
// =========================================================
function SpecificationRow({ label, value }) {
  return (
    <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] border-b border-gray-100 last:border-b-0">
      <div className="px-5 py-3.5 bg-gray-50/80 text-[13.5px] text-gray-600 font-medium">
        {label}
      </div>
      <div className="px-5 py-3.5 text-[13.5px] font-medium text-gray-900 border-l border-gray-100">
        {value}
      </div>
    </div>
  );
}

// =========================================================
// GET SPECIFICATION
// =========================================================
function getSpecification(product, key) {
  if (!Array.isArray(product?.specifications)) return null;

  const found = product.specifications.find(
    (item) =>
      String(item?.key || "").toLowerCase() === key.toLowerCase()
  );

  return found?.value || null;
}