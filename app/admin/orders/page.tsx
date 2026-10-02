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

    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
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
              updated_at: new Date().toISOString(),
            }
          : order
      )
    );

    setUpdatingId(null);
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";

      case "confirmed":
        return "bg-blue-100 text-blue-800";

      case "processing":
        return "bg-purple-100 text-purple-800";

      case "shipped":
        return "bg-indigo-100 text-indigo-800";

      case "delivered":
        return "bg-green-100 text-green-800";

      case "cancelled":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  const filteredOrders = orders.filter((order) => {
    const searchTerm = search.toLowerCase().trim();

    const matchesSearch =
      searchTerm === "" ||
      String(order.id).includes(searchTerm) ||
      order.customer_name
        .toLowerCase()
        .includes(searchTerm) ||
      order.phone
        .toLowerCase()
        .includes(searchTerm) ||
      (order.email || "")
        .toLowerCase()
        .includes(searchTerm) ||
      order.product_name
        .toLowerCase()
        .includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Random Picks NG
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Order Management
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Orders
            </h2>

            <p className="mt-2 text-gray-600">
              View and manage customer orders.
            </p>
          </div>

          <div className="rounded-lg bg-white px-5 py-3 shadow-sm">
            <span className="text-sm text-gray-500">
              Total Orders
            </span>

            <span className="ml-3 text-xl font-bold text-gray-900">
              {orders.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search and Filter */}
        {orders.length > 0 && (
          <div className="mt-8 rounded-2xl bg-white p-5 shadow-sm">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Search Orders
                </label>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by order ID, customer, phone, email or product..."
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Filter by Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
                >
                  <option value="all">
                    All Orders
                  </option>

                  {statuses.map((status) => (
                    <option
                      key={status}
                      value={status}
                    >
                      {status.charAt(0).toUpperCase() +
                        status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(search || statusFilter !== "all") && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {filteredOrders.length} of{" "}
                  {orders.length} orders
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="text-sm font-semibold text-gray-700 hover:text-black"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">📦</div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              No orders yet
            </h3>

            <p className="mt-2 text-gray-600">
              Customer orders will appear here when they place
              an order.
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">🔍</div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              No matching orders
            </h3>

            <p className="mt-2 text-gray-600">
              Try changing your search or status filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {filteredOrders.map((order) => {
              const total =
                Number(order.product_price) * order.quantity;

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  <div className="border-b bg-gray-50 px-6 py-5">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            Order #{order.id}
                          </h3>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClasses(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-500">
                          {new Date(
                            order.created_at
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                        >
                          View Order
                        </Link>

                        <label className="text-sm font-medium text-gray-600">
                          Status:
                        </label>

                        <select
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(event) =>
                            updateOrderStatus(
                              order.id,
                              event.target.value
                            )
                          }
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-black disabled:opacity-50"
                        >
                          {statuses.map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status.charAt(0).toUpperCase() +
                                status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-8 p-6 lg:grid-cols-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Customer
                      </h4>

                      <div className="mt-3 space-y-2 text-sm">
                        <p>
                          <span className="font-medium">
                            Name:
                          </span>{" "}
                          {order.customer_name}
                        </p>

                        <p>
                          <span className="font-medium">
                            Phone:
                          </span>{" "}
                          {order.phone}
                        </p>

                        {order.email && (
                          <p className="break-all">
                            <span className="font-medium">
                              Email:
                            </span>{" "}
                            {order.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Delivery
                      </h4>

                      <div className="mt-3 space-y-2 text-sm">
                        <p>
                          <span className="font-medium">
                            State:
                          </span>{" "}
                          {order.state}
                        </p>

                        <p>
                          <span className="font-medium">
                            City:
                          </span>{" "}
                          {order.city}
                        </p>

                        <p>
                          <span className="font-medium">
                            Address:
                          </span>{" "}
                          {order.address}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Product
                      </h4>

                      <div className="mt-3 space-y-2 text-sm">
                        <p>
                          <span className="font-medium">
                            Product:
                          </span>{" "}
                          {order.product_name}
                        </p>

                        <p>
                          <span className="font-medium">
                            Price:
                          </span>{" "}
                          ₦
                          {Number(
                            order.product_price
                          ).toLocaleString()}
                        </p>

                        <p>
                          <span className="font-medium">
                            Quantity:
                          </span>{" "}
                          {order.quantity}
                        </p>

                        {order.product_type && (
                          <p>
                            <span className="font-medium">
                              Type:
                            </span>{" "}
                            {order.product_type}
                          </p>
                        )}

                        {order.color && (
                          <p>
                            <span className="font-medium">
                              Color:
                            </span>{" "}
                            {order.color}
                          </p>
                        )}

                        <p className="border-t pt-2 text-base font-bold">
                          Total: ₦{total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.additional_note && (
                    <div className="border-t bg-yellow-50 px-6 py-4">
                      <p className="text-sm">
                        <span className="font-semibold">
                          Customer Note:
                        </span>{" "}
                        {order.additional_note}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}