
"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import useStore from "../../Store/store"; // তোমার path অনুযায়ী ঠিক করবে

function PaymentResultContent() {
  const params = useSearchParams();

  const status = params.get("status");
  const orderId = params.get("orderId");

  const clearCart = useStore((s) => s.clearCart);

  useEffect(() => {
    if (status === "success" || status === "partial") {
      clearCart?.();
    }
  }, [status, clearCart]);

  const title =
    status === "success"
      ? "Payment Successful"
      : status === "partial"
        ? "Partial Payment Received"
        : status === "failed"
          ? "Payment Failed"
          : status === "cancelled"
            ? "Payment Cancelled"
            : "Payment Under Review";

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>

      {orderId && (
        <p className="mt-2 text-sm text-gray-600">
          Order ID: {orderId}
        </p>
      )}

      <div className="mt-6 flex justify-center gap-3">
        {orderId && (
          <Link
            href={`/invoice/${encodeURIComponent(orderId)}`}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white"
          >
            View Invoice
          </Link>
        )}

        <Link
          href="/"
          className="rounded-lg border px-4 py-2"
        >
          Home
        </Link>
      </div>
    </main>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-gray-600">Loading payment result...</p>
        </main>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
