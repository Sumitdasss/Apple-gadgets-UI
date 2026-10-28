
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
  MapPin,
  Phone,
  Mail,
  UserRound,
  Hash,
  Clock,
} from "lucide-react";

const API_BASE = "https://apple-gadgets-ui-backend.vercel.app";

/* =====================================================
   GENERAL HELPERS
===================================================== */

const hasValue = (value) => {
  if (value === undefined || value === null) return false;

  if (typeof value === "object") {
    if (Array.isArray(value)) return value.length > 0;
    return Object.keys(value).length > 0;
  }

  return ![
    "",
    "unassigned",
    "assigning",
    "null",
    "undefined",
    "[object object]",
  ].includes(String(value).trim().toLowerCase());
};

const firstValue = (...values) =>
  values.find(hasValue) ?? "";

const formatStatus = (value) =>
  String(value || "Pending").replaceAll("_", " ");

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

const getStatusClass = (status) => {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized.includes("deliver") ||
    normalized.includes("complete") ||
    normalized.includes("paid") ||
    normalized.includes("success")
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("fail") ||
    normalized.includes("return")
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    normalized.includes("ship") ||
    normalized.includes("transit") ||
    normalized.includes("out_for_delivery")
  ) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-amber-100 text-amber-700";
};

const isVisibleHistoryItem = (item) =>
  hasValue(item?.status) &&
  !["unassigned", "assigning"].includes(
    String(item.status).trim().toLowerCase()
  );

/* =====================================================
   PRODUCT HELPERS
===================================================== */

const getProductImage = (product) => {
  const nested = product?.product;

  const firstImage = Array.isArray(product?.images)
    ? product.images[0]
    : null;

  const nestedImage = Array.isArray(nested?.images)
    ? nested.images[0]
    : null;

  const candidates = [
    product?.image,
    product?.productImage,
    typeof firstImage === "string" ? firstImage : firstImage?.url,
    nested?.image,
    typeof nestedImage === "string"
      ? nestedImage
      : nestedImage?.url,
    product?.colorImage,
  ];

  return (
    candidates.find(
      (value) =>
        typeof value === "string" && value.trim().length > 0
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

/* =====================================================
   PERSON HELPERS
===================================================== */

const isObject = (value) =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const getPersonObject = (source, keys) => {
  if (!isObject(source)) return {};

  for (const key of keys) {
    const value = source[key];

    if (isObject(value)) return value;
  }

  return {};
};

const EMPLOYEE_KEYS = [
  "assignedEmployee",
  "assignedEmployeeDetails",
  "employee",
  "employeeDetails",
  "assignedUser",
  "assignedUserDetails",
  "deliveryEmployee",
];

const getEmployee = (source) =>
  getPersonObject(source, EMPLOYEE_KEYS);

const getEmployeeName = (source) => {
  const employee = getEmployee(source);

  return firstValue(
    employee.name,
    employee.fullName,
    employee.username,
    employee.userName,
    employee.employeeName,
    employee.displayName,
    employee.profile?.name,
    source?.assignedEmployeeName,
    source?.employeeName,
    source?.assignedToName
  );
};

const getEmployeePhone = (source) => {
  const employee = getEmployee(source);

  return firstValue(
    employee.phone,
    employee.phoneNumber,
    employee.mobile,
    employee.mobileNumber,
    employee.contactNumber,
    employee.profile?.phone,
    source?.assignedEmployeePhone,
    source?.employeePhone,
    source?.assignedToPhone
  );
};

const getEmployeeEmail = (source) => {
  const employee = getEmployee(source);

  return firstValue(
    employee.email,
    employee.emailAddress,
    source?.assignedEmployeeEmail,
    source?.employeeEmail
  );
};

const getEmployeeAddress = (source) => {
  const employee = getEmployee(source);

  return firstValue(
    employee.address,
    employee.presentAddress,
    employee.employeeAddress,
    source?.assignedEmployeeAddress
  );
};

/* =====================================================
   COURIER / RIDER HELPERS
===================================================== */

const getCourier = (source) => {
  if (!isObject(source)) return {};

  return (
    source.courierDetails ||
    source.courier ||
    source.riderDetails ||
    source.rider ||
    {}
  );
};

const getRiderName = (source) => {
  const courier = getCourier(source);

  return firstValue(
    courier.riderName,
    courier.name,
    courier.fullName,
    source?.riderName
  );
};

const getRiderPhone = (source) => {
  const courier = getCourier(source);

  return firstValue(
    courier.riderPhone,
    courier.phone,
    courier.phoneNumber,
    courier.mobile,
    source?.riderPhone
  );
};

const getRiderEmail = (source) => {
  const courier = getCourier(source);

  return firstValue(
    courier.riderEmail,
    courier.email,
    source?.riderEmail
  );
};

const getRiderAddress = (source) => {
  const courier = getCourier(source);

  return firstValue(
    courier.riderAddress,
    courier.address,
    source?.riderAddress
  );
};

const getCourierProvider = (source) => {
  const courier = getCourier(source);

  return firstValue(
    courier.provider,
    courier.courierProvider,
    source?.courierProvider
  );
};

const getTrackingCode = (source) => {
  const courier = getCourier(source);

  return firstValue(
    courier.trackingCode,
    courier.trackingNumber,
    source?.trackingCode
  );
};

const getConsignmentId = (source) => {
  const courier = getCourier(source);

  return firstValue(
    courier.consignmentId,
    courier.consignmentID,
    source?.consignmentId
  );
};

const hasRiderInfo = (order) =>
  [
    getRiderName(order),
    getRiderPhone(order),
    getRiderEmail(order),
    getRiderAddress(order),
    getCourierProvider(order),
    getTrackingCode(order),
    getConsignmentId(order),
    getCourier(order).courierStatus,
  ].some(hasValue);

const hasEmployeeInfo = (order) =>
  [
    getEmployeeName(order),
    getEmployeePhone(order),
    getEmployeeEmail(order),
    getEmployeeAddress(order),
  ].some(hasValue);

/*
  Priority:
  1. Rider details থাকলে শুধু Rider দেখাবে।
  2. Rider details না থাকলে Employee দেখাবে।
  3. কোনো তথ্য না থাকলে কোনো missing-data message দেখাবে না।
*/
const getDeliveryPersonType = (order) => {
  if (hasRiderInfo(order)) return "rider";
  if (hasEmployeeInfo(order)) return "employee";
  return "none";
};

const getHistoryPersonType = (item, order) => {
  const itemHasRider = hasRiderInfo(item);
  const orderHasRider = hasRiderInfo(order);

  if (itemHasRider || orderHasRider) return "rider";

  if (hasEmployeeInfo(item) || hasEmployeeInfo(order)) {
    return "employee";
  }

  const note = String(item?.note || "").toLowerCase();

  if (note.includes("rider") || note.includes("courier")) {
    return "rider";
  }

  if (
    note.includes("employee") ||
    note.includes("staff")
  ) {
    return "employee";
  }

  return "none";
};

/* =====================================================
   DETAIL COMPONENTS
===================================================== */

function DetailItem({ label, value, icon: Icon }) {
  if (!hasValue(value)) return null;

  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-gray-500">
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        <p className="text-xs">{label}</p>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-gray-900">
        {String(value)}
      </p>
    </div>
  );
}

function PhoneDetail({ label = "Mobile Number", value }) {
  if (!hasValue(value)) return null;

  const phone = String(value);

  return (
    <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-gray-500">
        <Phone className="h-4 w-4 shrink-0" />
        <p className="text-xs">{label}</p>
      </div>

      <a
        href={`tel:${phone.replace(/[^\d+]/g, "")}`}
        className="mt-2 block break-all text-sm font-semibold text-blue-600 hover:underline"
      >
        {phone}
      </a>
    </div>
  );
}

function EmployeeCard({ order }) {
  const name = getEmployeeName(order);
  const phone = getEmployeePhone(order);
  const email = getEmployeeEmail(order);
  const address = getEmployeeAddress(order);

  if (![name, phone, email, address].some(hasValue)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-900">
        <UserRound className="h-4 w-4" />
        Assigned Employee
      </h4>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem label="Employee Name" value={name} icon={UserRound} />
        <PhoneDetail label="Employee Mobile Number" value={phone} />
        <DetailItem label="Employee Email" value={email} icon={Mail} />
        <DetailItem label="Employee Address" value={address} icon={MapPin} />
      </div>
    </div>
  );
}

function RiderCard({ order }) {
  const courier = getCourier(order);

  return (
    <div className="rounded-xl border border-green-100 bg-green-50/50 p-4">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-green-900">
        <Truck className="h-4 w-4" />
        Courier / Rider Details
      </h4>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem
          label="Rider Name"
          value={getRiderName(order)}
          icon={UserRound}
        />

        <PhoneDetail
          label="Rider Mobile Number"
          value={getRiderPhone(order)}
        />

        <DetailItem
          label="Rider Email"
          value={getRiderEmail(order)}
          icon={Mail}
        />

        <DetailItem
          label="Courier Provider"
          value={getCourierProvider(order)}
          icon={Truck}
        />

        <DetailItem
          label="Tracking Code"
          value={getTrackingCode(order)}
          icon={Hash}
        />

        <DetailItem
          label="Consignment ID"
          value={getConsignmentId(order)}
          icon={Hash}
        />

        <DetailItem
          label="Courier Status"
          value={courier.courierStatus}
          icon={Clock}
        />

        <DetailItem
          label="Rider Address"
          value={getRiderAddress(order)}
          icon={MapPin}
        />
      </div>
    </div>
  );
}

/* =====================================================
   DELIVERY DETAILS
===================================================== */

function DeliveryDetails({ order }) {
  const personType = getDeliveryPersonType(order);

  if (personType === "none") return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Truck className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-900">
            Delivery Details
          </h3>
          <p className="text-xs text-gray-500">
            {personType === "rider"
              ? "Courier / Rider information"
              : "Assigned employee information"}
          </p>
        </div>
      </div>

      {personType === "rider" ? (
        <RiderCard order={order} />
      ) : (
        <EmployeeCard order={order} />
      )}
    </section>
  );
}

/* =====================================================
   DELIVERY HISTORY
===================================================== */

function HistoryPersonDetails({ item, order }) {
  const personType = getHistoryPersonType(item, order);

  if (personType === "none") return null;

  if (personType === "rider") {
    const name = firstValue(getRiderName(item), getRiderName(order));
    const phone = firstValue(getRiderPhone(item), getRiderPhone(order));

    if (![name, phone].some(hasValue)) return null;

    return (
      <div className="mt-3 rounded-lg border border-green-100 bg-green-50 p-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-900">
          <Truck className="h-4 w-4" />
          Rider Details
        </p>

        <DetailItem label="Rider Name" value={name} icon={UserRound} />
        <div className="mt-2">
          <PhoneDetail label="Rider Mobile Number" value={phone} />
        </div>
      </div>
    );
  }

  const name = firstValue(getEmployeeName(item), getEmployeeName(order));
  const phone = firstValue(getEmployeePhone(item), getEmployeePhone(order));

  if (![name, phone].some(hasValue)) return null;

  return (
    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900">
        <UserRound className="h-4 w-4" />
        Assigned Employee
      </p>

      <DetailItem label="Employee Name" value={name} icon={UserRound} />
      <div className="mt-2">
        <PhoneDetail label="Employee Mobile Number" value={phone} />
      </div>
    </div>
  );
}

function DeliveryHistory({ order }) {
  const history = Array.isArray(order.deliveryHistory)
    ? order.deliveryHistory.filter(isVisibleHistoryItem)
    : [];

  if (history.length === 0) return null;

  return (
    <section>
      <h3 className="mb-3 text-base font-bold text-gray-900">
        Delivery History
      </h3>

      <div className="space-y-3">
        {[...history].reverse().map((item, index) => (
          <div
            key={item._id || `${item.status}-${index}`}
            className="rounded-xl border border-gray-100 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(item.status)}`}
              >
                {formatStatus(item.status)}
              </span>

              <span className="text-xs text-gray-500">
                {formatDate(item.updatedAt)}
              </span>
            </div>

            {hasValue(item.note) && (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-700">
                {item.note}
              </p>
            )}

            <HistoryPersonDetails item={item} order={order} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* =====================================================
   MAIN PAGE
===================================================== */

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

      const response = await fetch(
        `${API_BASE}/products/Coustomer-orders`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
        }
      );

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

      setSelectedOrder((previous) => {
        if (!previous) return null;

        return (
          orderList.find(
            (order) =>
              String(order._id) === String(previous._id) ||
              String(order.orderId) === String(previous.orderId)
          ) || previous
        );
      });
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") setSelectedOrder(null);
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedOrder]);

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
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
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
              className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
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

              return (
                <section
                  key={order._id || orderId || orderIndex}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                >
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

                  {hasValue(order.deliveryStatus) && (
                    <div className="px-4 pt-4 sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(order.deliveryStatus)}`}
                      >
                        Delivery: {formatStatus(order.deliveryStatus)}
                      </span>
                    </div>
                  )}

                  <div className="divide-y divide-gray-100 px-4 sm:px-6">
                    {products.length > 0 ? (
                      products.map((product, productIndex) => {
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
                                src={getProductImage(product)}
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

                              {hasValue(product.color) && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Color: {product.color}
                                </p>
                              )}

                              {hasValue(product.ram) && (
                                <p className="mt-1 text-xs text-gray-500">
                                  RAM: {product.ram}
                                </p>
                              )}

                              {hasValue(product.storage) && (
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

                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-4 sm:px-6">
                    <span className="text-sm text-gray-500">
                      Total Amount
                    </span>
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

      {selectedOrder && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            className="relative my-auto flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative z-30 flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-4 sm:px-6">
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

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:p-6">
              <section>
                <h3 className="mb-3 text-base font-bold text-gray-900">
                  Order Information
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Order Status"
                    value={formatStatus(selectedOrder.status)}
                    icon={Package}
                  />
                  <DetailItem
                    label="Payment Status"
                    value={formatStatus(selectedOrder.paymentStatus)}
                    icon={CreditCard}
                  />
                  <DetailItem
                    label="Order Date"
                    value={formatDate(selectedOrder.createdAt)}
                    icon={CalendarDays}
                  />
                  <DetailItem
                    label="Delivery Method"
                    value={selectedOrder.deliveryMethod}
                    icon={Truck}
                  />
                </div>
              </section>

              <section>
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

                            {hasValue(product.color) && (
                              <p className="mt-1 text-xs text-gray-500">
                                Color: {product.color}
                              </p>
                            )}

                            {hasValue(product.ram) && (
                              <p className="mt-1 text-xs text-gray-500">
                                RAM: {product.ram}
                              </p>
                            )}

                            {hasValue(product.storage) && (
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
              </section>

              <DeliveryDetails order={selectedOrder} />

              <DeliveryHistory order={selectedOrder} />

              <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                <span className="text-sm font-medium text-gray-600">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {formatMoney(selectedOrder.totalAmount)}
                </span>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
                <Link
                  href={`/order-tracking?orderId=${encodeURIComponent(
                    selectedOrder.orderId || selectedOrder._id || ""
                  )}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  Track Order
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
