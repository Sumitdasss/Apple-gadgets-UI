"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Truck,
  PackageCheck,
  Navigation,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const ITEMS = [
  {
    href: "/employee/orders",
    label: "All my deliveries",
    icon: Truck,
  },
  {
    href: "/employee/orders?status=assigned",
    label: "New assigned",
    icon: PackageCheck,
  },
  {
    href: "/employee/orders?status=in_transit",
    label: "On the way",
    icon: Navigation,
  },
  {
    href: "/employee/orders?status=delivered",
    label: "Delivered",
    icon: CheckCircle2,
  },
  {
    href: "/employee/orders?status=failed",
    label: "Failed / issues",
    icon: AlertTriangle,
  },
];

/**
 * Shows only when the logged-in user's role is "employee".
 * variant="desktop"  -> dropdown button for the header nav
 * variant="mobile"   -> expanded link list for the mobile drawer
 */
export default function EmployeeMenu({
  user,
  onNavigate,
  variant = "desktop",
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (user?.role !== "employee") return null;

  const handleNavigate = () => {
    setOpen(false);
    onNavigate?.();
  };

  if (variant === "mobile") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/10">
        <div className="mb-2 flex items-center gap-2 px-1">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Truck size={15} />
          </span>
          <h3 className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
            Employee panel
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              onClick={handleNavigate}
              className="flex min-h-[43px] items-center gap-2 rounded-xl border border-emerald-200/70 bg-white px-3 py-2.5 text-[12px] font-bold text-[#40516B] transition hover:bg-emerald-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-[#D5DEEB]"
            >
              <Icon size={14} className="shrink-0 text-emerald-600" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        className="flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-[12px] font-extrabold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
      >
        <Truck size={15} />
        <span className="hidden md:inline">Employee</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-[52px] z-[10002] w-[270px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#111113]">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white p-3.5 dark:from-emerald-500/10 dark:to-white/[0.02]">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-600">
              Employee panel
            </p>
            <p className="mt-1 truncate text-sm font-extrabold">
              {user?.name || "Employee"}
            </p>
            <p className="text-[11px] text-[#687991] dark:text-[#AEBACD]">
              Manage your delivery orders
            </p>
          </div>

          <div className="py-2">
            {ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={handleNavigate}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#52627A] transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-[#C0CADA] dark:hover:bg-emerald-500/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 transition group-hover:bg-emerald-100 dark:bg-white/[0.05]">
                  <Icon size={16} />
                </span>
                <span className="flex-1">{label}</span>
                <ChevronRight
                  size={14}
                  className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
                />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
