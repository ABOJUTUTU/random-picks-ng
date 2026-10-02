"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Stats = {
  products: number;
  orders: number;
  pendingOrders: number;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats>({
    products: 0,
    orders: 0,
    pendingOrders: 0,
  });

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const [productsResult, ordersResult, pendingResult] =
        await Promise.all([
          supabase
            .from("products")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("orders")
            .select("*", { count: "exact", head: true }),

          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending"),
        ]);

      setStats({
        products: productsResult.count ?? 0,
        orders: ordersResult.count ?? 0,
        pendingOrders: pendingResult.count ?? 0,
      });

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    setLoggingOut(true);

    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading dashboard...</p>
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
              Admin Dashboard
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back 👋
          </h2>

          <p className="mt-2 text-gray-600">
            Here's what's happening with your store.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Total Products
              </p>

              <span className="text-2xl">📦</span>
            </div>

            <p className="mt-4 text-3xl font-bold text-gray-900">
              {stats.products}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Products currently in your store
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Total Orders
              </p>

              <span className="text-2xl">🛒</span>
            </div>

            <p className="mt-4 text-3xl font-bold text-gray-900">
              {stats.orders}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Orders received by your store
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">
                Pending Orders
              </p>

              <span className="text-2xl">⏳</span>
            </div>

            <p className="mt-4 text-3xl font-bold text-gray-900">
              {stats.pendingOrders}
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Orders waiting for action
            </p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900">
            Store Management
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Link
              href="/admin/orders"
              className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Orders
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    View customer orders, delivery information,
                    order status and order details.
                  </p>
                </div>

                <span className="text-3xl transition group-hover:scale-110">
                  🛒
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-black">
                Manage Orders →
              </p>
            </Link>

            <Link
              href="/admin/products"
              className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Products
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Add, edit and manage products displayed on
                    your storefront.
                  </p>
                </div>

                <span className="text-3xl transition group-hover:scale-110">
                  📦
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-black">
                Manage Products →
              </p>
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-black"
          >
            ← View Storefront
          </Link>
        </div>
      </div>
    </main>
  );
}