"use client";

import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import useStore from "../Store/store";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

export default function CheckoutPage() {
  const {
    cart,
    increasePopulation,
    decreasePopulation,
    removeFromCart,
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

  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ==========================================
  // IMAGE
  // ==========================================

  const getImage = (item) => {
    if (Array.isArray(item.images) && item.images.length > 0) {
      return item.images[0];
    }

    if (item.image) {
      return item.image;
    }

    return "";
  };

  // ==========================================
  // PRICE
  // ==========================================

  const getPrice = (item) => {
    return Number(
      item.discountPrice ||
        item.price ||
        0
    );
  };

  // ==========================================
  // TOTAL ITEMS
  // ==========================================

  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 1),
      0
    );
  }, [cart]);

  // ==========================================
  // SUB TOTAL
  // ==========================================

  const subTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = getPrice(item);
      const quantity = Number(item.quantity || 1);

      return total + price * quantity;
    }, 0);
  }, [cart]);

  // ==========================================
  // DELIVERY
  // ==========================================

  const deliveryCharge = useMemo(() => {
    if (formData.deliveryMethod === "shop_pickup") {
      return 0;
    }

    if (formData.selectArea === "Dhaka Inside") {
      return 80;
    }

    if (formData.selectArea === "Dhaka Outside") {
      return 150;
    }

    return 0;
  }, [
    formData.deliveryMethod,
    formData.selectArea,
  ]);

  // ==========================================
  // TOTAL
  // ==========================================

  const totalAmount = Math.max(
    0,
    subTotal +
      deliveryCharge -
      couponDiscount
  );

  // ==========================================
  // PRICE FORMAT
  // ==========================================

  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("en-BD");
  };

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ==========================================
  // COUPON
  // ==========================================

  const applyCoupon = () => {
    const code = formData.couponCode
      .trim()
      .toUpperCase();

    if (!code) {
      setCouponDiscount(0);
      return;
    }

    if (code === "SAVE500") {
      setCouponDiscount(
        Math.min(500, subTotal)
      );

      alert("Coupon applied successfully!");
      return;
    }

    setCouponDiscount(0);
    alert("Invalid coupon code");
  };

  // ==========================================
  // SUBMIT ORDER
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (!formData.termsAgreed) {
      alert(
        "You must agree to the Terms and Conditions."
      );
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

    if (!formData.address.trim()) {
      alert("Please enter your delivery address.");
      return;
    }

    setLoading(true);

    // ==========================================
    // CART PRODUCTS
    // ==========================================

    const products = cart.map((item) => ({
      productId:
        item.productId ||
        item._id ||
        item.id,

      name: item.name,

      image: getImage(item),

      price: getPrice(item),

      quantity: Number(
        item.quantity || 1
      ),

      subtotal:
        getPrice(item) *
        Number(item.quantity || 1),

      slug: item.slug || "",
    }));

    // ==========================================
    // ORDER PAYLOAD
    // ==========================================

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

      orderSource: "website",
    };

    console.log(
      "ORDER PAYLOAD:",
      payload
    );

    try {
      const res = await fetch(
        `${API_BASE}/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      console.log(
        "ORDER RESPONSE:",
        data
      );

      if (!res.ok) {
        throw new Error(
          data.message ||
            "Order creation failed"
        );
      }

      if (data.success) {
        alert(
          `Order placed successfully!\nOrder ID: ${
            data.data?.orderId ||
            data.orderId ||
            "Created"
          }`
        );

        // এখানে তোমার store-এর clear cart function
        // থাকলে সেটি call করবে।

        // Example:
        // clearCart();

        window.location.href = "/";
      } else {
        alert(
          data.message ||
            "Something went wrong!"
        );
      }
    } catch (error) {
      console.error(
        "ORDER ERROR:",
        error
      );

      alert(
        error.message ||
          "Failed to place order!"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // EMPTY CART
  // ==========================================

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-950">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm dark:bg-slate-900">

            <ShoppingBag
              size={50}
              className="mx-auto mb-5 text-[#f47421]"
            />

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Cart is Empty
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Please add some products before checkout.
            </p>

            <Link
              href="/"
              prefetch={false}
              className="mt-6 inline-flex rounded-full bg-[#f47421] px-8 py-3 text-sm font-bold text-white hover:bg-[#e06211]"
            >
              Continue Shopping
            </Link>

          </div>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-8 font-sans text-gray-800 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-[1440px] space-y-6">

        {/* HEADER */}

        <div className="flex items-center gap-3">

          <Link
            href="/cart"
            prefetch={false}
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
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

          {formData.paymentMethod ===
            "online_payment" ||
          formData.paymentMethod ===
            "partial_payment" ? (
            <span>
              অ্যাডভান্স পেমেন্ট করার আগে
              আপনার কাঙ্ক্ষিত পণ্যটি আমাদের
              স্টকে আছে কি না কাস্টমার সার্ভিস
              প্রতিনিধির সাথে কনফার্ম করে নিন।
              <span className="font-semibold">
                {" "}09678148148
              </span>
            </span>
          ) : (
            <span>
              অর্ডার সংক্রান্ত যেকোনো প্রয়োজনে
              আমাদের কাস্টমার সার্ভিস প্রতিনিধির
              সাথে কথা বলুন -
              <span className="font-semibold">
                {" "}09678148148
              </span>
            </span>
          )}

        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12"
        >

          {/* ======================================
              LEFT
          ====================================== */}

          <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-7">

            {/* DELIVERY INFORMATION */}

            <div>

              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Delivery Information
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* NAME */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Full Name{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500"
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
                    placeholder="Enter Email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Phone Number{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <div className="flex">

                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                      +88
                    </span>

                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="01XXXXXXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-r-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500"
                    />

                  </div>
                </div>

                {/* AREA */}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Select Area{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="selectArea"
                    required
                    value={formData.selectArea}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">
                      Select delivery area
                    </option>

                    <option value="Dhaka Inside">
                      Inside Dhaka
                    </option>

                    <option value="Dhaka Outside">
                      Outside Dhaka
                    </option>
                  </select>
                </div>

                {/* ADDRESS */}

                <div className="sm:col-span-2">

                  <label className="mb-1 block text-sm font-medium">
                    Address{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="address"
                    required
                    placeholder="House# 123, Road# 24, ABC Road"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500"
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
                    placeholder="Any special delivery instructions..."
                    value={formData.note}
                    onChange={handleChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-orange-500"
                  />

                </div>

              </div>

            </div>

            {/* PAYMENT */}

            <div>

              <h2 className="mb-3 text-lg font-semibold">
                Payment Method
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

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

                  const isSelected =
                    formData.paymentMethod ===
                    item.id;

                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition ${
                        isSelected
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >

                      <Icon
                        size={20}
                        className={
                          isSelected
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
                        value={item.id}
                        checked={isSelected}
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

              <h2 className="mb-3 text-lg font-semibold">
                Delivery Method
              </h2>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

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

                  const isSelected =
                    formData.deliveryMethod ===
                    item.id;

                  return (
                    <label
                      key={item.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition ${
                        isSelected
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >

                      <Icon
                        size={20}
                        className={
                          isSelected
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
                        value={item.id}
                        checked={isSelected}
                        onChange={handleChange}
                        className="ml-auto accent-orange-500"
                      />

                    </label>
                  );
                })}

              </div>

            </div>

          </div>

          {/* ======================================
              RIGHT SIDE
          ====================================== */}

          <div className="h-fit space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-5">

            <h2 className="text-lg font-semibold">
              Order Summary
            </h2>

            {/* CART PRODUCTS */}

            <div className="space-y-4">

              {cart.map((item) => {

                const price =
                  getPrice(item);

                const quantity =
                  Number(
                    item.quantity || 1
                  );

                const itemTotal =
                  price * quantity;

                const image =
                  getImage(item);

                return (
                  <div
                    key={item.id}
                    className="flex gap-3 border-b border-gray-100 pb-4"
                  >

                    {/* IMAGE */}

                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                      {image ? (
                        <img
                          src={image}
                          alt={
                            item.name ||
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

                    {/* INFO */}

                    <div className="min-w-0 flex-1">

                      <div className="flex justify-between gap-2">

                        <p className="line-clamp-2 text-sm font-semibold text-gray-800">
                          {item.name}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                          className="shrink-0 text-gray-400 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>

                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        ৳ {formatPrice(price)}
                      </p>

                      {/* QUANTITY */}

                      <div className="mt-2 flex items-center justify-between">

                        <div className="flex items-center rounded-full border border-gray-200">

                          <button
                            type="button"
                            onClick={() =>
                              decreasePopulation(
                                item.id
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center"
                          >
                            <Minus size={13} />
                          </button>

                          <span className="w-7 text-center text-xs font-semibold">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increasePopulation(
                                item.id
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center"
                          >
                            <Plus size={13} />
                          </button>

                        </div>

                        <span className="text-sm font-bold">
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

              <label className="mb-1.5 block text-xs font-semibold">
                Apply Coupon
              </label>

              <div className="flex gap-2">

                <input
                  type="text"
                  name="couponCode"
                  placeholder="Coupon Code"
                  value={formData.couponCode}
                  onChange={handleChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                />

                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-md bg-black px-4 py-2 text-xs font-medium text-white hover:bg-gray-800"
                >
                  Apply
                </button>

              </div>

            </div>

            {/* PRICE */}

            <div className="space-y-3 border-y border-gray-100 py-4 text-sm">

              <div className="flex justify-between">

                <span className="text-gray-600">
                  Sub Total ({totalItems} items)
                </span>

                <span className="font-semibold">
                  ৳ {formatPrice(subTotal)}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="flex items-center gap-1 text-gray-600">
                  Delivery
                  <Info
                    size={13}
                    className="text-orange-500"
                  />
                </span>

                <span className="font-semibold">
                  {deliveryCharge > 0
                    ? `৳ ${formatPrice(
                        deliveryCharge
                      )}`
                    : "৳ 0"}
                </span>

              </div>

              <div className="flex justify-between">

                <span className="text-gray-600">
                  Discount
                </span>

                <span className="font-semibold text-green-600">
                  - ৳{" "}
                  {formatPrice(
                    couponDiscount
                  )}
                </span>

              </div>

            </div>

            {/* TOTAL */}

            <div className="flex justify-between text-lg font-bold">

              <span>
                Total Amount
              </span>

              <span>
                ৳ {formatPrice(totalAmount)}
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
                onChange={handleChange}
                className="mt-0.5 accent-orange-500"
              />

              <label
                htmlFor="terms"
                className="text-xs leading-tight text-gray-600"
              >
                I have read & agree to the website{" "}
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
              className="w-full rounded-lg bg-[#f47421] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#e06912] disabled:cursor-not-allowed disabled:opacity-50"
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