
/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  X,
  ShoppingBag,
  LoaderCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useStore from "../Store/store";

export default function CartPage() {
  const router = useRouter();

  const {
    cart = [],
    increasePopulation,
    decreasePopulation,
    removeFromCart,
  } = useStore();

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [authChecking, setAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Login check
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace(
        "/Auth?redirect=%2Fcart&message=Auth_required"
      );
      return;
    }

    setIsAuthenticated(true);
    setAuthChecking(false);
  }, [router]);

  // Total items
  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) => total + Number(item.quantity || 1),
      0
    );
  }, [cart]);

  // Subtotal
  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = Number(
        item.discountPrice ?? item.price ?? 0
      );
      const quantity = Number(item.quantity || 1);

      return total + price * quantity;
    }, 0);
  }, [cart]);

  // Coupon
  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();

    if (!code) {
      setDiscount(0);
      alert("Please enter a coupon code.");
      return;
    }

    if (code === "SAVE500") {
      setDiscount(Math.min(500, subtotal));
      alert("Coupon applied successfully!");
      return;
    }

    setDiscount(0);
    alert("Invalid coupon code.");
  };

  // Total amount
  const totalAmount = Math.max(0, subtotal - discount);

  // Price format
  const formatPrice = (price) => {
    return Number(price || 0).toLocaleString("en-BD");
  };

  // Product image
  const getImage = (item) => {
    if (Array.isArray(item?.images) && item.images.length > 0) {
      const firstImage = item.images[0];

      if (typeof firstImage === "string") return firstImage;

      return firstImage?.url || firstImage?.secure_url || "";
    }

    if (typeof item?.image === "string") {
      return item.image;
    }

    return item?.image?.url || "";
  };

  // Loading / redirect screen
  if (authChecking || !isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-gray-600 dark:text-gray-300">
          <LoaderCircle
            size={32}
            className="animate-spin text-[#f47421]"
          />
          <p className="text-sm">Checking login...</p>
        </div>
      </main>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-2xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
              <ShoppingBag
                size={35}
                className="text-[#f47421]"
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Cart
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Your cart is empty
            </p>

            <Link
              href="/"
              prefetch={false}
              className="mt-6 inline-flex rounded-full bg-[#f47421] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#e06211]"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Cart page
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-[1440px]">
        {/* TOP */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Cart
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {totalItems} {totalItems === 1 ? "Item" : "Items"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              cart.forEach((item) => {
                const itemId =
                  item.id ||
                  item._id ||
                  item.productId ||
                  item.product?._id;

                if (itemId) removeFromCart(itemId);
              });
            }}
            className="text-sm font-semibold text-[#f47421] transition hover:text-[#e06211]"
          >
            Clear All
          </button>
        </div>

        {/* CONTENT */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* CART ITEMS */}
          <div className="space-y-4">
            {cart.map((item, index) => {
              const itemId =
                item.id ||
                item._id ||
                item.productId ||
                item.product?._id;

              const price = Number(
                item.discountPrice ?? item.price ?? 0
              );
              const quantity = Number(item.quantity || 1);
              const itemTotal = price * quantity;
              const image = getImage(item);

              return (
                <div
                  key={`${itemId || item.slug || "product"}-${index}`}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex gap-4">
                    {/* PRODUCT IMAGE */}
                    <Link
                      href={`/Product/${item.slug || ""}`}
                      prefetch={false}
                      className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 dark:bg-slate-800"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={item.name || "Product"}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <ShoppingBag
                          size={28}
                          className="text-gray-300 dark:text-gray-600"
                        />
                      )}
                    </Link>

                    {/* PRODUCT INFO */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/Product/${item.slug || ""}`}
                            prefetch={false}
                          >
                            <h2 className="line-clamp-2 text-base font-bold text-gray-900 transition hover:text-[#f47421] dark:text-white">
                              {item.name}
                            </h2>
                          </Link>

                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            ৳ {formatPrice(price)}
                          </p>
                        </div>

                        {/* REMOVE */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(itemId)}
                          aria-label="Remove product"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      {/* BOTTOM */}
                      <div className="mt-5 flex items-center justify-between">
                        {/* QUANTITY */}
                        <div className="flex items-center rounded-full border border-gray-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => decreasePopulation(itemId)}
                            aria-label="Decrease quantity"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => increasePopulation(itemId)}
                            aria-label="Increase quantity"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        {/* ITEM TOTAL */}
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          ৳ {formatPrice(itemTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ORDER SUMMARY */}
          <div className="h-fit rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-5 text-xl font-bold text-gray-900 dark:text-white">
              Order Summary
            </h2>

            {/* COUPON */}
            <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-slate-700 dark:bg-slate-800">
              <input
                type="text"
                value={coupon}
                onChange={(event) => {
                  setCoupon(event.target.value);
                  setDiscount(0);
                }}
                placeholder="Apply Coupon"
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
              />

              <button
                type="button"
                onClick={applyCoupon}
                className="rounded-full bg-gray-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-black dark:bg-white dark:text-gray-900"
              >
                Apply Coupon
              </button>
            </div>

            {/* SUBTOTAL */}
            <div className="mt-5 flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Sub Total ({totalItems} items)</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ৳ {formatPrice(subtotal)}
              </span>
            </div>

            {/* DISCOUNT */}
            <div className="mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Discount</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                ৳ {formatPrice(discount)}
              </span>
            </div>

            <div className="my-4 border-t border-gray-200 dark:border-slate-700" />

            {/* TOTAL */}
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-gray-900 dark:text-white">
                Total Amount
              </span>

              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ৳ {formatPrice(totalAmount)}
              </span>
            </div>

            {/* CONTINUE */}
            <Link
              href="/CheakOut"
              prefetch={false}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-[#f47421] py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#e06211] hover:shadow-md active:scale-[0.98]"
            >
              Continue
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
