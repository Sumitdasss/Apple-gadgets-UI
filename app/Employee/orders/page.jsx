/* eslint-disable react-hooks/set-state-in-effect */
"use client";

// Place this file at:  app/employee/orders/page.jsx

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Truck,
  X,
  XCircle,
  Wallet,
} from "lucide-react";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";
const ME_API = `${API_BASE}/api/users/me`;
const MY_ORDERS_API = `${API_BASE}/api/dashboard/my-orders`;
const statusApi = (id) =>
  `${API_BASE}/api/dashboard/${encodeURIComponent(id)}/status`;

const PAGE_SIZE = 10;

/* Must match the deliveryStatus enum + transitions in the backend */
const STATUS_META = {
  assigned: { label: "Assigned", icon: PackageCheck, cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-400/20" },
  picked_up: { label: "Picked up", icon: Package, cls: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-400/20" },
  in_transit: { label: "In transit", icon: Navigation, cls: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-400/20" },
  delivered: { label: "Delivered", icon: CheckCircle2, cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-400/20" },
  failed: { label: "Failed", icon: AlertTriangle, cls: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-400/20" },
  returned: { label: "Returned", icon: RotateCcw, cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-400/20" },
  cancelled: { label: "Cancelled", icon: XCircle, cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-400/20" },
  unassigned: { label: "Unassigned", icon: Clock3, cls: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10" },
};

const TABS = [
  { key: "all", label: "All" },
  { key: "assigned", label: "New" },
  { key: "picked_up", label: "Picked up" },
  { key: "in_transit", label: "In transit" },
  { key: "delivered", label: "Delivered" },
  { key: "failed", label: "Failed" },
  { key: "returned", label: "Returned" },
  { key: "cancelled", label: "Cancelled" },
];

/* current status -> allowed next statuses (mirrors backend `transitions`) */
const NEXT_ACTIONS = {
  assigned: ["picked_up", "failed", "cancelled"],
  picked_up: ["in_transit", "delivered", "failed"],
  in_transit: ["delivered", "failed", "returned"],
  failed: ["returned"],
};

const ACTION_META = {
  picked_up: { label: "Mark picked up", cls: "bg-indigo-600 hover:bg-indigo-700 text-white" },
  in_transit: { label: "Start delivery", cls: "bg-cyan-600 hover:bg-cyan-700 text-white" },
  delivered: { label: "Mark delivered", cls: "bg-emerald-600 hover:bg-emerald-700 text-white" },
  failed: { label: "Delivery failed", cls: "border border-orange-300 text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-500/10" },
  returned: { label: "Mark returned", cls: "border border-amber-300 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-500/10" },
  cancelled: { label: "Cancel", cls: "border border-red-300 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10" },
};

const NOTE_RECOMMENDED = ["failed", "returned", "cancelled"];

const money = (v) => `৳${Number(v || 0).toLocaleString("en-BD")}`;

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-BD", { dateStyle: "medium", timeStyle: "short" });
};

const humanize = (v) =>
  String(v || "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  let response;
  try {
    response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError("Server-এর সঙ্গে সংযোগ করা যাচ্ছে না।", 0);
  }

  let result = {};
  try {
    result = await response.json();
  } catch {
    /* non-JSON */
  }

  if (!response.ok || result.success === false) {
    throw new ApiError(
      result.message || `Request failed (${response.status})`,
      response.status,
    );
  }
  return result;
}

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.unassigned;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${meta.cls}`}
    >
      <Icon size={13} />
      {meta.label}
    </span>
  );
}

function OrderCard({ order, onAction }) {
  const status = order.deliveryStatus || "assigned";
  const actions = NEXT_ACTIONS[status] || [];
  const customer = order.customer && typeof order.customer === "object" ? order.customer : {};
  const name = order.customerName || customer.name || "Customer";
  const phone = order.phone || customer.phone || "";
  const products = Array.isArray(order.products) ? order.products : [];

  const isCod =
    /cod|cash/i.test(String(order.paymentMethod || "")) &&
    order.paymentStatus !== "paid";

  const history = Array.isArray(order.deliveryHistory)
    ? [...order.deliveryHistory].reverse().slice(0, 3)
    : [];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Order
          </p>
          <p className="text-sm font-extrabold">{order.orderId || order._id}</p>
        </div>
        <StatusPill status={status} />
      </header>

      <div className="grid gap-4 p-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-3">
          <div>
            <p className="text-base font-extrabold">{name}</p>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"
              >
                <Phone size={13} />
                {phone}
              </a>
            )}
          </div>

          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="break-words">{order.deliveryAddress || "Address not available"}</span>
          </div>

          {products.length > 0 && (
            <ul className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-xs dark:bg-white/[0.03]">
              {products.map((p, i) => (
                <li key={p._id || i} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">
                    {p.name || p.product?.name || "Product"}
                    {[p.color, p.ram, p.storage].filter(Boolean).length > 0 &&
                      ` (${[p.color, p.ram, p.storage].filter(Boolean).join("/")})`}
                  </span>
                  <span className="shrink-0 text-slate-500">× {p.quantity ?? 1}</span>
                </li>
              ))}
            </ul>
          )}

          {order.deliveryNote && (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
              <span className="font-bold">Note: </span>
              {order.deliveryNote}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div
            className={`rounded-xl p-3.5 ${
              isCod
                ? "bg-orange-50 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:ring-orange-400/20"
                : "bg-slate-50 dark:bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Wallet size={12} />
              {isCod ? "Collect from customer" : "Order total"}
            </div>
            <p className="mt-1 text-2xl font-black tracking-tight">{money(order.totalAmount)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {humanize(order.paymentMethod)} · {humanize(order.paymentStatus || "unpaid")}
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Assigned: <span className="font-semibold">{fmtDate(order.assignedAt)}</span>
          </p>

          {history.length > 0 && (
            <ol className="space-y-1.5 border-l-2 border-slate-200 pl-3 dark:border-white/10">
              {history.map((h, i) => (
                <li key={h._id || i} className="text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {humanize(h.status)}
                  </span>{" "}
                  · {fmtDate(h.updatedAt)}
                  {h.note ? <span className="block">{h.note}</span> : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {actions.length > 0 ? (
        <footer className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.02]">
          {actions.map((next) => (
            <button
              key={next}
              type="button"
              onClick={() => onAction(order, next)}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${ACTION_META[next].cls}`}
            >
              {ACTION_META[next].label}
            </button>
          ))}
        </footer>
      ) : (
        <footer className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-medium text-slate-400 dark:border-white/[0.06] dark:bg-white/[0.02]">
          এই অর্ডারে আর কোনো action নেই।
        </footer>
      )}
    </article>
  );
}

export default function EmployeeOrdersPage() {
  const [authState, setAuthState] = useState("loading"); // loading | guest | denied | ok
  const [user, setUser] = useState(null);

  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [confirm, setConfirm] = useState(null); // { order, status }
  const [note, setNote] = useState("");

  const requestRef = useRef(0);

  /* ---- read ?status= from the header dropdown links ---- */
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s && TABS.some((t) => t.key === s)) setTab(s);
  }, []);

  /* ---- auth / role check ---- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!localStorage.getItem("token")) {
        setAuthState("guest");
        return;
      }
      try {
        const result = await authFetch(ME_API);
       const me =
  result?.data?.user ??
  result?.data?.data?.user ??
  result?.data ??
  result?.user ??
  null;
        if (cancelled) return;
        setUser(me || null);
   const role = String(me?.role || "").trim().toLowerCase();
console.log("Employee login user:", me);
setAuthState(role === "employee" ? "ok" : "denied");
      } catch (err) {
        if (cancelled) return;
        if (err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuthState("guest");
        } else {
          setAuthState("denied");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- load orders ---- */
  const loadOrders = useCallback(async () => {
    const id = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (tab !== "all") params.set("status", tab);

      const result = await authFetch(`${MY_ORDERS_API}?${params}`);
      if (id !== requestRef.current) return;

      setOrders(Array.isArray(result.data) ? result.data : []);
      setPagination({
        total: Number(result.pagination?.total ?? 0),
        totalPages: Math.max(1, Number(result.pagination?.totalPages ?? 1)),
      });
    } catch (err) {
      if (id !== requestRef.current) return;
      setError(err.message || "অর্ডার লোড করা যায়নি।");
      setOrders([]);
    } finally {
      if (id === requestRef.current) setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => {
    if (authState === "ok") loadOrders();
  }, [authState, loadOrders]);

  /* ---- status update ---- */
  const openConfirm = (order, status) => {
    setConfirm({ order, status });
    setNote("");
    setError("");
  };

  const submitStatus = async () => {
    if (!confirm) return;
    setBusy(true);
    setError("");
    try {
      const result = await authFetch(statusApi(confirm.order._id), {
        method: "PATCH",
        body: JSON.stringify({ status: confirm.status, note: note.trim() }),
      });
      setNotice(result.message || "স্ট্যাটাস আপডেট হয়েছে।");
      setConfirm(null);
      await loadOrders();
    } catch (err) {
      setError(err.message || "স্ট্যাটাস আপডেট করা যায়নি।");
    } finally {
      setBusy(false);
    }
  };

  const changeTab = (key) => {
    setTab(key);
    setPage(1);
    setNotice("");
    window.history.replaceState(
      null,
      "",
      key === "all" ? "/employee/orders" : `/employee/orders?status=${key}`,
    );
  };

  /* ---- guards ---- */
  if (authState === "loading") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <RefreshCw className="animate-spin text-slate-400" size={28} />
      </main>
    );
  }

  if (authState !== "ok") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#E96B32] dark:bg-orange-500/10">
          <ShieldAlert size={30} />
        </span>
        <h1 className="text-xl font-extrabold">
          {authState === "guest" ? "Please sign in" : "Employee access only"}
        </h1>
        <p className="text-sm text-slate-500">
          {authState === "guest"
            ? "এই পেজ দেখতে employee account দিয়ে লগইন করো।"
            : "তোমার account-এ employee permission নেই।"}
        </p>
        <Link
          href={authState === "guest" ? "/Auth" : "/"}
          className="rounded-xl bg-[#E96B32] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#CF5421]"
        >
          {authState === "guest" ? "Sign in" : "Go home"}
        </Link>
      </main>
    );
  }

  const confirmMeta = confirm ? ACTION_META[confirm.status] : null;

  return (
    <main className="mx-auto max-w-360 space-y-5 px-3 py-6 sm:px-6">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25">
            <Truck size={22} />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">My Deliveries</h1>
            <p className="text-sm text-slate-500">
              স্বাগতম, {user?.name || "Employee"} · মোট{" "}
              <span className="font-bold text-slate-800 dark:text-white">{pagination.total}</span> টি অর্ডার
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04]"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      {/* Tabs */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => changeTab(t.key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
              tab === t.key
                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && !confirm && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-400/20 dark:bg-green-500/10 dark:text-green-300">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Orders */}
      {loading && orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-slate-500">
          <RefreshCw size={26} className="animate-spin" />
          <span className="text-sm font-medium">অর্ডার লোড হচ্ছে...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 py-20 text-slate-400 dark:border-white/10">
          <Package size={34} />
          <span className="text-sm font-medium">কোনো অর্ডার পাওয়া যায়নি।</span>
        </div>
      ) : (
        <div className={`space-y-4 transition ${loading ? "opacity-60" : ""}`}>
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} onAction={openConfirm} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span className="text-sm font-medium text-slate-500">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-40 dark:border-white/10"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Confirm sheet */}
      {confirm && (
        <div className="fixed inset-0 z-[100000] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => !busy && setConfirm(null)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-[#111113] sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5 dark:border-white/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {confirm.order.orderId || confirm.order._id}
                </p>
                <h3 className="mt-1 text-lg font-extrabold">{confirmMeta.label}?</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {humanize(confirm.order.deliveryStatus)} → {humanize(confirm.status)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setConfirm(null)}
                aria-label="Close"
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">
                  Note {NOTE_RECOMMENDED.includes(confirm.status) ? "(কারণ লিখলে ভালো)" : "(optional)"}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  disabled={busy}
                  placeholder="যেমন: Customer phone ধরেনি / ঠিকানা ভুল..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/[0.04]"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirm(null)}
                  disabled={busy}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitStatus}
                  disabled={busy}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
