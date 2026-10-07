"use client";

import { useEffect, useState } from "react";

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

    const numericOrderId = Number(orderId.trim());

    if (!Number.isInteger(numericOrderId)) {
      setError("Please enter a valid order number.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: numericOrderId,
          phone: phone.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error || "No order was found with those details."
        );
        return;
      }

      setOrder(result.order as Order);
    } catch (error) {
      console.error("Order search error:", error);
      setError("Something went wrong while checking your order.");
    } finally {
      setLoading(false);
    }
  }

  async function refreshOrder() {
    if (!order) return;

    setRefreshing(true);

    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          phone: order.phone,
        }),
      });

      const result = await response.json();

      if (response.ok && result.order) {
        setOrder(result.order as Order);
      } else if (!response.ok) {
        console.error("Order refresh error:", result.error);
      }
    } catch (error) {
      console.error("Order refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!order) return;

    if (
      order.status === "delivered" ||
      order.status === "cancelled"
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      refreshOrder();
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [order?.id, order?.status]);

  function getStatusIndex(status: string) {
    return statuses.findIndex((item) => item.key === status);
  }

  const currentStatusIndex = order
    ? getStatusIndex(order.status)
    : -1;

  const total = order
    ? Number(order.product_price) * order.quantity
    : 0;

  function resetTracking() {
    setOrder(null);
    setError("");
    setOrderId("");
    setPhone("");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#071a3d]">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <a
            href="/"
            className="flex items-center gap-3 transition hover:opacity-80"
          >
            <img
              src="/rplogo.png"
              alt="Random Picks NG"
              className="h-10 w-10 rounded-full object-cover sm:h-11 sm:w-11"
            />

            <span className="text-xl font-bold tracking-tight text-[#071a3d] sm:text-2xl">
              Random Picks NG
            </span>
          </a>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a
              href="/"
              className="text-gray-700 transition hover:text-[#ff7800]"
            >
              Home
            </a>

            <a
              href="/#products"
              className="text-gray-700 transition hover:text-[#ff7800]"
            >
              Products
            </a>

            <a
              href="/track-order"
              className="font-semibold text-[#ff7800]"
            >
              Track Order
            </a>

            <a
              href="/#about"
              className="text-gray-700 transition hover:text-[#ff7800]"
            >
              About
            </a>

            <a
              href="/#products"
              className="rounded-lg bg-[#071a3d] px-5 py-2.5 text-white transition duration-300 hover:bg-[#ff7800]"
            >
              Shop Now
            </a>
          </div>

          {/* Mobile shop button */}
          <a
            href="/#products"
            className="rounded-lg bg-[#071a3d] px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:bg-[#ff7800] md:hidden"
          >
            Shop
          </a>
        </div>

        {/* Mobile links */}
        <div className="border-t border-gray-100 px-4 py-3 md:hidden">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
            <a
              href="/"
              className="rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-100 hover:text-[#ff7800]"
            >
              Home
            </a>

            <a
              href="/#products"
              className="rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-100 hover:text-[#ff7800]"
            >
              Products
            </a>

            <a
              href="/track-order"
              className="rounded-lg bg-orange-50 px-2 py-2 font-semibold text-[#ff7800]"
            >
              Track
            </a>

            <a
              href="/#about"
              className="rounded-lg px-2 py-2 text-gray-600 transition hover:bg-gray-100 hover:text-[#ff7800]"
            >
              About
            </a>
          </div>
        </div>
      </nav>

      {/* Main */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center animate-[fadeIn_0.6s_ease-out]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff7800] sm:mb-3 sm:text-sm">
            Order Tracking
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#071a3d] sm:text-4xl">
            Track Your Order
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-600 sm:mt-4 sm:text-base">
            Enter your order number and phone number to see your
            order status.
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-[fadeUp_0.6s_ease-out] sm:mt-10 sm:p-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              searchOrder();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <div>
                <label
                  htmlFor="order-number"
                  className="mb-2 block text-sm font-semibold text-[#071a3d]"
                >
                  Order Number
                </label>

                <input
                  id="order-number"
                  name="order-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={orderId}
                  onChange={(event) => {
                    setOrderId(event.target.value);
                    setError("");
                  }}
                  placeholder="e.g. 12"
                  className="w-full min-w-0 rounded-xl border border-gray-300 px-4 py-3.5 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="phone-number"
                  className="mb-2 block text-sm font-semibold text-[#071a3d]"
                >
                  Phone Number
                </label>

                <input
                  id="phone-number"
                  name="phone-number"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setError("");
                  }}
                  placeholder="Phone number used for order"
                  className="w-full min-w-0 rounded-xl border border-gray-300 px-4 py-3.5 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-[#071a3d] px-5 py-3.5 font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7800] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:mt-5"
            >
              {loading ? "Checking..." : "Track Order"}
            </button>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Order Result */}
        {order && (
          <div className="mx-auto mt-8 w-full max-w-4xl animate-[fadeUp_0.5s_ease-out] sm:mt-10">
            {/* Order Header */}
            <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:mb-6 sm:p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Order Number
                </p>

                <p className="mt-1 text-2xl font-bold text-[#071a3d]">
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
                      : "bg-orange-50 text-[#ff7800]"
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
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600">
                  ×
                </div>

                <h2 className="text-xl font-bold text-red-800">
                  Order Cancelled
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  This order has been cancelled. Please contact
                  Random Picks NG if you have any questions.
                </p>
              </div>
            ) : (
              <>
                {/* Status Timeline */}
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                  <div className="mb-7 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[#071a3d]">
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
                                  ? "bg-[#ff7800]"
                                  : "bg-gray-200"
                              }`}
                            />
                          )}

                          <div
                            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition duration-300 ${
                              completed
                                ? "bg-[#071a3d] text-white"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {completed ? "✓" : index + 1}
                          </div>

                          <div className="min-w-0 pt-0.5">
                            <h3
                              className={`font-semibold ${
                                active
                                  ? "text-[#ff7800]"
                                  : completed
                                  ? "text-[#071a3d]"
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
                    <h2 className="mb-5 text-xl font-bold text-[#071a3d]">
                      Product Details
                    </h2>

                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-4">
                        <span className="text-gray-500">
                          Product
                        </span>

                        <span className="min-w-0 break-words text-right font-medium text-[#071a3d]">
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
                          <span className="font-semibold text-[#071a3d]">
                            Total
                          </span>

                          <span className="text-lg font-bold text-[#ff7800]">
                            ₦{total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information */}
                  <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
                    <h2 className="mb-5 text-xl font-bold text-[#071a3d]">
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
                      {new Date(
                        order.created_at
                      ).toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <span className="text-gray-500">
                      Last updated
                    </span>

                    <span className="break-words font-medium sm:text-right">
                      {new Date(
                        order.updated_at
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Track Another Order */}
            <button
              type="button"
              onClick={resetTracking}
              className="mt-5 w-full rounded-xl border border-gray-300 px-5 py-3.5 font-semibold text-[#071a3d] transition duration-300 hover:border-[#ff7800] hover:bg-orange-50 hover:text-[#ff7800]"
            >
              Track Another Order
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 py-7 text-center sm:px-6 sm:py-8">
          <img
            src="/rplogo.png"
            alt="Random Picks NG"
            className="h-10 w-10 rounded-full object-cover"
          />

          <p className="text-xs text-gray-600 sm:text-sm">
            © {new Date().getFullYear()} Random Picks NG. All
            rights reserved.
          </p>

          <p className="text-xs text-gray-500 sm:text-sm">
            Shop smarter. Pick randomly. Love your choice.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}