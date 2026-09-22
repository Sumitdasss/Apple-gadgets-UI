"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Minus,
  Plus,
  ArrowLeftRight,
  MessageCircle,
  Percent,
  ShoppingBag,
} from "lucide-react";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = params?.slug;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
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
            (item) => item.slug === slug || item._id === slug
          );
        } else if (Array.isArray(data.products)) {
          foundProduct = data.products.find(
            (item) => item.slug === slug || item._id === slug
          );
        } else if (data.product) {
          foundProduct = data.product;
        } else {
          foundProduct = data;
        }

        setProduct(foundProduct || null);

        if (foundProduct) {
          if (Array.isArray(foundProduct.colors) && foundProduct.colors.length) {
            const firstColor = foundProduct.colors[0];
            setSelectedColor(
              typeof firstColor === "object" ? firstColor.name : firstColor
            );
          }

          if (Array.isArray(foundProduct.sizes) && foundProduct.sizes.length) {
            const firstSize = foundProduct.sizes[0];
            setSelectedStorage(
              typeof firstSize === "object"
                ? firstSize.name || firstSize.value
                : firstSize
            );
          }
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
    if (Array.isArray(product.images) && product.images.length) {
      return product.images;
    }
    if (product.image) return [product.image];
    return [];
  }, [product]);

  // =====================================================
  // COLORS
  // =====================================================
  const colors = useMemo(() => {
    if (!product?.colors) return [];

    return product.colors.map((color) => {
      if (typeof color === "string") {
        return { name: color, code: "#d1d5db", image: null };
      }
      return {
        name: color.name || color.value || "",
        code: color.code || color.color || "#d1d5db",
        image: color.image || null,
      };
    });
  }, [product]);

  // =====================================================
  // STORAGE
  // =====================================================
  const storageOptions = useMemo(() => {
    if (!product?.sizes) return [];
    return product.sizes.map((size) => {
      if (typeof size === "string") return size;
      return size.name || size.value || size.storage || "";
    });
  }, [product]);

  // =====================================================
  // PRICE
  // =====================================================
  const displayPrice = product?.discountPrice || product?.price || 0;
  const originalPrice =
    product?.discountPrice && product?.price ? product.price : null;

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================
  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold text-gray-800">Product Not Found</h1>
        <p className="text-gray-500 mt-2 text-center">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="mt-6 px-6 py-2.5 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
        >
          Go Home
        </Link>
      </div>
    );
  }

  // =====================================================
  // QUANTITY
  // =====================================================
  const increaseQuantity = () => {
    const stock = Number(product.stock || 999);
    if (quantity < stock) setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  // =====================================================
  // PRE ORDER
  // =====================================================
  const handlePreOrder = () => {
    console.log({
      product: product.name,
      productId: product._id,
      color: selectedColor,
      storage: selectedStorage,
      quantity,
    });
    // Redirect to checkout / pre-order page later
  };

  // =====================================================
  // WHATSAPP
  // =====================================================
  const whatsappMessage = encodeURIComponent(
    `Hello, I want to know about ${product.name}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <main className="bg-white text-gray-900 min-h-screen">
      {/* =================================================
          BREADCRUMB
      ================================================= */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6">
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href="/" className="hover:text-orange-500 transition">
            Home
          </Link>
          <ChevronRight size={14} className="text-gray-400" />
          <span>Mobile Phone</span>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-gray-800 font-medium truncate max-w-[200px]">
            {product.category?.name || product.name || "iPhone"}
          </span>
        </nav>
      </div>

      {/* =================================================
          MAIN PRODUCT AREA
      ================================================= */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] xl:grid-cols-[540px_1fr] gap-8 lg:gap-12">
          {/* =================================================
              LEFT - IMAGE GALLERY
          ================================================= */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square w-full rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain p-6 md:p-8 transition-opacity duration-300"
                />
              ) : (
                <div className="text-gray-400 text-sm">No Image Available</div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`
                      relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 overflow-hidden bg-white
                      transition-all duration-200
                      ${
                        selectedImage === index
                          ? "border-orange-500 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain p-1.5"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* =================================================
              RIGHT - PRODUCT INFORMATION
          ================================================= */}
          <div className="flex flex-col">
            {/* Brand */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl leading-none"></span>
              <span className="font-semibold text-gray-800 tracking-wide">
                {product.brand || "Apple"}
              </span>
            </div>

            {/* Title + Compare */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold leading-tight text-gray-900">
                {product.name}
              </h1>

              <button className="flex items-center gap-2 text-orange-500 font-medium text-sm hover:text-orange-600 transition whitespace-nowrap self-start">
                <ArrowLeftRight size={18} />
                Add to Compare
              </button>
            </div>

            {/* Price + Meta */}
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-2xl sm:text-[28px] font-bold text-gray-900">
                ৳{Number(displayPrice).toLocaleString()}
              </span>

              {originalPrice && (
                <span className="text-gray-400 line-through text-lg">
                  ৳{Number(originalPrice).toLocaleString()}
                </span>
              )}

              <span className="text-sm text-gray-500">(Booking Price)</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Availability:</span>
                <span
                  className={`font-medium ${
                    product.stock > 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>

              <div className="hidden sm:block w-px h-4 bg-gray-200" />

              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Code:</span>
                <span className="font-medium text-gray-800">
                  {product.sku || "N/A"}
                </span>
              </div>
            </div>

            {/* =================================================
                OPTIONS
            ================================================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-7">
              {/* COLOR */}
              {colors.length > 0 && (
                <div className="rounded-2xl border border-gray-200 p-4 bg-white">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Color
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedColor(color.name);
                          if (color.image) {
                            const imageIndex = images.indexOf(color.image);
                            if (imageIndex !== -1) setSelectedImage(imageIndex);
                          }
                        }}
                        className={`
                          flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm transition-all
                          ${
                            selectedColor === color.name
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }
                        `}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-gray-300 shadow-sm"
                          style={{ backgroundColor: color.code }}
                        />
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STORAGE */}
              {storageOptions.length > 0 && (
                <div className="rounded-2xl border border-gray-200 p-4 bg-white">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">
                    Storage
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {storageOptions.map((storage, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedStorage(storage)}
                        className={`
                          px-4 py-2 rounded-full border text-sm font-medium transition-all
                          ${
                            selectedStorage === storage
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }
                        `}
                      >
                        {storage}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pre-Order Notice */}
            <div className="mt-6 flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
              <p className="text-gray-700">
                <span className="font-semibold">Pre-Order Now</span> — Minimum
                Pre-Booking Amount{" "}
                <span className="font-semibold text-orange-600">৳10,000</span>
              </p>
            </div>

            {/* Quantity */}
            <div className="mt-7">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Select Quantity
              </h3>
              <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
                <button
                  onClick={decreaseQuantity}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition shadow-sm"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-[36px] text-center font-semibold text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={increaseQuantity}
                  className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-50 transition shadow-sm"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Order Button */}
            <button
              onClick={handlePreOrder}
              className="mt-6 w-full h-12 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ShoppingBag size={18} />
              Order Now
            </button>

            {/* EMI + WhatsApp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <button className="h-12 rounded-xl bg-[#fff8f0] border border-orange-100 flex items-center justify-center gap-2 text-gray-800 hover:bg-orange-50 transition">
                <Percent size={17} className="text-orange-500" />
                <span className="text-sm">
                  EMI Available{" "}
                  <span className="font-semibold underline underline-offset-2">
                    View Plans
                  </span>
                </span>
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center gap-2 text-gray-800 hover:bg-green-100 transition"
              >
                <MessageCircle size={18} className="text-green-600" />
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* =====================================================
            SPECIFICATION
        ===================================================== */}
        <section className="mt-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">
            Specification
          </h2>

          <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
            <SpecificationRow label="Brand" value={product.brand || "Apple"} />
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
                if (skipKeys.includes(spec.key)) return null;

                return (
                  <SpecificationRow
                    key={index}
                    label={spec.key}
                    value={spec.value}
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
      <div className="px-4 sm:px-5 py-3.5 bg-gray-50 text-sm text-gray-600 font-medium">
        {label}
      </div>
      <div className="px-4 sm:px-5 py-3.5 text-sm font-medium text-gray-900 border-l border-gray-100">
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
    (item) => item?.key?.toLowerCase() === key.toLowerCase()
  );

  return found?.value || null;
}