"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  product_id: number | null;
  product_name: string;
  product_price: number;
  customer_name: string;
  phone: string;
  email: string | null;
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
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(`Could not load orders: ${error.message}`);
        setLoading(false);
        return;
      }

      setOrders(data || []);
      setLoading(false);
    }

    loadOrders();
  }, [router]);

  async function updateOrderStatus(
    orderId: number,
    newStatus: string
  ) {
    setUpdatingId(orderId);
    setError("");

    const updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: updatedAt,
      })
      .eq("id", orderId);

    if (error) {
      setError(`Could not update order: ${error.message}`);
      setUpdatingId(null);
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: newStatus,
              updated_at: updatedAt,
            }
          : order
      )
    );

    setUpdatingId(null);
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "processing":
        return "bg-purple-50 text-purple-700 border-purple-200";

      case "shipped":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";

      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";

      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  function getStatusDot(status: string) {
    switch (status) {
      case "pending":
        return "bg-amber-500";

      case "confirmed":
        return "bg-blue-500";

      case "processing":
        return "bg-purple-500";

      case "shipped":
        return "bg-indigo-500";

      case "delivered":
        return "bg-green-500";

      case "cancelled":
        return "bg-red-500";

      default:
        return "bg-gray-500";
    }
  }

  const filteredOrders = orders.filter((order) => {
    const searchTerm = search.toLowerCase().trim();

    const matchesSearch =
      searchTerm === "" ||
      String(order.id).includes(searchTerm) ||
      order.customer_name.toLowerCase().includes(searchTerm) ||
      order.phone.toLowerCase().includes(searchTerm) ||
      (order.email || "").toLowerCase().includes(searchTerm) ||
      order.product_name.toLowerCase().includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const confirmedCount = orders.filter(
    (order) => order.status === "confirmed"
  ).length;

  const processingCount = orders.filter(
    (order) => order.status === "processing"
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  const totalValue = orders.reduce(
    (sum, order) =>
      sum + Number(order.product_price) * Number(order.quantity),
    0
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb]">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff7800]/20 border-t-[#ff7800]" />

          <p className="mt-4 text-sm font-medium text-[#071a3d]/60">
            Loading orders...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-[#071a3d]">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition group-hover:scale-105">
              <img
                src="/rplogo.png"
                alt="Random Picks NG"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight text-[#071a3d] sm:text-lg">
                Random Picks NG
              </p>

              <p className="text-xs font-medium text-gray-500">
                Order Management
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/admin"
              className="rounded-xl bg-[#071a3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ff7800]"
            >
              <span className="hidden sm:inline">
                ← Dashboard
              </span>

              <span className="sm:hidden">Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* PAGE HEADER */}
        <section>
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7800]">
                Store Management
              </p>

              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#071a3d] sm:text-4xl">
                Orders
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
                View, search and manage customer orders from one place.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Total order value
              </p>

              <p className="mt-1 text-xl font-extrabold text-[#071a3d]">
                ₦{totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
              !
            </div>

            <p>{error}</p>
          </div>
        )}

        {/* STAT CARDS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                All Orders
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#071a3d]/5 text-sm font-bold text-[#071a3d]">
                {orders.length}
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold text-[#071a3d]">
              {orders.length}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Total orders received
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Pending
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                !
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold text-[#071a3d]">
              {pendingCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Waiting for action
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Processing
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                •
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold text-[#071a3d]">
              {processingCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Currently being handled
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Delivered
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-green-600">
                ✓
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold text-[#071a3d]">
              {deliveredCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Successfully completed
            </p>
          </div>
        </section>

        {/* SEARCH / FILTER */}
        {orders.length > 0 && (
          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                  Find an order
                </p>

                <h2 className="mt-1 text-lg font-extrabold text-[#071a3d]">
                  Search & Filter
                </h2>
              </div>

              {(search || statusFilter !== "all") && (
                <p className="text-sm text-gray-500">
                  Showing{" "}
                  <span className="font-bold text-[#071a3d]">
                    {filteredOrders.length}
                  </span>{" "}
                  of {orders.length}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-[#071a3d]">
                  Search Orders
                </label>

                <div className="relative mt-2">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                      />
                    </svg>
                  </div>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Order ID, customer, phone, email or product..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-[#071a3d] outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-[#ff7800]/10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-[#071a3d]">
                  Filter by Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-[#071a3d] outline-none transition focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-[#ff7800]/10"
                >
                  <option value="all">All Orders</option>

                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(search || statusFilter !== "all") && (
              <div className="mt-5 flex flex-col justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
                <p className="text-sm text-gray-500">
                  {filteredOrders.length} matching{" "}
                  {filteredOrders.length === 1 ? "order" : "orders"}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="self-start rounded-lg px-3 py-2 text-sm font-bold text-[#071a3d] transition hover:bg-[#071a3d]/5 sm:self-auto"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </section>
        )}

        {/* EMPTY STATE */}
        {orders.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm sm:p-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#071a3d]/5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-10 w-10 text-[#071a3d]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25h10.125c.967 0 1.8-.62 2.1-1.53l1.35-4.05A1.125 1.125 0 0 0 20.006 7.5H5.106m2.394 6.75L5.106 7.5m2.394 6.75L6.375 17.25m0 0a2.25 2.25 0 1 0 4.5 0m-4.5 0h9.75m0 0a2.25 2.25 0 1 0 4.5 0"
                />
              </svg>
            </div>

            <h3 className="mt-5 text-xl font-extrabold text-[#071a3d]">
              No orders yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Customer orders will appear here automatically when
              customers place orders through your storefront.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-[#071a3d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff7800]"
            >
              View Storefront
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm sm:p-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#ff7800]/10 text-[#ff7800]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-10 w-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
                />
              </svg>
            </div>

            <h3 className="mt-5 text-xl font-extrabold text-[#071a3d]">
              No matching orders
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Try changing your search term or selecting a different
              order status.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-6 rounded-xl bg-[#071a3d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff7800]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* ORDERS */
          <div className="mt-8 space-y-5">
            {filteredOrders.map((order) => {
              const total =
                Number(order.product_price) * Number(order.quantity);

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:shadow-lg"
                >
                  {/* ORDER HEADER */}
                  <div className="border-b border-gray-100 bg-[#071a3d] px-5 py-5 text-white sm:px-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-extrabold">
                            Order #{order.id}
                          </h2>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                order.status
                              )}`}
                            />

                            {order.status}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-white/60">
                          Placed{" "}
                          {new Date(
                            order.created_at
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(event) =>
                            updateOrderStatus(
                              order.id,
                              event.target.value
                            )
                          }
                          className="rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-white outline-none transition focus:border-[#ff7800] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {statuses.map((status) => (
                            <option
                              key={status}
                              value={status}
                              className="text-[#071a3d]"
                            >
                              {status.charAt(0).toUpperCase() +
                                status.slice(1)}
                            </option>
                          ))}
                        </select>

                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="rounded-xl bg-[#ff7800] px-4 py-2.5 text-center text-sm font-extrabold text-white transition hover:bg-white hover:text-[#071a3d]"
                        >
                          View Order →
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* ORDER CONTENT */}
                  <div className="grid gap-0 lg:grid-cols-3">
                    {/* CUSTOMER */}
                    <div className="border-b border-gray-100 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071a3d]/5 text-[#071a3d]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0"
                            />
                          </svg>
                        </div>

                        <h3 className="font-extrabold text-[#071a3d]">
                          Customer
                        </h3>
                      </div>

                      <div className="mt-5 space-y-3 text-sm">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Name
                          </p>

                          <p className="mt-1 font-semibold text-[#071a3d]">
                            {order.customer_name}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Phone
                          </p>

                          <p className="mt-1 font-medium text-gray-700">
                            {order.phone}
                          </p>
                        </div>

                        {order.email && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Email
                            </p>

                            <p className="mt-1 break-all font-medium text-gray-700">
                              {order.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DELIVERY */}
                    <div className="border-b border-gray-100 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7800]/10 text-[#ff7800]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.25 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm10.5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3 5.25h10.5v11.25H3V5.25Zm10.5 3h3.75l3 3v5.25H13.5V8.25Z"
                            />
                          </svg>
                        </div>

                        <h3 className="font-extrabold text-[#071a3d]">
                          Delivery
                        </h3>
                      </div>

                      <div className="mt-5 space-y-3 text-sm">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            State
                          </p>

                          <p className="mt-1 font-semibold text-[#071a3d]">
                            {order.state}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            City
                          </p>

                          <p className="mt-1 font-medium text-gray-700">
                            {order.city}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Address
                          </p>

                          <p className="mt-1 leading-5 text-gray-700">
                            {order.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PRODUCT */}
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071a3d]/5 text-[#071a3d]">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m21 7.5-9-5.25L3 7.5m18 0v9L12 21.75 3 16.5v-9m18 0-9 5.25m0 0L3 7.5m9 5.25v9"
                            />
                          </svg>
                        </div>

                        <h3 className="font-extrabold text-[#071a3d]">
                          Product
                        </h3>
                      </div>

                      <div className="mt-5 space-y-3 text-sm">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Product
                          </p>

                          <p className="mt-1 font-semibold text-[#071a3d]">
                            {order.product_name}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Price
                            </p>

                            <p className="mt-1 font-medium text-gray-700">
                              ₦
                              {Number(
                                order.product_price
                              ).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Quantity
                            </p>

                            <p className="mt-1 font-medium text-gray-700">
                              {order.quantity}
                            </p>
                          </div>
                        </div>

                        {(order.product_type || order.color) && (
                          <div className="flex flex-wrap gap-2">
                            {order.product_type && (
                              <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                                Type: {order.product_type}
                              </span>
                            )}

                            {order.color && (
                              <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                                Color: {order.color}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-4 rounded-xl bg-[#071a3d] p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-white/50">
                            Order Total
                          </p>

                          <p className="mt-1 text-xl font-extrabold text-white">
                            ₦{total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CUSTOMER NOTE */}
                  {order.additional_note && (
                    <div className="border-t border-[#ff7800]/20 bg-[#fff8f2] px-5 py-4 sm:px-6">
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff7800]/10 text-[#ff7800]">
                          !
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                            Customer Note
                          </p>

                          <p className="mt-1 text-sm leading-6 text-gray-700">
                            {order.additional_note}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-12 border-t border-gray-200 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <img
                src="/rplogo.png"
                alt="Random Picks NG"
                className="h-9 w-9 object-contain"
              />

              <div>
                <p className="text-sm font-extrabold text-[#071a3d]">
                  Random Picks NG
                </p>

                <p className="text-xs text-gray-500">
                  Order Management
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Random Picks NG
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}