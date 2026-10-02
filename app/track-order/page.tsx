"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  product_name: string;
  product_price: number;
  customer_name: string;
  phone: string;
  state: string;
  city: string;
  address: string;
  product_type: string | null;
  color: string | null;
  quantity: number;
  additional_note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

const statuses = [
  {
    key: "pending",
    title: "Order Placed",
    description: "Your order has been received.",
  },
  {
    key: "confirmed",
    title: "Confirmed",
    description: "Your order has been confirmed.",
  },
  {
    key: "processing",
    title: "Processing",
    description: "Your order is being prepared.",
  },
  {
    key: "shipped",
    title: "Shipped",
    description: "Your order is on its way.",
  },
  {
    key: "delivered",
    title: "Delivered",
    description: "Your order has been delivered.",
  },
];

/*
 * Converts Nigerian phone numbers into a consistent format.
 *
 * Examples:
 * 08012345678
 * +2348012345678
 * 2348012345678
 * 080 1234 5678
 * 080-1234-5678
 *
 * all become:
 * 08012345678
 */
function normalizePhone(value: string) {
  let phone = value.trim().replace(/[\s()-]/g, "");

  if (phone.startsWith("+234")) {
    phone = "0" + phone.slice(4);
  } else if (phone.startsWith("234")) {
    phone = "0" + phone.slice(3);
  }

  return phone;
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function searchOrder() {
    if (!orderId.trim() || !phone.trim()) {
      setError("Please enter your order number and phone number.");
      return;
    }

    const numericOrderId = Number(orderId.trim());

    if (!Number.isInteger(numericOrderId)) {
      setError("Please enter a valid order number.");
      return;
    }

    setLoading(true);
    setError("");

    const enteredPhone = normalizePhone(phone);

    /*
     * First try the normalized phone number.
     */
    let result = await supabase
      .from("orders")
      .select("*")
      .eq("id", numericOrderId)
      .eq("phone", enteredPhone)
      .maybeSingle();

    /*
     * If the database contains the phone in another common format,
     * try the original value as well.
     */
    if (!result.data && !result.error && enteredPhone !== phone.trim()) {
      result = await supabase
        .from("orders")
        .select("*")
        .eq("id", numericOrderId)
        .eq("phone", phone.trim())
        .maybeSingle();
    }

    if (result.error) {
      console.error("Order search error:", result.error);
      setError("Something went wrong while checking your order.");
      setOrder(null);
    } else if (!result.data) {
      setError("No order was found with those details.");
      setOrder(null);
    } else {
      setOrder(result.data as Order);
    }

    setLoading(false);
  }

  async function refreshOrder() {
    if (!order) return;

    setRefreshing(true);

    const phoneVariants = [
      order.phone,
      normalizePhone(order.phone),
    ];

    let data: Order | null = null;
    let supabaseError = null;

    for (const phoneValue of [...new Set(phoneVariants)]) {
      const result = await supabase
        .from("orders")
        .select("*")
        .eq("id", order.id)
        .eq("phone", phoneValue)
        .maybeSingle();

      if (result.data) {
        data = result.data as Order;
        break;
      }

      if (result.error) {
        supabaseError = result.error;
      }
    }

    if (supabaseError && !data) {
      console.error("Order refresh error:", supabaseError);
    } else if (data) {
      setOrder(data);
    }

    setRefreshing(false);
  }

  useEffect(() => {
    if (!order) return;

    const interval = window.setInterval(() => {
      refreshOrder();
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [order?.id]);

  function getStatusIndex(status: string) {
    return statuses.findIndex((item) => item.key === status);
  }

  const currentStatusIndex = order
    ? getStatusIndex(order.status)
    : -1;

  const total = order
    ? Number(order.product_price) * order.quantity
    : 0;

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <a
            href="/"
            className="shrink-0 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl"
          >
            Random Picks NG
          </a>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a
              href="/"
              className="text-gray-700 transition hover:text-black"
            >
              Home
            </a>

            <a
              href="/#products"
              className="text-gray-700 transition hover:text-black"
            >
              Products
            </a>

            <a
              href="/track-order"
              className="font-semibold text-black"
            >
              Track Order
            </a>

            <a
              href="/#about"
              className="text-gray-700 transition hover:text-black"
            >
              About
            </a>

            <a
              href="/#products"
              className="rounded-lg bg-black px-5 py-2.5 text-white transition hover:bg-gray-800"
            >
              Shop Now
            </a>
          </div>

          {/* Mobile navigation */}
          <a
            href="/#products"
            className="rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 md:hidden"
          >
            Shop
          </a>
        </div>

        {/* Mobile links */}
        <div className="border-t border-gray-100 px-4 py-3 md:hidden">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
            <a
              href="/"
              className="rounded-lg px-2 py-2 text-gray-600 hover:bg-gray-100"
            >
              Home
            </a>

            <a
              href="/#products"
              className="rounded-lg px-2 py-2 text-gray-600 hover:bg-gray-100"
            >
              Products
            </a>

            <a
              href="/track-order"
              className="rounded-lg bg-gray-100 px-2 py-2 font-semibold text-black"
            >
              Track
            </a>

            <a
              href="/#about"
              className="rounded-lg px-2 py-2 text-gray-600 hover:bg-gray-100"
            >
              About
            </a>
          </div>
        </div>
      </nav>

      {/* Main */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:mb-3 sm:text-sm">
            Order Tracking
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Track Your Order
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base">
            Enter your order number and phone number to see your order status.
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:mt-10 sm:p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchOrder();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Order Number
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g. 12"
                  className="w-full min-w-0 rounded-xl border border-gray-300 px-4 py-3.5 text-base outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  placeholder="Phone number used for order"
                  className="w-full min-w-0 rounded-xl border border-gray-300 px-4 py-3.5 text-base outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-black px-5 py-3.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-5"
            >
              {loading ? "Checking..." : "Track Order"}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Order Result */}
        {order && (
          <div className="mx-auto mt-8 w-full max-w-4xl sm:mt-10">
            {/* Order Header */}
            <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:mb-6 sm:p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Order Number
                </p>

                <p className="text-2xl font-bold">
                  #{order.id}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                {refreshing && (
                  <span className="text-xs text-gray-500">
                    Updating...
                  </span>
                )}

                <span
                  className={`rounded-full px-3 py-2 text-xs font-semibold sm:px-4 sm:text-sm ${
                    order.status === "cancelled"
                      ? "bg-red-100 text-red-700"
                      : order.status === "delivered"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() +
                    order.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Cancelled */}
            {order.status === "cancelled" ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center sm:p-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
                  ×
                </div>

                <h2 className="text-xl font-bold text-red-800">
                  Order Cancelled
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  This order has been cancelled. Please contact Random Picks NG
                  if you have any questions.
                </p>
              </div>
            ) : (
              <>
                {/* Status Timeline */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="mb-7 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold">
                        Order Status
                      </h2>

                      <p className="mt-1 text-sm text-gray-500">
                        Your order status updates automatically.
                      </p>
                    </div>

                    {refreshing && (
                      <div className="text-xs text-gray-400">
                        Checking for updates...
                      </div>
                    )}
                  </div>

                  <div className="space-y-6 sm:space-y-7">
                    {statuses.map((status, index) => {
                      const completed =
                        index <= currentStatusIndex;

                      const active =
                        index === currentStatusIndex;

                      return (
                        <div
                          key={status.key}
                          className="relative flex min-w-0 gap-3 sm:gap-4"
                        >
                          {index !== statuses.length - 1 && (
                            <div
                              className={`absolute left-4 top-9 h-full w-px ${
                                index < currentStatusIndex
                                  ? "bg-black"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}

                          <div
                            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              completed
                                ? "bg-black text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {completed ? "✓" : index + 1}
                          </div>

                          <div className="min-w-0 pt-0.5">
                            <h3
                              className={`font-semibold ${
                                active
                                  ? "text-black"
                                  : completed
                                  ? "text-gray-800"
                                  : "text-gray-400"
                              }`}
                            >
                              {status.title}
                            </h3>

                            <p className="mt-1 text-sm leading-5 text-gray-500">
                              {status.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Product + Delivery */}
                <div className="mt-5 grid gap-5 md:grid-cols-2 md:gap-6">
                  {/* Product Details */}
                  <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                    <h2 className="mb-5 text-xl font-bold">
                      Product Details
                    </h2>

                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-4">
                        <span className="text-gray-500">
                          Product
                        </span>

                        <span className="min-w-0 break-words text-right font-medium">
                          {order.product_name}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">
                          Quantity
                        </span>

                        <span className="font-medium">
                          {order.quantity}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">
                          Unit Price
                        </span>

                        <span className="font-medium">
                          ₦
                          {Number(
                            order.product_price
                          ).toLocaleString()}
                        </span>
                      </div>

                      {order.product_type && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">
                            Type
                          </span>

                          <span className="break-words text-right font-medium">
                            {order.product_type}
                          </span>
                        </div>
                      )}

                      {order.color && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">
                            Color
                          </span>

                          <span className="break-words text-right font-medium">
                            {order.color}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between gap-4">
                          <span className="font-semibold">
                            Total
                          </span>

                          <span className="text-lg font-bold">
                            ₦{total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                    <h2 className="mb-5 text-xl font-bold">
                      Delivery Information
                    </h2>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-gray-500">
                          Customer
                        </p>

                        <p className="mt-1 break-words font-medium">
                          {order.customer_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Phone
                        </p>

                        <p className="mt-1 break-words font-medium">
                          {order.phone}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Location
                        </p>

                        <p className="mt-1 break-words font-medium">
                          {order.city}, {order.state}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Address
                        </p>

                        <p className="mt-1 break-words font-medium">
                          {order.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Dates */}
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:mt-6 sm:p-5">
                  <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <span className="text-gray-500">
                      Order placed
                    </span>

                    <span className="break-words font-medium sm:text-right">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <span className="text-gray-500">
                      Last updated
                    </span>

                    <span className="break-words font-medium sm:text-right">
                      {new Date(order.updated_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setOrder(null);
                setError("");
                setOrderId("");
                setPhone("");
              }}
              className="mt-5 w-full rounded-xl border border-gray-300 px-5 py-3.5 font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Track Another Order
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-8">
          <div className="flex flex-col gap-2 text-center text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <p>
              © {new Date().getFullYear()} Random Picks NG. All rights reserved.
            </p>

            <p>
              Shop smarter. Pick randomly. Love your choice.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}