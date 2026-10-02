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

    const numericOrderId = Number(orderId);

    if (!Number.isInteger(numericOrderId)) {
      setError("Please enter a valid order number.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: supabaseError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", numericOrderId)
      .eq("phone", phone.trim())
      .maybeSingle();

    if (supabaseError) {
      console.error("Order search error:", supabaseError);
      setError("Something went wrong while checking your order.");
      setOrder(null);
    } else if (!data) {
      setError("No order was found with those details.");
      setOrder(null);
    } else {
      setOrder(data as Order);
    }

    setLoading(false);
  }

  async function refreshOrder() {
    if (!order) return;

    setRefreshing(true);

    const { data, error: supabaseError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order.id)
      .eq("phone", order.phone)
      .maybeSingle();

    if (supabaseError) {
      console.error("Order refresh error:", supabaseError);
    } else if (data) {
      setOrder(data as Order);
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
    <main className="min-h-screen bg-white text-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a
            href="/"
            className="text-2xl font-bold tracking-tight text-gray-950"
          >
            Random Picks NG
          </a>

          <div className="flex items-center gap-6 text-sm font-medium">
            <a
              href="/"
              className="text-gray-700 hover:text-black"
            >
              Home
            </a>

            <a
              href="/#products"
              className="text-gray-700 hover:text-black"
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
              className="text-gray-700 hover:text-black"
            >
              About
            </a>

            <a
              href="/#products"
              className="rounded-lg bg-black px-5 py-2.5 text-white hover:bg-gray-800"
            >
              Shop Now
            </a>
          </div>
        </div>
      </nav>

      {/* Main */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gray-500">
            Order Tracking
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Track Your Order
          </h1>

          <p className="mt-4 text-gray-600">
            Enter your order number and phone number to see your
            order status.
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Order Number
              </label>

              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. 12"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone Number
              </label>

              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number used for order"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-black"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={searchOrder}
            disabled={loading}
            className="mt-5 w-full rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Checking..." : "Track Order"}
          </button>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {/* Order Result */}
        {order && (
          <div className="mx-auto mt-10 max-w-4xl">
            {/* Order Header */}
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Order Number
                </p>

                <p className="text-2xl font-bold">
                  #{order.id}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {refreshing && (
                  <span className="text-xs text-gray-500">
                    Updating...
                  </span>
                )}

                <span
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
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
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl text-red-600">
                  ×
                </div>

                <h2 className="text-xl font-bold text-red-800">
                  Order Cancelled
                </h2>

                <p className="mt-2 text-sm text-red-700">
                  This order has been cancelled. Please contact
                  Random Picks NG if you have any questions.
                </p>
              </div>
            ) : (
              <>
                {/* Status Timeline */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-8 flex items-center justify-between">
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

                  <div className="space-y-7">
                    {statuses.map((status, index) => {
                      const completed =
                        index <= currentStatusIndex;

                      const active =
                        index === currentStatusIndex;

                      return (
                        <div
                          key={status.key}
                          className="relative flex gap-4"
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

                          <div className="pt-0.5">
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

                            <p className="mt-1 text-sm text-gray-500">
                              {status.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Product Details */}
                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-xl font-bold">
                      Product Details
                    </h2>

                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500">
                          Product
                        </span>

                        <span className="text-right font-medium">
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

                          <span className="font-medium">
                            {order.product_type}
                          </span>
                        </div>
                      )}

                      {order.color && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-500">
                            Color
                          </span>

                          <span className="font-medium">
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
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-5 text-xl font-bold">
                      Delivery Information
                    </h2>

                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-gray-500">
                          Customer
                        </p>

                        <p className="mt-1 font-medium">
                          {order.customer_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Phone
                        </p>

                        <p className="mt-1 font-medium">
                          {order.phone}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Location
                        </p>

                        <p className="mt-1 font-medium">
                          {order.city}, {order.state}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-500">
                          Address
                        </p>

                        <p className="mt-1 font-medium">
                          {order.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Dates */}
                <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">
                      Order placed
                    </span>

                    <span className="font-medium">
                      {new Date(
                        order.created_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">
                      Last updated
                    </span>

                    <span className="font-medium">
                      {new Date(
                        order.updated_at
                      ).toLocaleString()}
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
              }}
              className="mt-6 w-full rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-800 hover:bg-gray-50"
            >
              Track Another Order
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Random Picks NG.
              All rights reserved.
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
