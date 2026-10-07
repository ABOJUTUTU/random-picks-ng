"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  types: string[];
  colors: string[];
  images: string[];
  stock: number;
  created_at: string;
  updated_at: string;
};

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadProducts() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(`Could not load products: ${error.message}`);
        setLoading(false);
        return;
      }

      setProducts(data || []);
      setLoading(false);
    }

    loadProducts();
  }, [router]);

  async function deleteProduct(productId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(productId);
    setError("");

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) {
      setError(`Could not delete product: ${error.message}`);
      setDeletingId(null);
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.filter(
        (product) => product.id !== productId
      )
    );

    setDeletingId(null);
  }

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const outOfStock = products.filter(
    (product) => Number(product.stock) <= 0
  ).length;

  const lowStock = products.filter(
    (product) =>
      Number(product.stock) > 0 &&
      Number(product.stock) <= 5
  ).length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb]">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ff7800]/20 border-t-[#ff7800]" />

          <p className="mt-4 text-sm font-medium text-[#071a3d]/60">
            Loading products...
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
                Product Management
              </p>
            </div>
          </Link>

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
                Products
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
                Manage the products displayed throughout your Random Picks NG
                storefront.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/products/new")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ff7800] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#071a3d] hover:shadow-md"
            >
              <span className="text-lg leading-none">+</span>
              Add Product
            </button>
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

        {/* INVENTORY STATS */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Products
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#071a3d]/5 text-sm font-bold text-[#071a3d]">
                #
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold text-[#071a3d]">
              {products.length}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Products in your catalog
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Total Stock
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff7800]/10 text-[#ff7800]">
                □
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold text-[#071a3d]">
              {totalStock}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Units currently available
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Low Stock
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                !
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold text-[#071a3d]">
              {lowStock}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              5 units or fewer
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-500">
                Out of Stock
              </p>

              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                ×
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold text-[#071a3d]">
              {outOfStock}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Products unavailable
            </p>
          </div>
        </section>

        {/* PRODUCTS */}
        {products.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm sm:p-16">
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
                  d="m21 7.5-9-5.25L3 7.5m18 0v9L12 21.75 3 16.5v-9m18 0-9 5.25m0 0L3 7.5m9 5.25v9"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-extrabold text-[#071a3d]">
              No products yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Your store does not have any products yet. Add your first
              product to start selling.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/admin/products/new")
              }
              className="mt-6 rounded-xl bg-[#071a3d] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#ff7800]"
            >
              Add First Product
            </button>
          </section>
        ) : (
          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7800]">
                  Catalog
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-[#071a3d]">
                  Your Products
                </h2>
              </div>

              <p className="hidden text-sm text-gray-500 sm:block">
                {products.length}{" "}
                {products.length === 1
                  ? "product"
                  : "products"}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const stock = Number(product.stock || 0);

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* IMAGE */}
                    <div className="relative overflow-hidden bg-gray-100">
                      {product.images &&
                      product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="h-60 w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-60 items-center justify-center bg-[#071a3d]/5">
                          <div className="text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#071a3d] shadow-sm">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
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

                            <p className="mt-2 text-xs font-semibold text-gray-400">
                              No image
                            </p>
                          </div>
                        </div>
                      )}

                      {/* STOCK BADGE */}
                      <div className="absolute left-4 top-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur ${
                            stock <= 0
                              ? "border-red-200 bg-red-50/95 text-red-700"
                              : stock <= 5
                              ? "border-amber-200 bg-amber-50/95 text-amber-700"
                              : "border-green-200 bg-green-50/95 text-green-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              stock <= 0
                                ? "bg-red-500"
                                : stock <= 5
                                ? "bg-amber-500"
                                : "bg-green-500"
                            }`}
                          />

                          {stock <= 0
                            ? "Out of stock"
                            : `${stock} in stock`}
                        </span>
                      </div>

                      {/* IMAGE COUNT */}
                      {product.images &&
                        product.images.length > 1 && (
                          <div className="absolute bottom-4 right-4 rounded-full bg-[#071a3d]/85 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                            {product.images.length} images
                          </div>
                        )}
                    </div>

                    {/* CONTENT */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-lg font-extrabold leading-6 text-[#071a3d]">
                          {product.name}
                        </h3>

                        <p className="shrink-0 text-lg font-extrabold text-[#ff7800]">
                          ₦
                          {Number(
                            product.price
                          ).toLocaleString()}
                        </p>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                        {product.description ||
                          "No description provided."}
                      </p>

                      {/* PRODUCT META */}
                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Product ID
                          </p>

                          <p className="mt-1 text-sm font-bold text-[#071a3d]">
                            #{product.id}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Stock
                          </p>

                          <p
                            className={`mt-1 text-sm font-bold ${
                              stock <= 0
                                ? "text-red-600"
                                : stock <= 5
                                ? "text-amber-600"
                                : "text-green-600"
                            }`}
                          >
                            {stock}
                          </p>
                        </div>
                      </div>

                      {/* TYPES */}
                      {product.types &&
                        product.types.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Types
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {product.types.map((type) => (
                                <span
                                  key={type}
                                  className="rounded-lg bg-[#071a3d]/5 px-2.5 py-1.5 text-xs font-semibold text-[#071a3d]"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* COLORS */}
                      {product.colors &&
                        product.colors.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                              Colors
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {product.colors.map((color) => (
                                <span
                                  key={color}
                                  className="rounded-lg bg-[#ff7800]/10 px-2.5 py-1.5 text-xs font-semibold text-[#c75c00]"
                                >
                                  {color}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* ACTIONS */}
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/products/edit/${product.id}`
                            )
                          }
                          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-[#071a3d] transition hover:border-[#071a3d] hover:bg-[#071a3d] hover:text-white"
                        >
                          Edit Product
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteProduct(product.id)
                          }
                          disabled={
                            deletingId === product.id
                          }
                          className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === product.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
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
                  Product Management
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