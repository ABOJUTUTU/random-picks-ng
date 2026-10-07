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
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb]">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff7800]/20 border-t-[#ff7800]" />

          <p className="mt-4 text-sm font-medium text-[#071a3d]/60">
            Loading dashboard...
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
                Admin Dashboard
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-[#071a3d] transition hover:bg-[#071a3d]/5 sm:block"
            >
              View Store
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl bg-[#071a3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#ff7800] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* WELCOME */}
        <section className="relative overflow-hidden rounded-3xl bg-[#071a3d] px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
              <span className="h-2 w-2 rounded-full bg-[#ff7800]" />
              Store Administration
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back 👋
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              Manage your products, monitor orders and keep your Random Picks
              NG store running smoothly.
            </p>
          </div>

          {/* Decorative shapes */}
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#ff7800]/15 blur-2xl" />

          <div className="absolute -bottom-24 right-20 h-52 w-52 rounded-full bg-white/5 blur-2xl" />

          <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-3xl border border-white/10 bg-white/5 sm:block" />
        </section>

        {/* STATS */}
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7800]">
                Overview
              </p>

              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#071a3d]">
                Store Statistics
              </h2>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* PRODUCTS */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#071a3d]/5 text-[#071a3d]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 7.5-9-5.25L3 7.5m18 0v9L12 21.75 3 16.5v-9m18 0-9 5.25m0 0L3 7.5m9 5.25v9"
                    />
                  </svg>
                </div>

                <span className="rounded-full bg-[#071a3d]/5 px-3 py-1 text-xs font-bold text-[#071a3d]">
                  Products
                </span>
              </div>

              <p className="mt-6 text-sm font-semibold text-gray-500">
                Total Products
              </p>

              <p className="mt-1 text-4xl font-extrabold tracking-tight text-[#071a3d]">
                {stats.products}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Products currently in your store
              </p>
            </div>

            {/* ORDERS */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff7800]/10 text-[#ff7800]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25h10.125c.967 0 1.8-.62 2.1-1.53l1.35-4.05A1.125 1.125 0 0 0 20.006 7.5H5.106m2.394 6.75L5.106 7.5m2.394 6.75L6.375 17.25m0 0a2.25 2.25 0 1 0 4.5 0m-4.5 0h9.75m0 0a2.25 2.25 0 1 0 4.5 0"
                    />
                  </svg>
                </div>

                <span className="rounded-full bg-[#ff7800]/10 px-3 py-1 text-xs font-bold text-[#ff7800]">
                  Orders
                </span>
              </div>

              <p className="mt-6 text-sm font-semibold text-gray-500">
                Total Orders
              </p>

              <p className="mt-1 text-4xl font-extrabold tracking-tight text-[#071a3d]">
                {stats.orders}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Orders received by your store
              </p>
            </div>

            {/* PENDING */}
            <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z"
                    />
                  </svg>
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                  Action needed
                </span>
              </div>

              <p className="mt-6 text-sm font-semibold text-gray-500">
                Pending Orders
              </p>

              <p className="mt-1 text-4xl font-extrabold tracking-tight text-[#071a3d]">
                {stats.pendingOrders}
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Orders waiting for action
              </p>
            </div>
          </div>
        </section>

        {/* MANAGEMENT */}
        <section className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7800]">
              Management
            </p>

            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#071a3d]">
              Store Management
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* ORDERS */}
            <Link
              href="/admin/orders"
              className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#ff7800]/30 hover:shadow-xl sm:p-7"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#ff7800]/10 transition duration-500 group-hover:scale-150" />

              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071a3d] text-white shadow-md transition duration-300 group-hover:bg-[#ff7800]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.7}
                      stroke="currentColor"
                      className="h-7 w-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25h10.125c.967 0 1.8-.62 2.1-1.53l1.35-4.05A1.125 1.125 0 0 0 20.006 7.5H5.106m2.394 6.75L5.106 7.5m2.394 6.75L6.375 17.25m0 0a2.25 2.25 0 1 0 4.5 0m-4.5 0h9.75m0 0a2.25 2.25 0 1 0 4.5 0"
                      />
                    </svg>
                  </div>

                  <span className="text-2xl text-gray-300 transition duration-300 group-hover:translate-x-1 group-hover:text-[#ff7800]">
                    →
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-extrabold text-[#071a3d]">
                  Orders
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
                  View customer orders, delivery information, order status and
                  complete order details.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <span className="text-sm font-extrabold text-[#ff7800]">
                    Manage Orders
                  </span>

                  {stats.pendingOrders > 0 && (
                    <span className="rounded-full bg-[#ff7800] px-2.5 py-1 text-xs font-bold text-white">
                      {stats.pendingOrders} pending
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* PRODUCTS */}
            <Link
              href="/admin/products"
              className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#071a3d]/20 hover:shadow-xl sm:p-7"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#071a3d]/5 transition duration-500 group-hover:scale-150" />

              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff7800] text-white shadow-md transition duration-300 group-hover:bg-[#071a3d]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.7}
                      stroke="currentColor"
                      className="h-7 w-7"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 7.5-9-5.25L3 7.5m18 0v9L12 21.75 3 16.5v-9m18 0-9 5.25m0 0L3 7.5m9 5.25v9"
                      />
                    </svg>
                  </div>

                  <span className="text-2xl text-gray-300 transition duration-300 group-hover:translate-x-1 group-hover:text-[#071a3d]">
                    →
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-extrabold text-[#071a3d]">
                  Products
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-600">
                  Add, edit and manage the products displayed throughout your
                  Random Picks NG storefront.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <span className="text-sm font-extrabold text-[#071a3d]">
                    Manage Products
                  </span>

                  <span className="rounded-full bg-[#071a3d]/5 px-2.5 py-1 text-xs font-bold text-[#071a3d]">
                    {stats.products} total
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* QUICK LINKS */}
        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-extrabold text-[#071a3d]">
                Need to check the storefront?
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Open the live customer-facing store.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-[#071a3d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff7800]"
            >
              View Storefront →
            </Link>
          </div>
        </section>

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
                  Admin Panel
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