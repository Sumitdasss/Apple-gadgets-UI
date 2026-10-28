/* eslint-disable react-hooks/set-state-in-effect */

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  ShoppingBag,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  X,
  Truck,
  CreditCard,
  CalendarDays,
} from "lucide-react";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("আপনার অর্ডার দেখতে প্রথমে লগইন করুন।");
        return;
      }

      const response = await fetch(`${API_BASE}/products/Coustomer-orders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "অর্ডার লোড করা যায়নি।");
      }

      const data = result.data ?? result;

      const orderList = Array.isArray(data)
        ? data
        : Array.isArray(data.orders)
          ? data.orders
          : Array.isArray(data.data?.orders)
            ? data.data.orders
            : [];

      setOrders(orderList);
    } catch (err) {
      setError(err.message || "কিছু একটা সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!selectedOrder) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedOrder(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedOrder]);

  const getProductImage = (product) => {
    const images = product?.images;
    const nestedProduct = product?.product;

    const firstImage = Array.isArray(images) ? images[0] : null;

    const nestedImages = Array.isArray(nestedProduct?.images)
      ? nestedProduct.images[0]
      : null;

    const candidates = [
      product?.image,
      product?.productImage,
      typeof firstImage === "string" ? firstImage : firstImage?.url,
      nestedProduct?.image,
      typeof nestedImages === "string" ? nestedImages : nestedImages?.url,
      product?.colorImage,
    ];

    return (
      candidates.find(
        (value) => typeof value === "string" && value.trim().length > 0
      ) || "/placeholder-product.png"
    );
  };

  const getProductName = (product) =>
    product?.name ||
    product?.productName ||
    product?.title ||
    product?.product?.name ||
    product?.product?.productName ||
    "Product";

  const getQuantity = (product) =>
    Math.max(1, Number(product?.quantity ?? 1) || 1);

  const formatMoney = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD")}`;

  const formatDate = (value) => {
    if (!value) return "তথ্য নেই";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "তথ্য নেই";

    return date.toLocaleString("en-BD", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatStatus = (value) =>
    String(value || "Pending").replaceAll("_", " ");

  // unassigned / assigning customer UI-তে দেখাবে না
  const isUnassigned = (value) => {
    const s = String(value || "")
      .toLowerCase()
      .trim();
    return !s || s === "unassigned" || s === "assigning";
  };

  const formatCustomerStatus = (value) => {
    if (isUnassigned(value)) return null;
    return formatStatus(value);
  };

  const getStatusClass = (status) => {
    const normalized = String(status || "").toLowerCase();

    if (normalized.includes("deliver") || normalized.includes("complete")) {
      return "bg-green-100 text-green-700";
    }

    if (normalized.includes("cancel") || normalized.includes("fail")) {
      return "bg-red-100 text-red-700";
    }

    if (normalized.includes("ship") || normalized.includes("transit")) {
      return "bg-blue-100 text-blue-700";
    }

    if (normalized.includes("paid") || normalized.includes("success")) {
      return "bg-green-100 text-green-700";
    }

    return "bg-amber-100 text-amber-700";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200" />

          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="mb-5 h-36 animate-pulse rounded-2xl border border-gray-200 bg-white"
            />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-4 h-11 w-11 text-red-500" />

          <h2 className="text-lg font-bold text-gray-900">
            অর্ডার লোড করা যায়নি
          </h2>

          <p className="mt-2 break-words text-sm text-gray-600">{error}</p>

          <button
            type="button"
            onClick={fetchOrders}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <RefreshCw className="h-4 w-4" />
            আবার চেষ্টা করুন
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
            <ShoppingBag className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              My Orders
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              আপনার অর্ডার করা প্রোডাক্টগুলো এখানে দেখুন
            </p>
          </div>
        </div>

        {/* Empty state */}
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white px-5 py-16 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />

            <h2 className="text-lg font-semibold text-gray-900">
              এখনো কোনো অর্ডার নেই
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              আপনি অর্ডার করলে এখানে প্রোডাক্টগুলো দেখতে পাবেন।
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Shopping শুরু করুন
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order, orderIndex) => {
              const orderId = order.orderId || order._id;
              const products = Array.isArray(order.products)
                ? order.products
                : [];
              const deliveryLabel = formatCustomerStatus(order.deliveryStatus);

              return (
                <section
                  key={order._id || orderId || orderIndex}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Order header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        Order ID
                      </p>

                      <p className="mt-1 break-all text-sm font-bold text-gray-900 sm:text-base">
                        {orderId}
                      </p>

                      {order.createdAt && (
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-xs font-semibold text-gray-800 transition hover:border-black hover:bg-black hover:text-white sm:text-sm"
                    >
                      Order Details
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Badges — Unassigned দেখাবে না */}
                  <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-6">
            

                    {deliveryLabel && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
                          order.deliveryStatus
                        )}`}
                      >
                        Delivery: {deliveryLabel}
                      </span>
                    )}

                  </div>

                  {/* Products */}
                  <div className="divide-y divide-gray-100 px-4 sm:px-6">
                    {products.length > 0 ? (
                      products.map((product, productIndex) => {
                        const image = getProductImage(product);
                        const name = getProductName(product);
                        const quantity = getQuantity(product);

                        return (
                          <div
                            key={
                              product._id ||
                              product.variantId ||
                              `${orderId}-${productIndex}`
                            }
                            className="flex items-center gap-4 py-5"
                          >
                            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-24 sm:w-24">
                              <Image
                                src={image}
                                alt={name}
                                fill
                                unoptimized
                                sizes="96px"
                                className="object-contain p-2"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="line-clamp-2 text-sm font-semibold leading-6 text-gray-900 sm:text-base">
                                {name}
                              </h3>

                              {product.color && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Color: {product.color}
                                </p>
                              )}

                              {product.ram && (
                                <p className="mt-1 text-xs text-gray-500">
                                  RAM: {product.ram}
                                </p>
                              )}

                              {product.storage && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Storage: {product.storage}
                                </p>
                              )}

                              <p className="mt-2 text-sm text-gray-500">
                                Quantity:{" "}
                                <span className="font-semibold text-gray-900">
                                  {quantity}
                                </span>
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="py-6 text-sm text-gray-500">
                        এই অর্ডারের প্রোডাক্টের তথ্য পাওয়া যায়নি।
                      </p>
                    )}
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-6">
                    <span className="text-sm text-gray-500">Total Amount</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatMoney(order.totalAmount)}
                    </span>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* =================================================
          ORDER DETAILS POPUP — simple only
      ================================================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[100] top-10 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id="order-modal-title"
                  className="text-lg font-bold text-gray-900 sm:text-xl"
                >
                  Order Details
                </h2>
                <p className="mt-1 break-all text-xs text-gray-500">
                  ID: {selectedOrder.orderId || selectedOrder._id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {/* Simple status cards — NO Unassigned / Delivery Status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Package className="h-4 w-4" />
                    <p className="text-xs">Order Status</p>
                  </div>
                  <p className="mt-2 font-semibold capitalize text-gray-900">
                    {formatStatus(selectedOrder.status)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CreditCard className="h-4 w-4" />
                    <p className="text-xs">Payment Status</p>
                  </div>
                  <p className="mt-2 font-semibold capitalize text-gray-900">
                    {formatStatus(selectedOrder.paymentStatus)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    <p className="text-xs">Order Date</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>

                {selectedOrder.deliveryMethod && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Truck className="h-4 w-4" />
                      <p className="text-xs">Delivery Method</p>
                    </div>
                    <p className="mt-2 font-semibold capitalize text-gray-900">
                      {formatStatus(selectedOrder.deliveryMethod)}
                    </p>
                  </div>
                )}
              </div>

              {/* Products */}
              <div>
                <h3 className="mb-3 text-base font-bold text-gray-900">
                  Ordered Products
                </h3>

                {Array.isArray(selectedOrder.products) &&
                selectedOrder.products.length > 0 ? (
                  <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 px-3">
                    {selectedOrder.products.map((product, index) => {
                      const quantity = getQuantity(product);
                      const price = Number(
                        product.price ?? product.salePrice ?? 0
                      );

                      return (
                        <div
                          key={product._id || index}
                          className="flex items-center gap-3 py-4"
                        >
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                            <Image
                              src={getProductImage(product)}
                              alt={getProductName(product)}
                              fill
                              unoptimized
                              sizes="64px"
                              className="object-contain p-1"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                              {getProductName(product)}
                            </p>

                            {product.color && (
                              <p className="mt-1 text-xs text-gray-500">
                                Color: {product.color}
                              </p>
                            )}

                            {product.ram && (
                              <p className="mt-1 text-xs text-gray-500">
                                RAM: {product.ram}
                              </p>
                            )}

                            {product.storage && (
                              <p className="mt-1 text-xs text-gray-500">
                                Storage: {product.storage}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-gray-500">
                              Quantity: {quantity}
                            </p>
                          </div>

                          {price > 0 && (
                            <p className="shrink-0 text-sm font-semibold text-gray-900">
                              {formatMoney(price * quantity)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                    এই অর্ডারের প্রোডাক্টের তথ্য পাওয়া যায়নি।
                  </p>
                )}
              </div>

              {/* Courier — শুধু থাকলে */}
              {selectedOrder.courierDetails?.provider && (
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs text-gray-500">Courier</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedOrder.courierDetails.provider}
                  </p>

                  {selectedOrder.courierDetails.trackingCode && (
                    <p className="mt-2 break-all text-sm text-gray-600">
                      Tracking Code:{" "}
                      {selectedOrder.courierDetails.trackingCode}
                    </p>
                  )}

                  {selectedOrder.courierDetails.consignmentId && (
                    <p className="mt-1 break-all text-sm text-gray-600">
                      Consignment ID:{" "}
                      {selectedOrder.courierDetails.consignmentId}
                    </p>
                  )}
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <span className="text-sm font-medium text-gray-600">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatMoney(selectedOrder.totalAmount)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
                <Link
                  href={`/order-tracking?orderId=${encodeURIComponent(
                    selectedOrder.orderId || selectedOrder._id || ""
                  )}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Track Order
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}