/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  RefreshCw,
  AlertCircle,
  ClipboardList,
} from "lucide-react";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://apple-gadgets-ui-backend.vercel.app"
).replace(/\/+$/, "");

const API = `${API_BASE}/products`;

const ORDER_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "ready_for_shipment", label: "Ready for Shipment" },
  { key: "handed_over_to_courier", label: "Handed to Courier" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_LABELS = {
  unassigned: "Not Assigned",
  assigned: "Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  failed: "Delivery Failed",
  returned: "Returned",
  cancelled: "Cancelled",
};

function formatStatus(status) {
  if (!status) return "Unknown";
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date) {
  if (!date) return "Not available";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not available";

  return parsed.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function getTrackingToken() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    ""
  );
}

async function apiGet(path) {
  const token = getTrackingToken();

  const response = await fetch(`${API}${path}`, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || result.error || `Request failed (${response.status})`
    );
  }

  return result.data ?? result;
}

function getOrderStatus(order) {
  return order?.status || order?.deliveryStatus || "pending";
}

function getProgress(order) {
  if (
    order?.status === "cancelled" ||
    order?.status === "returned" ||
    order?.deliveryStatus === "failed" ||
    order?.deliveryStatus === "returned"
  ) {
    return -1;
  }

  if (order?.status === "delivered" || order?.deliveryStatus === "delivered") {
    return ORDER_STEPS.length - 1;
  }

  const status = order?.status;

  if (status === "shipped" || order?.deliveryStatus === "in_transit") {
    return 5;
  }

  if (order?.deliveryStatus === "picked_up") {
    return 4;
  }

  const index = ORDER_STEPS.findIndex((step) => step.key === status);
  return index < 0 ? 0 : index;
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
        <Icon className="h-5 w-5 text-gray-700" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-gray-900">
        {value || "Not available"}
      </p>
    </div>
  );
}

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const queryOrderId = searchParams.get("orderId") || "";

  const [orderId, setOrderId] = useState(queryOrderId);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function fetchOrder(id) {
    const cleanId = String(id || "").trim();

    if (!cleanId) {
      setError("Please enter your Order ID.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);
    setSearched(true);

    try {
      const result = await apiGet(`/orders/${encodeURIComponent(cleanId)}`);
      const data = result?.order ?? result;

      if (!data || typeof data !== "object" || !(data.orderId || data._id)) {
        throw new Error(
          "Order data পাওয়া যায়নি। Backend response format যাচাই করো।"
        );
      }

      setOrder(data);
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Order পাওয়া যায়নি। Order ID এবং login status যাচাই করো।"
        )
      );
    } finally {
      setLoading(false);
    }
  }

  // URL থেকে orderId এলে input fill + auto track
  useEffect(() => {
    const id = String(queryOrderId || "").trim();
    if (!id) return;

    setOrderId(id);
    fetchOrder(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryOrderId]);

  async function trackOrder(event) {
    event.preventDefault();
    await fetchOrder(orderId);
  }

  const progress = order ? getProgress(order) : 0;
  const history = Array.isArray(order?.deliveryHistory)
    ? order.deliveryHistory
    : [];
  const courier = order?.courierDetails || {};

  const finalStatus =
    order?.deliveryStatus === "failed" ||
    order?.deliveryStatus === "returned" ||
    order?.status === "cancelled" ||
    order?.status === "returned";

  // Customer-কে Unassigned না দেখানো
  const deliveryLabel = (() => {
    const s = String(order?.deliveryStatus || "").toLowerCase();
    if (!s || s === "unassigned" || s === "assigning") return null;
    return STATUS_LABELS[order.deliveryStatus] || formatStatus(order.deliveryStatus);
  })();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white">
            <Package className="h-8 w-8" />
          </div>

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Apple Gadgets
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            Track Your Order
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
            Enter your order ID to check your order status and delivery
            progress.
          </p>
        </div>

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <form onSubmit={trackOrder}>
            <label
              htmlFor="orderId"
              className="mb-2 block text-sm font-semibold text-gray-800"
            >
              Order ID
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="orderId"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  placeholder="Example: ORD-1791903020498"
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-black focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {loading ? "Tracking..." : "Track Order"}
              </button>
            </div>
          </form>

          {error && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {!order && !loading && !error && !searched && (
            <div className="mt-8 rounded-2xl bg-gray-50 px-5 py-8 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-gray-400" />
              <p className="mt-3 font-semibold text-gray-800">
                Your order updates will appear here
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Use the Order ID from your order confirmation.
              </p>
            </div>
          )}
        </section>

        {order && (
          <div className="mt-6 space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <h2 className="mt-1 break-all text-xl font-bold text-gray-950">
                    {order.orderId || order._id}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-800">
                    {formatStatus(getOrderStatus(order))}
                  </span>
                  {deliveryLabel && (
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800">
                      {deliveryLabel}
                    </span>
                  )}
                </div>
              </div>

              <div className="my-7 border-t border-gray-100" />

              {finalStatus ? (
                <div className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800">
                  This order has a status of{" "}
                  {formatStatus(getOrderStatus(order))}. Please contact
                  customer support if you need assistance.
                </div>
              ) : (
                <div>
                  <h3 className="mb-6 text-lg font-bold text-gray-900">
                    Order Progress
                  </h3>

                  <div className="relative">
                    <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-gray-200 sm:left-5" />

                    {ORDER_STEPS.map((step, index) => {
                      const complete = index <= progress;
                      const current = index === progress;

                      return (
                        <div
                          key={step.key}
                          className="relative flex min-h-[72px] gap-4"
                        >
                          <div
                            className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                              complete
                                ? "border-black bg-black text-white"
                                : "border-gray-300 bg-white text-gray-400"
                            }`}
                          >
                            {complete ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>

                          <div className="pb-5">
                            <p
                              className={`font-semibold ${
                                current ? "text-black" : "text-gray-700"
                              }`}
                            >
                              {step.label}
                              {current && (
                                <span className="ml-2 text-xs font-medium text-blue-700">
                                  Current
                                </span>
                              )}
                            </p>
                            {current && (
                              <p className="mt-1 text-sm text-gray-500">
                                Your order is currently at this stage.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={Package}
                label="Order Status"
                value={formatStatus(order.status)}
              />
              <InfoCard
                icon={Truck}
                label="Delivery Status"
                value={deliveryLabel || "Processing"}
              />
              <InfoCard
                icon={MapPin}
                label="Delivery Method"
                value={formatStatus(order.deliveryMethod)}
              />
              <InfoCard
                icon={ClipboardList}
                label="Last Updated"
                value={formatDate(order.updatedAt)}
              />
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-gray-950">
                Courier Information
              </h3>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Courier Provider</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {courier.provider || "Not assigned yet"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Tracking Code</p>
                  <p className="mt-1 break-all font-semibold text-gray-900">
                    {courier.trackingCode || "Not available yet"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Consignment ID</p>
                  <p className="mt-1 break-all font-semibold text-gray-900">
                    {courier.consignmentId || "Not available yet"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Courier Status</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {courier.courierStatus
                      ? formatStatus(courier.courierStatus)
                      : "No courier update yet"}
                  </p>
                </div>
              </div>

              {order.deliveryNote && (
                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-800">
                    Delivery Note
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {order.deliveryNote}
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
              <h3 className="text-lg font-bold text-gray-950">
                Delivery History
              </h3>

              {history.length === 0 ? (
                <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                  No delivery history has been recorded yet.
                </p>
              ) : (
                <div className="mt-5 space-y-0">
                  {[...history].reverse().map((item, index) => (
                    <div
                      key={item._id || `${item.status}-${index}`}
                      className="relative flex gap-4 pb-6 last:pb-0"
                    >
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <Truck className="h-4 w-4 text-gray-700" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">
                          {formatStatus(item.status)}
                        </p>
                        {item.note && (
                          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                            {item.note}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(item.updatedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        <p className="mt-8 text-center text-xs leading-5 text-gray-500">
          For order assistance, please contact Apple Gadgets customer support.
        </p>
      </div>
    </main>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
        </main>
      }
    >
      <OrderTrackingContent />
    </Suspense>
  );
}