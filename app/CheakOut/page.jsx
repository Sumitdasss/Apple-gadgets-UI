 /* eslint-disable react-hooks/set-state-in-effect */

"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";

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
} from "lucide-react";

import useStore from "../Store/store";
import { BANGLADESH_GEO } from "../../Data/BangladeshLocation";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

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
    const handleOutside = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
    };
  }, []);

  const divisions = Object.keys(BANGLADESH_GEO);

  const districts = division
    ? Object.keys(
        BANGLADESH_GEO[division] || {}
      )
    : [];

  const upazilas =
    division && district
      ? BANGLADESH_GEO[division]?.[district] || []
      : [];

  const selectUpazila = (upazila) => {
    const fullValue = `${division} > ${district} > ${upazila}`;

    onChange(fullValue);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen((prev) => !prev)
        }
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm"
      >
        <span
          className={
            value
              ? "text-gray-900"
              : "text-gray-400"
          }
        >
          {value ||
            "Select delivery area"}
        </span>

        <ChevronDown
          size={16}
          className="text-gray-400"
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex max-h-[320px] overflow-hidden rounded-lg border bg-white shadow-xl">
          {/* DIVISION */}

          <div className="w-40 overflow-y-auto border-r">
            {divisions.map((item) => (
              <div
                key={item}
                onMouseEnter={() => {
                  setDivision(item);
                  setDistrict("");
                }}
                className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm ${
                  division === item
                    ? "bg-orange-50 text-orange-600"
                    : "hover:bg-gray-50"
                }`}
              >
                {item}

                <ChevronRight size={14} />
              </div>
            ))}
          </div>

          {/* DISTRICT */}

          {division && (
            <div className="w-44 overflow-y-auto border-r">
              {districts.map((item) => (
                <div
                  key={item}
                  onMouseEnter={() =>
                    setDistrict(item)
                  }
                  className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm ${
                    district === item
                      ? "bg-orange-50 text-orange-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {item}

                  <ChevronRight size={14} />
                </div>
              ))}
            </div>
          )}

          {/* UPAZILA */}

          {district && (
            <div className="w-48 overflow-y-auto">
              {upazilas.map((item) => {
                const selected =
                  value ===
                  `${division} > ${district} > ${item}`;

                return (
                  <div
                    key={item}
                    onClick={() =>
                      selectUpazila(item)
                    }
                    className={`flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm ${
                      selected
                        ? "bg-orange-50 text-orange-600"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {item}

                    {selected && (
                      <Check size={14} />
                    )}
                  </div>
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
   MAIN CHECKOUT
========================================================= */

export default function CheckoutPage() {
  const {
    cart,
    increasePopulation,
    decreasePopulation,
    removeFromCart,
    clearCart
  } = useStore();

  const [formData, setFormData] =
    useState({
      fullName: "",
      email: "",
      phone: "",
      selectArea: "",
      address: "",
      note: "",
      paymentMethod:
        "cash_on_delivery",
      deliveryMethod:
        "courier_service",
      couponCode: "",
      termsAgreed: true,
    });

  const [
    selectedVariants,
    setSelectedVariants,
  ] = useState({});

  const [couponDiscount, setCouponDiscount] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  /* =========================================================
     HELPERS
  ========================================================= */

  const normalize = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return String(value).trim();
    }

    if (typeof value === "object") {
      return String(
        value.name ??
          value.value ??
          value.label ??
          value.title ??
          value._id ??
          ""
      ).trim();
    }

    return "";
  };

  /* =========================================================
     PRODUCT ID
  ========================================================= */

  const getProductId = (item) =>
    String(
      item?.productId ||
        item?.product?._id ||
        item?.product ||
        item?._id ||
        item?.id ||
        ""
    );

  /* =========================================================
     CART ID
  ========================================================= */

  const getCartId = (item) =>
    item?.id ||
    item?._id ||
    item?.productId ||
    item?.product?._id;

  /* =========================================================
     IMAGE
  ========================================================= */

  const getImage = (item) => {
    if (
      Array.isArray(item?.images) &&
      item.images.length
    ) {
      return item.images[0];
    }

    return item?.image || "";
  };

  /* =========================================================
     PRODUCT PRICE
  ========================================================= */

  const getPrice = (item) =>
    Number(
      item?.discountPrice ??
        item?.price ??
        0
    );

  /* =========================================================
     GET VARIANTS
========================================================= */

 
const getVariants = (item) => {
  if (!Array.isArray(item?.variants)) {
    return [];
  }

  return item.variants.map((variant, index) => ({
    ...variant,

    // Variant array index
    _variantIndex: index,

    // Variant values normalize
    color: normalize(variant?.color),
    ram: normalize(variant?.ram),
    storage: normalize(variant?.storage),

    // Numbers
    price: Number(variant?.price ?? 0),
    stock: Number(variant?.stock ?? 0),

    // SKU
    sku: normalize(variant?.sku),

    // MongoDB Variant _id
    variantId: variant?._id
      ? String(variant._id)
      : "",

    // Variant image
    image: variant?.image || "",
  }));
};


  /* =========================================================
     GET SELECTED VARIANT
  ========================================================= */

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

  /* =========================================================
     GET VARIANT OPTIONS
  ========================================================= */

  const getOptions = (item) => {
    const variants =
      getVariants(item);

    const selected =
      getSelected(item);

    if (!variants.length) {
      return {
        colors: [],
        rams: [],
        storages: [],
      };
    }

    /* COLORS */

    const colors = [
      ...new Set(
        variants
          .map(
            (variant) =>
              variant.color
          )
          .filter(Boolean)
      ),
    ];

    /* FILTER COLOR */

    let filtered = variants;

    if (selected.color) {
      filtered =
        filtered.filter(
          (variant) =>
            variant.color ===
            selected.color
        );
    }

    /* RAM */

    const rams = [
      ...new Set(
        filtered
          .map(
            (variant) =>
              variant.ram
          )
          .filter(Boolean)
      ),
    ];

    /* FILTER RAM */

    if (selected.ram) {
      filtered =
        filtered.filter(
          (variant) =>
            variant.ram ===
            selected.ram
        );
    }

    /* STORAGE */

    const storages = [
      ...new Set(
        filtered
          .map(
            (variant) =>
              variant.storage
          )
          .filter(Boolean)
      ),
    ];

    return {
      colors,
      rams,
      storages,
    };
  };

  /* =========================================================
     EXACT VARIANT STATUS
========================================================= */

  const getVariantStatus = (item) => {
    const variants =
      getVariants(item);

    const selected =
      getSelected(item);

    /* NORMAL PRODUCT */

    if (!variants.length) {
      return {
        hasVariant: false,
        complete: true,
        available: true,
        stock: 0,
        variant: null,
        missingFields: [],
        message: "",
      };
    }

    /* CHECK REQUIRED FIELDS */

    const hasColor =
      variants.some(
        (variant) =>
          Boolean(variant.color)
      );

    const hasRam =
      variants.some(
        (variant) =>
          Boolean(variant.ram)
      );

    const hasStorage =
      variants.some(
        (variant) =>
          Boolean(variant.storage)
      );

    const missingFields = [];

    if (
      hasColor &&
      !selected.color
    ) {
      missingFields.push("Color");
    }

    if (
      hasRam &&
      !selected.ram
    ) {
      missingFields.push("RAM");
    }

    if (
      hasStorage &&
      !selected.storage
    ) {
      missingFields.push(
        "Storage"
      );
    }

    /* NOT COMPLETE */

    if (
      missingFields.length > 0
    ) {
      return {
        hasVariant: true,
        complete: false,
        available: false,
        stock: 0,
        variant: null,
        missingFields,
        message: `Please select ${missingFields.join(
          ", "
        )}`,
      };
    }

    /* =======================================================
       EXACT COMBINATION
    ======================================================= */

    const matchedVariant =
      variants.find(
        (variant) => {
          const colorMatch =
            hasColor
              ? variant.color ===
                selected.color
              : true;

          const ramMatch =
            hasRam
              ? variant.ram ===
                selected.ram
              : true;

          const storageMatch =
            hasStorage
              ? variant.storage ===
                selected.storage
              : true;

          return (
            colorMatch &&
            ramMatch &&
            storageMatch
          );
        }
      );

    /* COMBINATION NOT FOUND */

    if (!matchedVariant) {
      return {
        hasVariant: true,
        complete: true,
        available: false,
        stock: 0,
        variant: null,
        missingFields: [],
        message:
          "এই combination-এর variant available নেই।",
      };
    }

    /* STOCK */

    const stock = Number(
      matchedVariant.stock || 0
    );

    /* OUT OF STOCK */

    if (stock <= 0) {
      return {
        hasVariant: true,
        complete: true,
        available: false,
        stock: 0,
        variant: matchedVariant,
        missingFields: [],
        message:
          "এই selected variant-এর stock শেষ।",
      };
    }

    /* AVAILABLE */

    return {
      hasVariant: true,
      complete: true,
      available: true,
      stock,
      variant: matchedVariant,
      missingFields: [],
      message:
        "Variant available",
    };
  };

  /* =========================================================
     GET MATCHED VARIANT
========================================================= */

  const getMatchedVariant = (
    item
  ) => {
    const status =
      getVariantStatus(item);

    return status.variant || null;
  };

  /* =========================================================
     CHANGE VARIANT
========================================================= */

  const changeVariant = (
    productId,
    field,
    value
  ) => {
    setSelectedVariants(
      (prev) => ({
        ...prev,

        [productId]: {
          ...(prev[productId] || {}),

          [field]: value,

          /* COLOR CHANGE */

          ...(field === "color" && {
            ram: "",
            storage: "",
          }),

          /* RAM CHANGE */

          ...(field === "ram" && {
            storage: "",
          }),
        },
      })
    );
  };

  /* =========================================================
     INCREASE QUANTITY
========================================================= */

  const handleIncreaseQuantity = (
    item,
    cartId
  ) => {
    const variants =
      getVariants(item);

    /* NORMAL PRODUCT */

    if (!variants.length) {
      increasePopulation(
        cartId
      );
      return;
    }

    /* VARIANT STATUS */

    const variantStatus =
      getVariantStatus(item);

    /* FIELD NOT COMPLETE */

    if (
      !variantStatus.complete
    ) {
      alert(
        variantStatus.message
      );
      return;
    }

    /* VARIANT NOT FOUND */

    if (
      !variantStatus.variant
    ) {
      alert(
        "এই selected combination-এর variant available নেই।"
      );
      return;
    }

    const stock = Number(
      variantStatus.stock || 0
    );

    const currentQuantity =
      Number(
        item?.quantity || 1
      );

    /* STOCK 0 */

    if (stock <= 0) {
      alert(
        "এই selected variant-এর stock শেষ।"
      );
      return;
    }

    /* MAX STOCK */

    if (
      currentQuantity >= stock
    ) {
      alert(
        `এই variant-এর সর্বোচ্চ ${stock}টি available আছে।`
      );
      return;
    }

    /* INCREASE */

    increasePopulation(
      cartId
    );
  };

  /* =========================================================
     TOTAL ITEMS
========================================================= */

  const totalItems =
    useMemo(() => {
      return cart.reduce(
        (total, item) =>
          total +
          Number(
            item?.quantity || 1
          ),
        0
      );
    }, [cart]);

  /* =========================================================
     SUB TOTAL
========================================================= */

  const subTotal =
    useMemo(() => {
      return cart.reduce(
        (total, item) => {
          const variant =
            getMatchedVariant(
              item
            );

          const price = variant
            ? Number(
                variant.price || 0
              ) ||
              getPrice(item)
            : getPrice(item);

          const quantity =
            Number(
              item?.quantity || 1
            );

          return (
            total +
            price * quantity
          );
        },
        0
      );
    }, [
      cart,
      selectedVariants,
    ]);

  /* =========================================================
     DELIVERY CHARGE
========================================================= */

  const deliveryCharge =
    useMemo(() => {
      if (
        formData.deliveryMethod ===
        "shop_pickup"
      ) {
        return 0;
      }

      if (
        !formData.selectArea
      ) {
        return 0;
      }

      return formData.selectArea.startsWith(
        "Dhaka"
      )
        ? 80
        : 150;
    }, [
      formData.deliveryMethod,
      formData.selectArea,
    ]);

  /* =========================================================
     TOTAL
========================================================= */

  const totalAmount =
    Math.max(
      0,
      subTotal +
        deliveryCharge -
        couponDiscount
    );

  /* =========================================================
     FORMAT PRICE
========================================================= */

  const formatPrice = (
    price
  ) =>
    Number(
      price || 0
    ).toLocaleString("en-BD");

  /* =========================================================
     FORM CHANGE
========================================================= */

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData(
      (prev) => ({
        ...prev,

        [name]:
          type ===
          "checkbox"
            ? checked
            : value,
      })
    );
  };

  /* =========================================================
     COUPON
========================================================= */

  const applyCoupon = () => {
    const code =
      formData.couponCode
        .trim()
        .toUpperCase();

    if (!code) {
      setCouponDiscount(0);

      alert(
        "Please enter coupon code"
      );

      return;
    }

    if (
      code === "SAVE500"
    ) {
      setCouponDiscount(
        Math.min(
          500,
          subTotal
        )
      );

      alert(
        "Coupon applied successfully!"
      );

      return;
    }

    setCouponDiscount(0);

    alert(
      "Invalid coupon code"
    );
  };

  /* =========================================================
     SUBMIT ORDER
========================================================= */

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      /* BASIC VALIDATION */

      if (!cart.length) {
        alert(
          "Your cart is empty!"
        );
        return;
      }

      if (
        !formData.termsAgreed
      ) {
        alert(
          "You must agree to the Terms and Conditions."
        );
        return;
      }

      if (
        !formData.fullName.trim()
      ) {
        alert(
          "Please enter your full name."
        );
        return;
      }

      if (
        !formData.phone.trim()
      ) {
        alert(
          "Please enter your phone number."
        );
        return;
      }

      if (
        !formData.selectArea
      ) {
        alert(
          "Please select delivery area."
        );
        return;
      }

      if (
        !formData.address.trim()
      ) {
        alert(
          "Please enter your delivery address."
        );
        return;
      }

      /* =====================================================
         CHECK EVERY PRODUCT
      ===================================================== */

      for (const item of cart) {
        const variants =
          getVariants(item);

        /* NORMAL PRODUCT */

        if (!variants.length) {
          continue;
        }

        const status =
          getVariantStatus(item);

        /* FIELD MISSING */

        if (!status.complete) {
          alert(
            `${item.name}: ${status.message}`
          );
          return;
        }

        /* VARIANT NOT FOUND */

        if (!status.variant) {
          alert(
            `${item.name}: এই selected combination-এর variant available নেই।`
          );
          return;
        }

        const variantStock =
          Number(
            status.stock || 0
          );

        const quantity =
          Number(
            item?.quantity || 1
          );

        /* STOCK ZERO */

        if (
          variantStock <= 0
        ) {
          alert(
            `${item.name} এর selected variant-এর stock শেষ।`
          );
          return;
        }

        /* QUANTITY > STOCK */

        if (
          quantity >
          variantStock
        ) {
          alert(
            `${item.name} এর selected variant-এ মাত্র ${variantStock}টি available আছে।`
          );
          return;
        }
      }

      setLoading(true);

      try {
        /* ===================================================
           CREATE PRODUCTS PAYLOAD
        =================================================== */

        const products =
          cart.map((item) => {
            const productId =
              getProductId(item);

            const variants =
              getVariants(item);

            const variant =
              variants.length
                ? getMatchedVariant(
                    item
                  )
                : null;

            const price = variant
              ? Number(
                  variant.price || 0
                ) ||
                getPrice(item)
              : getPrice(item);

            const quantity =
              Number(
                item?.quantity || 1
              );

            return {
              productId,

              name:
                item?.name || "",

              image:
                variant?.image ||
                getImage(item),

              price,

              quantity,

              subtotal:
                price * quantity,

              slug:
                item?.slug || "",

              /* EXACT VARIANT */

              variant: variant
                ? {
                    color:
                      variant.color ||
                      "",

                    ram:
                      variant.ram ||
                      "",

                    storage:
                      variant.storage ||
                      "",

                    sku:
                      variant.sku ||
                      "",

                    variantId:
                      variant.variantId ||
                      "",

                    variantPrice:
                      Number(
                        variant.price ||
                          0
                      ),

                    variantStock:
                      Number(
                        variant.stock ||
                          0
                      ),
                  }
                : null,
            };
          });

        /* ===================================================
           ORDER PAYLOAD
        =================================================== */

        const payload = {
          customerName:
            formData.fullName.trim(),

          email:
            formData.email.trim(),

          phone:
            formData.phone.trim(),

          selectArea:
            formData.selectArea,

          deliveryAddress:
            formData.address.trim(),

          note:
            formData.note.trim(),

          products,

          totalItems,

          subTotal,

          deliveryCharge,

          discountAmount:
            couponDiscount,

          totalAmount,

          couponCode:
            formData.couponCode
              .trim()
              .toUpperCase(),

          paymentMethod:
            formData.paymentMethod,

          deliveryMethod:
            formData.deliveryMethod,

          termsAgreed:
            formData.termsAgreed,

          orderSource:
            "website",
        };

        console.log(
          "FINAL ORDER PAYLOAD:",
          payload
        );

        /* ===================================================
           API
        =================================================== */

        const response =
          await fetch(
            `${API_BASE}/products/CreateOrder`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                payload
              ),
            }
          );

        const data =
          await response.json();

        console.log(
          "ORDER RESPONSE:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Order creation failed"
          );
        }

        if (data?.success) {
          clearCart()
          alert(
            `Order placed successfully!\nOrder ID: ${
              data?.data?.orderId ||
              data?.orderId ||
              "Created"
            }`
          );

          window.location.href =
            "/";
        } else {
          alert(
            data?.message ||
              "Something went wrong!"
          );
        }
      } catch (error) {
        console.error(
          "ORDER ERROR:",
          error
        );

        alert(
          error?.message ||
            "Failed to place order!"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     EMPTY CART
========================================================= */

  if (!cart.length) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

            <ShoppingBag
              size={50}
              className="mx-auto mb-5 text-[#f47421]"
            />

            <h1 className="text-2xl font-bold">
              Your Cart is Empty
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Please add some products
              before checkout.
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
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8 text-gray-800">
      <div className="mx-auto max-w-[1440px] space-y-6">

        {/* HEADER */}

        <div className="flex items-center gap-3">

          <Link
            href="/cart"
            prefetch={false}
            className="flex items-center gap-1 rounded-md border bg-white px-3 py-2 text-sm shadow-sm"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <div>
            <h1 className="text-2xl font-bold">
              Checkout & Confirm Order
            </h1>

            <p className="text-sm text-gray-500">
              {totalItems}{" "}
              {totalItems === 1
                ? "Item"
                : "Items"}
            </p>
          </div>

        </div>

        {/* NOTICE */}

        <div className="rounded-lg border border-[#fde2c4] bg-[#fef4e8] p-3 text-sm text-[#8c5211]">

          {formData.paymentMethod !==
          "cash_on_delivery" ? (
            <>
              অ্যাডভান্স পেমেন্ট করার আগে
              আপনার কাঙ্ক্ষিত পণ্যটি আমাদের
              স্টকে আছে কি না কাস্টমার সার্ভিস
              প্রতিনিধির সাথে কনফার্ম করে নিন।

              <span className="font-semibold">
                {" "}
                09678148148
              </span>
            </>
          ) : (
            <>
              অর্ডার সংক্রান্ত যেকোনো প্রয়োজনে
              আমাদের কাস্টমার সার্ভিস প্রতিনিধির
              সাথে কথা বলুন -

              <span className="font-semibold">
                {" "}
                09678148148
              </span>
            </>
          )}

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="space-y-6 rounded-xl border bg-white p-6 shadow-sm lg:col-span-7">

            {/* DELIVERY */}

            <div>

              <h2 className="mb-4 text-lg font-semibold">
                Delivery Information
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* NAME */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    required
                    value={
                      formData.fullName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter full name"
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Email
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter Email"
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Phone Number *
                  </label>

                  <div className="flex">

                    <span className="flex items-center rounded-l-md border border-r-0 bg-gray-50 px-3 text-sm text-gray-500">
                      +88
                    </span>

                    <input
                      type="tel"
                      name="phone"
                      required
                      value={
                        formData.phone
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="01XXXXXXXXX"
                      className="w-full rounded-r-md border px-3 py-2 text-sm"
                    />

                  </div>
                </div>

                {/* AREA */}

                <div>

                  <label className="mb-1 block text-sm font-medium">
                    Select Area *
                  </label>

                  <AreaSelector
                    value={
                      formData.selectArea
                    }
                    onChange={(
                      value
                    ) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          selectArea:
                            value,
                        })
                      )
                    }
                  />

                </div>

                {/* ADDRESS */}

                <div className="sm:col-span-2">

                  <label className="mb-1 block text-sm font-medium">
                    Address *
                  </label>

                  <input
                    type="text"
                    name="address"
                    required
                    value={
                      formData.address
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="House# 123, Road# 24"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />

                </div>

                {/* NOTE */}

                <div className="sm:col-span-2">

                  <label className="mb-1 block text-sm font-medium">
                    Note
                  </label>

                  <textarea
                    name="note"
                    rows={3}
                    value={
                      formData.note
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Any special delivery instructions..."
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />

                </div>

              </div>
            </div>

            {/* PAYMENT */}

            <div>

              <h2 className="mb-3 text-lg font-semibold">
                Payment Method
              </h2>

              <div className="grid gap-3 sm:grid-cols-3">

                {[
                  {
                    id: "cash_on_delivery",
                    label:
                      "Cash on Delivery",
                    icon: Banknote,
                  },
                  {
                    id: "online_payment",
                    label:
                      "Online Payment",
                    icon: CreditCard,
                  },
                  {
                    id: "partial_payment",
                    label:
                      "Partial Payment",
                    icon: Wallet,
                  },
                ].map((item) => {
                  const Icon =
                    item.icon;

                  const selected =
                    formData.paymentMethod ===
                    item.id;

                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                        selected
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200"
                      }`}
                    >

                      <Icon
                        size={20}
                        className={
                          selected
                            ? "text-orange-500"
                            : "text-gray-500"
                        }
                      />

                      <span className="text-xs font-medium">
                        {item.label}
                      </span>

                      <input
                        type="radio"
                        name="paymentMethod"
                        value={
                          item.id
                        }
                        checked={
                          selected
                        }
                        onChange={
                          handleChange
                        }
                        className="ml-auto accent-orange-500"
                      />

                    </label>
                  );
                })}

              </div>
            </div>

            {/* DELIVERY METHOD */}

            <div>

              <h2 className="mb-3 text-lg font-semibold">
                Delivery Method
              </h2>

              <div className="grid gap-3 sm:grid-cols-2">

                {[
                  {
                    id: "courier_service",
                    label:
                      "Courier Service",
                    icon: Truck,
                  },
                  {
                    id: "shop_pickup",
                    label:
                      "Shop Pickup",
                    icon: Store,
                  },
                ].map((item) => {
                  const Icon =
                    item.icon;

                  const selected =
                    formData.deliveryMethod ===
                    item.id;

                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 ${
                        selected
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200"
                      }`}
                    >

                      <Icon
                        size={20}
                        className={
                          selected
                            ? "text-orange-500"
                            : "text-gray-500"
                        }
                      />

                      <span className="text-xs font-medium">
                        {item.label}
                      </span>

                      <input
                        type="radio"
                        name="deliveryMethod"
                        value={
                          item.id
                        }
                        checked={
                          selected
                        }
                        onChange={
                          handleChange
                        }
                        className="ml-auto accent-orange-500"
                      />

                    </label>
                  );
                })}

              </div>
            </div>

          </div>

          {/* =================================================
              RIGHT
          ================================================= */}

          <div className="h-fit space-y-5 rounded-xl border bg-white p-6 shadow-sm lg:col-span-5">

            <h2 className="text-lg font-semibold">
              Order Summary
            </h2>

            {/* PRODUCTS */}

            <div className="space-y-4">

              {cart.map(
                (
                  item,
                  index
                ) => {
                  const productId =
                    getProductId(
                      item
                    );

                  const cartId =
                    getCartId(item);

                  const variants =
                    getVariants(
                      item
                    );

                  const selected =
                    getSelected(
                      item
                    );

                  const options =
                    getOptions(
                      item
                    );

                  const variantStatus =
                    getVariantStatus(
                      item
                    );

                  const matchedVariant =
                    variantStatus.variant;

                  const price =
                    matchedVariant
                      ? Number(
                          matchedVariant.price ||
                            0
                        ) ||
                        getPrice(
                          item
                        )
                      : getPrice(
                          item
                        );

                  const quantity =
                    Number(
                      item?.quantity ||
                        1
                    );

                  const itemTotal =
                    price *
                    quantity;

                  const hasVariants =
                    variants.length >
                    0;

                  const selectedVariantStock =
                    Number(
                      variantStatus.stock ||
                        0
                    );

                  return (
                    <div
                      key={`${productId}-${index}`}
                      className="flex gap-3 border-b pb-4"
                    >

                      {/* IMAGE */}

                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-gray-50">

                        {(
                          matchedVariant?.image ||
                          getImage(item)
                        ) ? (
                          <img
                            src={
                              matchedVariant?.image ||
                              getImage(
                                item
                              )
                            }
                            alt={
                              item?.name ||
                              "Product"
                            }
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <ShoppingBag
                            size={25}
                            className="text-gray-300"
                          />
                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        {/* NAME */}

                        <div className="flex justify-between gap-2">

                          <p className="line-clamp-2 text-sm font-semibold">
                            {item?.name}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              removeFromCart(
                                cartId
                              )
                            }
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X
                              size={16}
                            />
                          </button>

                        </div>

                        {/* PRICE */}

                        <p className="mt-1 text-xs text-gray-500">
                          ৳{" "}
                          {formatPrice(
                            price
                          )}
                        </p>

                        {/* =================================================
                            VARIANTS
                        ================================================= */}

                        {hasVariants && (
                          <div className="mt-3 space-y-2">

                            {/* COLOR */}

                            {options.colors
                              .length >
                              0 && (
                              <div>

                                <label className="mb-1 block text-xs font-medium">
                                  Select Color
                                </label>

                                <select
                                  value={
                                    selected.color
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    changeVariant(
                                      productId,
                                      "color",
                                      e.target
                                        .value
                                    )
                                  }
                                  className="w-full rounded-md border px-2 py-1.5 text-xs"
                                >

                                  <option value="">
                                    Select Color
                                  </option>

                                  {options.colors.map(
                                    (
                                      color
                                    ) => (
                                      <option
                                        key={
                                          color
                                        }
                                        value={
                                          color
                                        }
                                      >
                                        {
                                          color
                                        }
                                      </option>
                                    )
                                  )}

                                </select>

                              </div>
                            )}

                            {/* RAM */}

                            {options.rams
                              .length >
                              0 && (
                              <div>

                                <label className="mb-1 block text-xs font-medium">
                                  Select RAM
                                </label>

                                <select
                                  value={
                                    selected.ram
                                  }
                                  disabled={
                                    options
                                      .colors
                                      .length >
                                      0 &&
                                    !selected.color
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    changeVariant(
                                      productId,
                                      "ram",
                                      e.target
                                        .value
                                    )
                                  }
                                  className="w-full rounded-md border px-2 py-1.5 text-xs disabled:bg-gray-100"
                                >

                                  <option value="">
                                    {options
                                      .colors
                                      .length >
                                      0 &&
                                    !selected.color
                                      ? "Select Color First"
                                      : "Select RAM"}
                                  </option>

                                  {options.rams.map(
                                    (
                                      ram
                                    ) => (
                                      <option
                                        key={
                                          ram
                                        }
                                        value={
                                          ram
                                        }
                                      >
                                        {ram}
                                      </option>
                                    )
                                  )}

                                </select>

                              </div>
                            )}

                            {/* STORAGE */}

                            {options.storages
                              .length >
                              0 && (
                              <div>

                                <label className="mb-1 block text-xs font-medium">
                                  Select Storage
                                </label>

                                <select
                                  value={
                                    selected.storage
                                  }
                                  disabled={
                                    (
                                      options
                                        .colors
                                        .length >
                                        0 &&
                                      !selected.color
                                    ) ||
                                    (
                                      options
                                        .rams
                                        .length >
                                        0 &&
                                      !selected.ram
                                    )
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    changeVariant(
                                      productId,
                                      "storage",
                                      e.target
                                        .value
                                    )
                                  }
                                  className="w-full rounded-md border px-2 py-1.5 text-xs disabled:bg-gray-100"
                                >

                                  <option value="">
                                    Select Storage
                                  </option>

                                  {options.storages.map(
                                    (
                                      storage
                                    ) => (
                                      <option
                                        key={
                                          storage
                                        }
                                        value={
                                          storage
                                        }
                                      >
                                        {
                                          storage
                                        }
                                      </option>
                                    )
                                  )}

                                </select>

                              </div>
                            )}

                          </div>
                        )}

                        {/* =================================================
                            SELECTED VARIANT
                        ================================================= */}

                        {(selected.color ||
                          selected.ram ||
                          selected.storage) && (
                          <div className="mt-2 rounded-md bg-orange-50 px-2 py-1.5 text-[11px] text-orange-700">

                            <b>
                              Selected:
                            </b>{" "}

                            {selected.color &&
                              `Color: ${selected.color}`}

                            {selected.ram &&
                              ` • RAM: ${selected.ram}`}

                            {selected.storage &&
                              ` • Storage: ${selected.storage}`}

                          </div>
                        )}

                        {/* SKU */}

                        {matchedVariant?.sku && (
                          <p className="mt-1 text-[10px] text-gray-400">
                            SKU:{" "}
                            {
                              matchedVariant.sku
                            }
                          </p>
                        )}

                        {/* =================================================
                            VARIANT STATUS
                        ================================================= */}

                        {hasVariants && (
                          <div className="mt-2">

                            {/* NOT COMPLETE */}

                            {!variantStatus.complete && (
                              <p className="rounded-md bg-gray-50 px-2 py-1.5 text-[11px] text-gray-500">
                                <b>
                                  {
                                    variantStatus.message
                                  }
                                </b>
                              </p>
                            )}

                            {/* AVAILABLE */}

                            {variantStatus.complete &&
                              variantStatus.variant &&
                              variantStatus.available && (
                                <p className="rounded-md bg-green-50 px-2 py-1.5 text-[11px] text-green-700">

                                  <b>
                                    ✓ Variant Available
                                  </b>

                                  <span className="ml-2">
                                    Stock:{" "}
                                    {
                                      variantStatus.stock
                                    }
                                  </span>

                                </p>
                              )}

                            {/* COMBINATION NOT FOUND */}

                            {variantStatus.complete &&
                              !variantStatus.variant && (
                                <p className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-600">

                                  <b>
                                    ✕ এই combination-এর variant available নেই।
                                  </b>

                                </p>
                              )}

                            {/* STOCK ZERO */}

                            {variantStatus.complete &&
                              variantStatus.variant &&
                              !variantStatus.available && (
                                <p className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-600">

                                  <b>
                                    ✕ এই selected variant-এর stock শেষ।
                                  </b>

                                </p>
                              )}

                          </div>
                        )}

                        {/* =================================================
                            QUANTITY
                        ================================================= */}

                        <div className="mt-2 flex items-center justify-between">

                          <div className="flex items-center rounded-full border">

                            {/* MINUS */}

                            <button
                              type="button"
                              onClick={() =>
                                decreasePopulation(
                                  cartId
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center"
                            >
                              <Minus
                                size={13}
                              />
                            </button>

                            {/* QUANTITY */}

                            <span className="w-7 text-center text-xs font-semibold">
                              {quantity}
                            </span>

                            {/* PLUS */}

                            <button
                              type="button"
                              onClick={() =>
                                handleIncreaseQuantity(
                                  item,
                                  cartId
                                )
                              }
                              disabled={
                                hasVariants &&
                                (
                                  !variantStatus.available ||
                                  selectedVariantStock <=
                                    quantity
                                )
                              }
                              className="flex h-7 w-7 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus
                                size={13}
                              />
                            </button>

                          </div>

                          <span className="text-sm font-bold">
                            ৳{" "}
                            {formatPrice(
                              itemTotal
                            )}
                          </span>

                        </div>

                      </div>
                    </div>
                  );
                }
              )}

            </div>

            {/* =================================================
                COUPON
            ================================================= */}

            <div>

              <label className="mb-1.5 block text-xs font-semibold">
                Apply Coupon
              </label>

              <div className="flex gap-2">

                <input
                  type="text"
                  name="couponCode"
                  value={
                    formData.couponCode
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Coupon Code"
                  className="w-full rounded-md border px-3 py-2 text-xs"
                />

                <button
                  type="button"
                  onClick={
                    applyCoupon
                  }
                  className="rounded-md bg-black px-4 py-2 text-xs font-medium text-white"
                >
                  Apply
                </button>

              </div>
            </div>

            {/* =================================================
                PRICE
            ================================================= */}

            <div className="space-y-3 border-y py-4 text-sm">

              <div className="flex justify-between">

                <span>
                  Sub Total (
                  {totalItems} items)
                </span>

                <b>
                  ৳{" "}
                  {formatPrice(
                    subTotal
                  )}
                </b>

              </div>

              <div className="flex justify-between">

                <span className="flex items-center gap-1">

                  Delivery

                  <Info
                    size={13}
                    className="text-orange-500"
                  />

                </span>

                <b>
                  ৳{" "}
                  {formatPrice(
                    deliveryCharge
                  )}
                </b>

              </div>

              <div className="flex justify-between">

                <span>
                  Discount
                </span>

                <b className="text-green-600">
                  - ৳{" "}
                  {formatPrice(
                    couponDiscount
                  )}
                </b>

              </div>

            </div>

            {/* TOTAL */}

            <div className="flex justify-between text-lg font-bold">

              <span>
                Total Amount
              </span>

              <span>
                ৳{" "}
                {formatPrice(
                  totalAmount
                )}
              </span>

            </div>

            {/* TERMS */}

            <div className="flex items-start gap-2">

              <input
                type="checkbox"
                id="terms"
                name="termsAgreed"
                checked={
                  formData.termsAgreed
                }
                onChange={
                  handleChange
                }
                className="mt-0.5 accent-orange-500"
              />

              <label
                htmlFor="terms"
                className="text-xs text-gray-600"
              >
                I have read & agree to
                the website{" "}
                <a
                  href="#"
                  className="text-orange-500 underline"
                >
                  Terms and Conditions
                </a>
              </label>

            </div>

            {/* SUBMIT */}

            <button
           
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#f47421] px-4 py-3 text-sm font-bold text-white shadow-md disabled:opacity-50"
            >
              {loading
                ? "Placing Order..."
                : "Confirm & Place Order"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}