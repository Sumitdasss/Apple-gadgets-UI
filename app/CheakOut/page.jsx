/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { showReviewToast } from "../Componant/SavedToast.jsx";
import {
  ArrowLeft,
  Truck,
  Store,
  Banknote,
  CreditCard,
  Wallet,
  Info,
  Minus,
  Plus,
  X,
  ShoppingBag,
  ChevronRight,
  Check,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";

import useStore from "../Store/store";

import { BANGLADESH_GEO } from "../../Data/BangladeshLocation";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://apple-gadgets-ui-backend.vercel.app";

/* =========================================================
   USER HELPERS
========================================================= */

const getSavedUser = () => {
  if (typeof window === "undefined") return null;

  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const getUserField = (user, keys) => {
  for (const key of keys) {
    const value = user?.[key];

    if (
      (typeof value === "string" || typeof value === "number") &&
      String(value).trim()
    ) {
      return String(value).trim();
    }
  }

  return "";
};

/* =========================================================
   GET PUBLIC IP (Frontend)
========================================================= */

const getPublicIp = async () => {
  try {
    const res = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return data?.ip || "";
  } catch (err) {
    console.error("IP fetch failed:", err);
    return "";
  }
};

/* =========================================================
   AREA SELECTOR
========================================================= */

function AreaSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");

  const ref = useRef(null);

  useEffect(() => {
    if (!value) return;

    const parts = value.split(" > ");

    if (parts.length === 3) {
      setDivision(parts[0]);
      setDistrict(parts[1]);
    }
  }, [value]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);

  const divisions = Object.keys(BANGLADESH_GEO || {});

  const districts = division
    ? Object.keys(BANGLADESH_GEO?.[division] || {})
    : [];

  const upazilas =
    division && district
      ? BANGLADESH_GEO?.[division]?.[district] || []
      : [];

  const selectUpazila = (upazila) => {
    onChange(`${division} > ${district} > ${upazila}`);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-left text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
      >
        <span
          className={
            value
              ? "break-words text-gray-900 dark:text-white"
              : "text-gray-400 dark:text-gray-500"
          }
        >
          {value || "Select delivery area"}
        </span>

        <ChevronDown
          size={16}
          className="shrink-0 text-gray-400 dark:text-gray-500"
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex max-h-[320px] max-w-[calc(100vw-48px)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="w-32 shrink-0 overflow-y-auto border-r border-gray-200 sm:w-40 dark:border-slate-700">
            {divisions.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => {
                  setDivision(item);
                  setDistrict("");
                }}
                className={`flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left text-xs sm:text-sm ${
                  division === item
                    ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                    : "text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
                }`}
              >
                <span>{item}</span>
                <ChevronRight size={13} />
              </button>
            ))}
          </div>

          {division && (
            <div className="w-32 shrink-0 overflow-y-auto border-r border-gray-200 sm:w-40 dark:border-slate-700">
              {districts.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setDistrict(item)}
                  className={`flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left text-xs sm:text-sm ${
                    district === item
                      ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                      : "text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{item}</span>
                  <ChevronRight size={13} />
                </button>
              ))}
            </div>
          )}

          {district && (
            <div className="w-32 shrink-0 overflow-y-auto sm:w-40">
              {upazilas.map((item) => {
                const selected =
                  value === `${division} > ${district} > ${item}`;

                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => selectUpazila(item)}
                    className={`flex w-full items-center justify-between gap-1 px-3 py-2.5 text-left text-xs sm:text-sm ${
                      selected
                        ? "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                        : "text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{item}</span>
                    {selected && <Check size={13} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MAIN CHECKOUT PAGE
========================================================= */

export default function CheckoutPage() {
  const {
    cart = [],
    increasePopulation,
    decreasePopulation,
    removeFromCart,
    clearCart,
  } = useStore();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    selectArea: "",
    address: "",
    note: "",
    paymentMethod: "cash_on_delivery",
    deliveryMethod: "courier_service",
    couponCode: "",
    termsAgreed: true,
  });

  const [selectedVariants, setSelectedVariants] = useState({});
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const router = useRouter();

  /* =========================================================
     LOAD USER AND AUTOFILL FORM
  ========================================================= */

  useEffect(() => {
    let cancelled = false;

    const fillUserData = (user) => {
      if (!user || typeof user !== "object" || cancelled) return;

      setLoggedInUser(user);

      const name = getUserField(user, [
        "name",
        "fullName",
        "customerName",
        "username",
      ]);

      const email = getUserField(user, ["email"]);

      const phone = getUserField(user, [
        "phone",
        "phoneNumber",
        "mobile",
        "mobileNumber",
      ]);

      const address = getUserField(user, [
        "address",
        "deliveryAddress",
        "fullAddress",
        "shippingAddress",
      ]);

      const selectArea = getUserField(user, [
        "selectArea",
        "deliveryArea",
        "area",
      ]);

      setFormData((previous) => ({
        ...previous,
        fullName: previous.fullName || name,
        email: previous.email || email,
        phone: previous.phone || phone,
        address: previous.address || address,
        selectArea: previous.selectArea || selectArea,
      }));
    };

    const loadUser = async () => {
      const savedUser = getSavedUser();

      if (savedUser) {
        fillUserData(savedUser);
      }

      const token = localStorage.getItem("token");

      if (!token) {
        if (!cancelled) setUserLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          cache: "no-store",
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result?.success === false) {
          console.error(
            "User profile request failed:",
            result?.message || response.status,
          );
          return;
        }

        const user =
          result?.data?.user ??
          result?.data?.data?.user ??
          result?.data ??
          result?.user;

        if (user && typeof user === "object" && !cancelled) {
          localStorage.setItem("user", JSON.stringify(user));
          fillUserData(user);
        }
      } catch (error) {
        console.error("Unable to load user profile:", error);
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  const normalize = (value) => {
    if (value === null || value === undefined) return "";

    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    if (typeof value === "object") {
      return String(
        value.name ??
          value.value ??
          value.label ??
          value.title ??
          value._id ??
          "",
      ).trim();
    }

    return "";
  };

  const getProductId = (item) =>
    String(
      item?.productId ||
        item?.product?._id ||
        item?.product ||
        item?._id ||
        item?.id ||
        "",
    );

  const getCartId = (item) =>
    item?.id || item?._id || item?.productId || item?.product?._id;

  const getImage = (item) => {
    if (Array.isArray(item?.images) && item.images.length) {
      const firstImage = item.images[0];

      return typeof firstImage === "string"
        ? firstImage
        : firstImage?.url || firstImage?.secure_url || "";
    }

    if (typeof item?.image === "string") return item.image;

    return item?.image?.url || "";
  };

  const getPrice = (item) =>
    Number(item?.discountPrice ?? item?.price ?? 0);

  /* =========================================================
     VARIANTS
  ========================================================= */

  const getVariants = (item) => {
    if (!Array.isArray(item?.variants)) return [];

    return item.variants.map((variant, index) => ({
      ...variant,
      _variantIndex: index,
      color: normalize(variant?.color),
      ram: normalize(variant?.ram),
      storage: normalize(variant?.storage),
      price: Number(variant?.price ?? 0),
      stock: Number(variant?.stock ?? 0),
      sku: normalize(variant?.sku),
      variantId: variant?._id ? String(variant._id) : "",
      image:
        typeof variant?.image === "string"
          ? variant.image
          : variant?.image?.url || "",
    }));
  };

  const getSelected = (item) => {
    const id = getProductId(item);

    return (
      selectedVariants[id] || {
        color: "",
        ram: "",
        storage: "",
      }
    );
  };

  const getOptions = (item) => {
    const variants = getVariants(item);
    const selected = getSelected(item);

    if (!variants.length) {
      return { colors: [], rams: [], storages: [] };
    }

    const colors = [
      ...new Set(variants.map((v) => v.color).filter(Boolean)),
    ];

    let filtered = variants;

    if (selected.color) {
      filtered = filtered.filter((v) => v.color === selected.color);
    }

    const rams = [
      ...new Set(filtered.map((v) => v.ram).filter(Boolean)),
    ];

    if (selected.ram) {
      filtered = filtered.filter((v) => v.ram === selected.ram);
    }

    const storages = [
      ...new Set(filtered.map((v) => v.storage).filter(Boolean)),
    ];

    return { colors, rams, storages };
  };

  /* =========================================================
     MATCH VARIANT AND CHECK STOCK
  ========================================================= */

  const getVariantStatus = (item) => {
    const variants = getVariants(item);
    const selected = getSelected(item);

    if (!variants.length) {
      return {
        hasVariant: false,
        complete: true,
        available: true,
        stock: Number(item?.stock ?? 0),
        variant: null,
        message: "",
      };
    }

    const hasColor = variants.some((v) => Boolean(v.color));
    const hasRam = variants.some((v) => Boolean(v.ram));
    const hasStorage = variants.some((v) => Boolean(v.storage));

    const missingFields = [];

    if (hasColor && !selected.color) missingFields.push("Color");
    if (hasRam && !selected.ram) missingFields.push("RAM");
    if (hasStorage && !selected.storage) missingFields.push("Storage");

    if (missingFields.length) {
      return {
        hasVariant: true,
        complete: false,
        available: false,
        stock: 0,
        variant: null,
        message: `Please select ${missingFields.join(", ")}`,
      };
    }

    const matchedVariant = variants.find((variant) => {
      return (
        (!hasColor || variant.color === selected.color) &&
        (!hasRam || variant.ram === selected.ram) &&
        (!hasStorage || variant.storage === selected.storage)
      );
    });

    if (!matchedVariant) {
      return {
        hasVariant: true,
        complete: true,
        available: false,
        stock: 0,
        variant: null,
        message: "এই combination-এর variant available নেই।",
      };
    }

    const stock = Number(matchedVariant.stock || 0);

    return {
      hasVariant: true,
      complete: true,
      available: stock > 0,
      stock,
      variant: matchedVariant,
      message:
        stock > 0
          ? "Variant available"
          : "এই selected variant-এর stock শেষ।",
    };
  };

  const getMatchedVariant = (item) =>
    getVariantStatus(item).variant || null;

  const changeVariant = (productId, field, value) => {
    setSelectedVariants((previous) => ({
      ...previous,
      [productId]: {
        ...(previous[productId] || {}),
        [field]: value,
        ...(field === "color" ? { ram: "", storage: "" } : {}),
        ...(field === "ram" ? { storage: "" } : {}),
      },
    }));
  };

  /* =========================================================
     QUANTITY
  ========================================================= */

  const handleIncreaseQuantity = (item, cartId) => {
    const variants = getVariants(item);

    if (!variants.length) {
      const stock = Number(item?.stock ?? 0);
      const quantity = Number(item?.quantity || 1);

      if (stock > 0 && quantity >= stock) {
        alert(`এই পণ্যের সর্বোচ্চ ${stock}টি available আছে।`);
        return;
      }

      increasePopulation(cartId);
      return;
    }

    const status = getVariantStatus(item);

    if (!status.complete || !status.variant) {
      alert(status.message || "আগে variant নির্বাচন করুন।");
      return;
    }

    const quantity = Number(item?.quantity || 1);

    if (!status.available || quantity >= status.stock) {
      alert(`এই variant-এর সর্বোচ্চ ${status.stock}টি available আছে।`);
      return;
    }

    increasePopulation(cartId);
  };

  /* =========================================================
     TOTALS
  ========================================================= */

  const totalItems = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item?.quantity || 1),
        0,
      ),
    [cart],
  );

  const subTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const variant = getMatchedVariant(item);
      const price = variant
        ? Number(variant.price || 0) || getPrice(item)
        : getPrice(item);

      return total + price * Number(item?.quantity || 1);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, selectedVariants]);

  const deliveryCharge = useMemo(() => {
    if (formData.deliveryMethod === "shop_pickup") return 0;
    if (!formData.selectArea) return 0;

    return formData.selectArea.startsWith("Dhaka") ? 80 : 150;
  }, [formData.deliveryMethod, formData.selectArea]);

  const totalAmount = Math.max(
    0,
    subTotal + deliveryCharge - couponDiscount,
  );

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("en-BD");

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "couponCode") {
      setAppliedCoupon("");
      setCouponDiscount(0);
    }
  };

  /* =========================================================
     COUPON
  ========================================================= */

  const applyCoupon = () => {
    const code = formData.couponCode.trim().toUpperCase();

    if (!code) {
      setCouponDiscount(0);
      setAppliedCoupon("");
      alert("Please enter coupon code");
      return;
    }

    if (code === "SAVE500") {
      const discount = Math.min(500, subTotal);

      setCouponDiscount(discount);
      setAppliedCoupon(code);
      alert("Coupon applied successfully!");
      return;
    }

    setCouponDiscount(0);
    setAppliedCoupon("");
    alert("Invalid coupon code");
  };

  /* =========================================================
     SUBMIT ORDER
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!cart.length) {
      alert("Your cart is empty!");
      return;
    }

    if (!formData.termsAgreed) {
      alert("You must agree to the Terms and Conditions.");
      return;
    }

    if (!formData.fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!formData.phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }

    if (!formData.selectArea) {
      alert("Please select delivery area.");
      return;
    }

    if (
      formData.deliveryMethod === "courier_service" &&
      !formData.address.trim()
    ) {
      alert("Please enter your delivery address.");
      return;
    }

    for (const item of cart) {
      const variants = getVariants(item);
      const quantity = Number(item?.quantity || 1);

      if (variants.length) {
        const status = getVariantStatus(item);

        if (!status.complete || !status.variant) {
          alert(`${item.name || "Product"}: ${status.message}`);
          return;
        }

        if (!status.available) {
          alert(`${item.name || "Product"}: selected variant-এর stock শেষ।`);
          return;
        }

        if (quantity > status.stock) {
          alert(
            `${item.name || "Product"} এর selected variant-এ মাত্র ${status.stock}টি available আছে।`,
          );
          return;
        }
      } else {
        const stock = Number(item?.stock ?? 0);

        if (stock > 0 && quantity > stock) {
          alert(
            `${item.name || "Product"} এর মাত্র ${stock}টি available আছে।`,
          );
          return;
        }
      }
    }

    setLoading(true);

    try {
      // Frontend থেকে public IP নিয়ে নাও
      const clientIp = await getPublicIp();

      const products = cart.map((item) => {
        const productId = getProductId(item);
        const variants = getVariants(item);
        const variant = variants.length ? getMatchedVariant(item) : null;

        const price = variant
          ? Number(variant.price || 0) || getPrice(item)
          : getPrice(item);

        const quantity = Number(item?.quantity || 1);

        return {
          productId,
          name: item?.name || "",
          image: variant?.image || getImage(item),
          price,
          quantity,
          subtotal: price * quantity,
          slug: item?.slug || "",
          variant: variant
            ? {
                color: variant.color || "",
                ram: variant.ram || "",
                storage: variant.storage || "",
                sku: variant.sku || "",
                variantId: variant.variantId || "",
                variantPrice: Number(variant.price || 0),
                variantStock: Number(variant.stock || 0),
              }
            : null,
        };
      });

      const payload = {
        customerName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        selectArea: formData.selectArea,
        deliveryAddress:
          formData.deliveryMethod === "shop_pickup"
            ? ""
            : formData.address.trim(),
        note: formData.note.trim(),
        products,
        totalItems,
        subTotal,
        deliveryCharge,
        discountAmount: couponDiscount,
        totalAmount,
        couponCode: appliedCoupon || "",
        paymentMethod: formData.paymentMethod,
        deliveryMethod: formData.deliveryMethod,
        termsAgreed: formData.termsAgreed,
        orderSource: "website",

        // IP Address
        ipAddress: clientIp,
      };

      console.log("FINAL ORDER PAYLOAD:", payload);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

      const response = await fetch(`${API_BASE}/products/CreateOrder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      console.log("ORDER RESPONSE:", result);

      if (!response.ok || result?.success === false) {
        throw new Error(
          result?.message || "Order creation failed. Please try again.",
        );
      }

      const orderId =
        result?.data?.orderId ||
        result?.data?.data?.orderId ||
        result?.data?._id ||
        result?.orderId ||
        result?._id;

      if (!orderId) {
        throw new Error("Order created, but Order ID was not returned.");
      }

      // Online / partial payment
      if (
        formData.paymentMethod === "online_payment" ||
        formData.paymentMethod === "partial_payment"
      ) {
        const paymentResponse = await fetch(
          `${API_BASE}/api/payment/sslcommerz/initiate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ orderId: String(orderId) }),
          },
        );

        const paymentResult = await paymentResponse
          .json()
          .catch(() => ({}));

        if (!paymentResponse.ok || paymentResult?.success !== true) {
          throw new Error(
            paymentResult?.message ||
              `Order created, but payment could not be started. Order ID: ${orderId}`,
          );
        }

        const gatewayUrl = paymentResult?.data?.GatewayPageURL;

        if (
          typeof gatewayUrl !== "string" ||
          !/^https:\/\//i.test(gatewayUrl)
        ) {
          throw new Error(
            `SSLCOMMERZ Gateway URL was not returned. Order ID: ${orderId}`,
          );
        }

        window.location.assign(gatewayUrl);
        return;
      }

      // COD
      clearCart();
      showReviewToast("Order placed successfully!", 8000, "success");
      router.push(`/invoice/${encodeURIComponent(String(orderId))}`);
    } catch (error) {
      console.error("ORDER ERROR:", error);
      alert(error?.message || "Failed to place order!");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     EMPTY CART
  ========================================================= */

  if (!cart.length) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <ShoppingBag
              size={50}
              className="mx-auto mb-5 text-[#f47421]"
            />

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Cart is Empty
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Please add some products before checkout.
            </p>

            <Link
              href="/"
              prefetch={false}
              className="mt-6 inline-flex rounded-full bg-[#f47421] px-8 py-3 text-sm font-bold text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8 text-gray-800 dark:bg-slate-950 dark:text-gray-100">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* HEADER */}

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            prefetch={false}
            className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Checkout & Confirm Order
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              {totalItems} {totalItems === 1 ? "Item" : "Items"}
            </p>
          </div>
        </div>

        {/* CUSTOMER PROFILE STATUS */}

        {userLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900 dark:text-gray-400">
            <LoaderCircle size={17} className="animate-spin" />
            Loading your account information...
          </div>
        )}

        {!userLoading && loggedInUser && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
            <Check size={18} />
            Your account information has been loaded. You can edit the fields below.
          </div>
        )}

        {/* NOTICE */}

        <div className="rounded-lg border border-[#fde2c4] bg-[#fef4e8] p-3 text-sm text-[#8c5211] dark:border-orange-800/50 dark:bg-orange-900/20 dark:text-orange-300">
          {formData.paymentMethod !== "cash_on_delivery" ? (
            <>
              অ্যাডভান্স পেমেন্ট করার আগে আপনার কাঙ্ক্ষিত পণ্যটি আমাদের স্টকে
              আছে কি না কাস্টমার সার্ভিস প্রতিনিধির সাথে কনফার্ম করে নিন।
              <span className="font-semibold"> 09678148148</span>
            </>
          ) : (
            <>
              অর্ডার সংক্রান্ত যেকোনো প্রয়োজনে আমাদের কাস্টমার সার্ভিস
              প্রতিনিধির সাথে কথা বলুন -
              <span className="font-semibold"> 09678148148</span>
            </>
          )}
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >
          {/* LEFT: DELIVERY INFORMATION */}

          <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-7">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Delivery Information
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* NAME */}

                <div>
                  <label
                    htmlFor="checkout-name"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Full Name *
                  </label>

                  <input
                    id="checkout-name"
                    type="text"
                    name="fullName"
                    required
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="checkout-email"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email
                  </label>

                  <input
                    id="checkout-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Phone Number *
                  </label>

                  <div className="flex">
                    <span className="flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-400">
                      +88
                    </span>

                    <input
                      id="checkout-phone"
                      type="tel"
                      name="phone"
                      required
                      autoComplete="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      className="w-full min-w-0 rounded-r-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* AREA */}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Select Area *
                  </label>

                  <AreaSelector
                    value={formData.selectArea}
                    onChange={(value) =>
                      setFormData((previous) => ({
                        ...previous,
                        selectArea: value,
                      }))
                    }
                  />
                </div>

                {/* ADDRESS */}

                {formData.deliveryMethod !== "shop_pickup" && (
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="checkout-address"
                      className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Address *
                    </label>

                    <input
                      id="checkout-address"
                      type="text"
                      name="address"
                      required
                      autoComplete="street-address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House# 123, Road# 24"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                )}

                {/* NOTE */}

                <div className="sm:col-span-2">
                  <label
                    htmlFor="checkout-note"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Note
                  </label>

                  <textarea
                    id="checkout-note"
                    name="note"
                    rows={3}
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Any special delivery instructions..."
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* PAYMENT */}

            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                Payment Method
              </h2>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    id: "cash_on_delivery",
                    label: "Cash on Delivery",
                    icon: Banknote,
                  },
                  {
                    id: "online_payment",
                    label: "Online Payment",
                    icon: CreditCard,
                  },
                  {
                    id: "partial_payment",
                    label: "Partial Payment",
                    icon: Wallet,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const selected = formData.paymentMethod === item.id;

                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                        selected
                          ? "border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20"
                          : "border-gray-200 dark:border-slate-700 dark:bg-slate-800/50"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={
                          selected
                            ? "text-orange-500"
                            : "text-gray-500 dark:text-gray-400"
                        }
                      />

                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {item.label}
                      </span>

                      <input
                        type="radio"
                        name="paymentMethod"
                        value={item.id}
                        checked={selected}
                        onChange={handleChange}
                        className="ml-auto accent-orange-500"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* DELIVERY METHOD */}

            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                Delivery Method
              </h2>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    id: "courier_service",
                    label: "Courier Service",
                    icon: Truck,
                  },
                  {
                    id: "shop_pickup",
                    label: "Shop Pickup",
                    icon: Store,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const selected = formData.deliveryMethod === item.id;

                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                        selected
                          ? "border-orange-500 bg-orange-50 dark:border-orange-500 dark:bg-orange-900/20"
                          : "border-gray-200 dark:border-slate-700 dark:bg-slate-800/50"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={
                          selected
                            ? "text-orange-500"
                            : "text-gray-500 dark:text-gray-400"
                        }
                      />

                      <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                        {item.label}
                      </span>

                      <input
                        type="radio"
                        name="deliveryMethod"
                        value={item.id}
                        checked={selected}
                        onChange={handleChange}
                        className="ml-auto accent-orange-500"
                      />
                    </label>
                  );
                })}
              </div>

              {formData.deliveryMethod === "shop_pickup" && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Shop pickup নির্বাচন করলে delivery charge প্রযোজ্য হবে না।
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}

          <div className="h-fit space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Order Summary
            </h2>

            {/* PRODUCTS */}

            <div className="space-y-4">
              {cart.map((item, index) => {
                const productId = getProductId(item);
                const cartId = getCartId(item);
                const variants = getVariants(item);
                const selected = getSelected(item);
                const options = getOptions(item);
                const status = getVariantStatus(item);
                const matchedVariant = status.variant;

                const price = matchedVariant
                  ? Number(matchedVariant.price || 0) || getPrice(item)
                  : getPrice(item);

                const quantity = Number(item?.quantity || 1);
                const itemTotal = price * quantity;
                const hasVariants = variants.length > 0;
                const image = matchedVariant?.image || getImage(item);

                return (
                  <div
                    key={`${productId}-${index}`}
                    className="flex gap-3 border-b border-gray-100 pb-4 dark:border-slate-800"
                  >
                    {/* IMAGE */}

                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800">
                      {image ? (
                        <img
                          src={image}
                          alt={item?.name || "Product"}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <ShoppingBag
                          size={25}
                          className="text-gray-300 dark:text-gray-600"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* NAME */}

                      <div className="flex justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                          {item?.name}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeFromCart(cartId)}
                          aria-label="Remove product"
                          className="text-gray-400 transition hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {/* PRICE */}

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        ৳ {formatPrice(price)}
                      </p>

                      {/* VARIANT SELECTORS */}

                      {hasVariants && (
                        <div className="mt-3 space-y-2">
                          {options.colors.length > 0 && (
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Select Color
                              </label>

                              <select
                                value={selected.color}
                                onChange={(event) =>
                                  changeVariant(
                                    productId,
                                    "color",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                              >
                                <option value="">Select Color</option>

                                {options.colors.map((color) => (
                                  <option key={color} value={color}>
                                    {color}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {options.rams.length > 0 && (
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Select RAM
                              </label>

                              <select
                                value={selected.ram}
                                disabled={
                                  options.colors.length > 0 && !selected.color
                                }
                                onChange={(event) =>
                                  changeVariant(
                                    productId,
                                    "ram",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 disabled:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-700"
                              >
                                <option value="">
                                  {options.colors.length > 0 && !selected.color
                                    ? "Select Color First"
                                    : "Select RAM"}
                                </option>

                                {options.rams.map((ram) => (
                                  <option key={ram} value={ram}>
                                    {ram}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {options.storages.length > 0 && (
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                                Select Storage
                              </label>

                              <select
                                value={selected.storage}
                                disabled={
                                  (options.colors.length > 0 &&
                                    !selected.color) ||
                                  (options.rams.length > 0 && !selected.ram)
                                }
                                onChange={(event) =>
                                  changeVariant(
                                    productId,
                                    "storage",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 disabled:bg-gray-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:disabled:bg-slate-700"
                              >
                                <option value="">Select Storage</option>

                                {options.storages.map((storage) => (
                                  <option key={storage} value={storage}>
                                    {storage}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SELECTED VARIANT */}

                      {(selected.color || selected.ram || selected.storage) && (
                        <div className="mt-2 rounded-md bg-orange-50 px-2 py-1.5 text-[11px] text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                          <b>Selected:</b>{" "}
                          {selected.color && `Color: ${selected.color}`}
                          {selected.ram && ` • RAM: ${selected.ram}`}
                          {selected.storage &&
                            ` • Storage: ${selected.storage}`}
                        </div>
                      )}

                      {matchedVariant?.sku && (
                        <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                          SKU: {matchedVariant.sku}
                        </p>
                      )}

                      {/* VARIANT STATUS */}

                      {hasVariants && (
                        <div className="mt-2">
                          {!status.complete && (
                            <p className="rounded-md bg-gray-50 px-2 py-1.5 text-[11px] text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                              <b>{status.message}</b>
                            </p>
                          )}

                          {status.complete &&
                            status.variant &&
                            status.available && (
                              <p className="rounded-md bg-green-50 px-2 py-1.5 text-[11px] text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                <b>✓ Variant Available</b>
                                <span className="ml-2">
                                  Stock: {status.stock}
                                </span>
                              </p>
                            )}

                          {status.complete && !status.variant && (
                            <p className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-600 dark:bg-red-900/20 dark:text-red-400">
                              <b>{status.message}</b>
                            </p>
                          )}

                          {status.complete &&
                            status.variant &&
                            !status.available && (
                              <p className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                <b>{status.message}</b>
                              </p>
                            )}
                        </div>
                      )}

                      {/* QUANTITY */}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-full border border-gray-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => decreasePopulation(cartId)}
                            aria-label="Decrease quantity"
                            className="flex h-7 w-7 items-center justify-center text-gray-700 dark:text-gray-300"
                          >
                            <Minus size={13} />
                          </button>

                          <span className="w-7 text-center text-xs font-semibold text-gray-900 dark:text-white">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleIncreaseQuantity(item, cartId)
                            }
                            disabled={
                              hasVariants &&
                              (!status.available || status.stock <= quantity)
                            }
                            aria-label="Increase quantity"
                            className="flex h-7 w-7 items-center justify-center text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-300"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          ৳ {formatPrice(itemTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* COUPON */}

            <div>
              <label
                htmlFor="checkout-coupon"
                className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                Apply Coupon
              </label>

              <div className="flex gap-2">
                <input
                  id="checkout-coupon"
                  type="text"
                  name="couponCode"
                  value={formData.couponCode}
                  onChange={handleChange}
                  placeholder="Coupon Code"
                  className="w-full min-w-0 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                />

                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-md bg-black px-4 py-2 text-xs font-medium text-white dark:bg-white dark:text-black"
                >
                  Apply
                </button>
              </div>

              {appliedCoupon && (
                <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                  {appliedCoupon} applied successfully.
                </p>
              )}
            </div>

            {/* PRICE BREAKDOWN */}

            <div className="space-y-3 border-y border-gray-200 py-4 text-sm text-gray-700 dark:border-slate-700 dark:text-gray-300">
              <div className="flex justify-between gap-3">
                <span>Sub Total ({totalItems} items)</span>
                <b>৳ {formatPrice(subTotal)}</b>
              </div>

              <div className="flex justify-between gap-3">
                <span className="flex items-center gap-1">
                  Delivery
                  <Info size={13} className="text-orange-500" />
                </span>

                <b>৳ {formatPrice(deliveryCharge)}</b>
              </div>

              <div className="flex justify-between gap-3">
                <span>Discount</span>
                <b className="text-green-600 dark:text-green-400">
                  - ৳ {formatPrice(couponDiscount)}
                </b>
              </div>
            </div>

            {/* TOTAL */}

            <div className="flex justify-between gap-3 text-lg font-bold text-gray-900 dark:text-white">
              <span>Total Amount</span>
              <span>৳ {formatPrice(totalAmount)}</span>
            </div>

            {/* TERMS */}

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="checkout-terms"
                name="termsAgreed"
                checked={formData.termsAgreed}
                onChange={handleChange}
                className="mt-0.5 accent-orange-500"
              />

              <label
                htmlFor="checkout-terms"
                className="text-xs text-gray-600 dark:text-gray-400"
              >
                I have read & agree to the website{" "}
                <a
                  href="/terms-and-conditions"
                  className="text-orange-500 underline"
                >
                  Terms and Conditions
                </a>
              </label>
            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading || userLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#f47421] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Placing Order...
                </>
              ) : userLoading ? (
                "Loading..."
              ) : (
                "Confirm & Place Order"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}