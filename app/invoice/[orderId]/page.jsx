"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  ShoppingBag,
  Package,
  UserRound,
  MapPin,
  CreditCard,
  CalendarDays,
  Receipt,
  LoaderCircle,
  AlertCircle,
  Headphones,
} from "lucide-react";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app".replace(/\/+$/, "");

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return "N/A";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const readable = (value) =>
  String(value || "N/A")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;

    const controller = new AbortController();

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `${API_BASE}/api/orders/order-id/${encodeURIComponent(orderId)}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Invoice could not be loaded.");
        }
        setOrder(result.data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unable to load your invoice.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchOrder();
    return () => controller.abort();
  }, [orderId]);

  // ---------- Loading ----------
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950">
        <LoaderCircle className="h-11 w-11 animate-spin text-orange-500" />
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Preparing your invoice
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Fetching order details…
          </p>
        </div>
      </main>
    );
  }

  // ---------- Error ----------
  if (error || !order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-5 text-center dark:bg-slate-950">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60">
          <AlertCircle size={28} />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Invoice not available
        </h1>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
          {error || "We could not find this order."}
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Back to Home
        </button>
      </main>
    );
  }

  const products = Array.isArray(order.products) ? order.products : [];
  const area =
    typeof order.selectArea === "object"
      ? order.selectArea?.name || order.selectArea?.label || "N/A"
      : order.selectArea || "N/A";

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-6 text-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:px-6 sm:py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        {/* Actions */}
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft size={16} />
            Continue Shopping
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <Download size={16} />
            Print / Save PDF
          </button>
        </div>

        {/* Success banner */}
        <div className="no-print mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
              Order placed successfully
            </p>
            <p className="mt-0.5 text-xs leading-5 text-emerald-800/80 dark:text-emerald-400/90">
              Thank you for your purchase. You can print this invoice or save it as PDF.
            </p>
          </div>
        </div>

        {/* Invoice card */}
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 print:rounded-none print:border-0 print:shadow-none">
          {/* Header */}
          <header className="border-b border-slate-200 px-5 py-6 sm:px-8 dark:border-slate-800 print:px-0 print:py-4">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-white">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                    APPLE GADGET BD
                  </h1>
                  <p className="text-[11px] font-medium tracking-widest text-slate-400">
                    GENUINE PRODUCTS · BEST SERVICE
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Invoice
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {order.orderId || order._id || orderId}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            {/* Status chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                Status: {readable(order.status || "pending")}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Payment: {readable(order.paymentStatus || "unpaid")}
              </span>
            </div>
          </header>

          <div className="space-y-7 px-5 py-6 sm:px-8 print:space-y-5 print:px-0 print:py-4">
            {/* Customer + Payment meta */}
            <section className="grid gap-5 sm:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <UserRound size={16} className="text-orange-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Bill To
                  </h2>
                </div>
                <div className="space-y-1.5 text-sm">
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {order.customerName || "N/A"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {order.phone || "N/A"}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    {order.email || "N/A"}
                  </p>
                  <p className="mt-2 flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                    <span>
                      {order.deliveryAddress || "N/A"}
                      {area !== "N/A" && (
                        <span className="block text-xs text-slate-500">
                          Area: {area}
                        </span>
                      )}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-orange-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Payment
                  </h2>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Method</span>
                    <span className="font-medium capitalize">
                      {readable(order.paymentMethod)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Status</span>
                    <span className="font-medium capitalize">
                      {readable(order.paymentStatus || "unpaid")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-500">Date</span>
                    <span className="font-medium">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Items table */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Package size={16} className="text-orange-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Order Items
                </h2>
                <span className="ml-auto text-xs text-slate-400">
                  {products.length} item{products.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60">
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-3 py-3 text-center font-semibold">Qty</th>
                      <th className="px-3 py-3 font-semibold">Unit</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map((item) => {
                      const quantity = Number(item.quantity || 0);
                      const price = Number(item.price || 0);
                      const subtotal =
                        item.subtotal != null
                          ? Number(item.subtotal)
                          : price * quantity;

                      const variantData =
                        item.variant && typeof item.variant === "object"
                          ? item.variant
                          : item;
                      const variant = [
                        variantData.color,
                        variantData.ram,
                        variantData.storage,
                        variantData.size,
                      ]
                        .filter(Boolean)
                        .join(" / ");

                      return (
                        <tr key={item._id || `${item.productId || item.name}-${index}`}>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {item.name || "Product"}
                            </p>
                            {variant && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {variant}
                              </p>
                            )}
                            {variantData.sku && (
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                SKU: {variantData.sku}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-center font-medium">
                            {quantity}
                          </td>
                          <td className="px-3 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                            {money(price)}
                          </td>
                          <td className="px-4 py-3.5 text-right font-semibold whitespace-nowrap text-slate-900 dark:text-white">
                            {money(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Totals */}
            <section className="flex justify-end">
              <div className="w-full max-w-xs space-y-2.5 text-sm">
                <div className="flex justify-between gap-6">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium">{money(order.subTotal)}</span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-slate-500">Delivery</span>
                  <span className="font-medium">
                    {money(order.deliveryCharge)}
                  </span>
                </div>
                <div className="flex justify-between gap-6">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-emerald-600">
                    − {money(order.discountAmount)}
                  </span>
                </div>
                {order.couponCode && (
                  <div className="flex justify-between gap-6">
                    <span className="text-slate-500">Coupon</span>
                    <span className="font-medium text-orange-500">
                      {order.couponCode}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        Total Payable
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Incl. delivery
                      </p>
                    </div>
                    <p className="text-xl font-bold text-orange-500">
                      {money(order.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Note */}
            {order.note && (
              <section className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                  Order Note
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-800 dark:text-amber-400">
                  {order.note}
                </p>
              </section>
            )}

            {/* Footer */}
            <footer className="border-t border-slate-200 pt-5 text-center dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Thank you for shopping with Apple Gadget BD
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Please keep this invoice for your records.
              </p>
              <p className="mt-2 text-[11px] font-medium text-slate-400">
                Order ID: {order.orderId || order._id || orderId}
              </p>
            </footer>
          </div>
        </article>

        {/* Support */}
        <div className="no-print mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <Headphones size={14} />
          Need help? Contact customer support.
        </div>
      </div>

      {/* Print styles */}
     {/* PRINT & SCREEN HIDE STYLES */}
<style jsx global>{`
  /* সাধারণ স্ক্রিন এবং প্রিন্ট দুটোতেই নেভবার/হেডার পুরোপুরি হাইড করার জন্য */
  header,
  nav,
  .navbar,
  [class*="nav"],
  [class*="header"] {
    display: none !important;
  }

  @media print {
    /* পেজের অপ্রয়োজনীয় বর্ডার ও ব্যাকগ্রাউন্ড ফিক্স */
    body {
      background: #fff !important;
      color: #000 !important;
      margin: 0 !important;
      padding: 0 !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    /* নেভবার, সার্চবার এবং অপ্রয়োজনীয় বাটন প্রিন্টে পুরোপুরি বাদ যাবে */
    header,
    nav,
    form,
    input,
    .no-print {
      display: none !important;
      visibility: hidden !important;
    }

    /* শুধু ইনভয়েস কার্ডটি ফুল-উইডথ ও মার্জিন ফ্রি দেখাবে */
    article {
      border: none !important;
      box-shadow: none !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    a {
      text-decoration: none !important;
    }
  }
`}</style>
    </main>
  );
}