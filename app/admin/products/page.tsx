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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading products...</p>
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
              Product Management
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
              Products
            </h2>

            <p className="mt-2 text-gray-600">
              Manage the products displayed in your store.
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/products/new")}
            className="rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            + Add Product
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <div className="text-5xl">📦</div>

            <h3 className="mt-4 text-xl font-bold text-gray-900">
              No products yet
            </h3>

            <p className="mt-2 text-gray-600">
              Add your first product to start selling.
            </p>

            <button
              onClick={() => router.push("/admin/products/new")}
              className="mt-6 rounded-lg bg-black px-6 py-3 font-semibold text-white"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                {product.images &&
                product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center bg-gray-100 text-gray-400">
                    No image
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      {product.name}
                    </h3>

                    <span className="whitespace-nowrap text-lg font-bold text-gray-900">
                      ₦{Number(product.price).toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {product.description ||
                      "No description provided."}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span
                      className={
                        product.stock > 0
                          ? "font-medium text-green-600"
                          : "font-medium text-red-600"
                      }
                    >
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : "Out of stock"}
                    </span>

                    <span className="text-gray-400">
                      ID: {product.id}
                    </span>
                  </div>

                  {product.types &&
                    product.types.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500">
                          Types
                        </p>

                        <div className="mt-1 flex flex-wrap gap-1">
                          {product.types.map((type) => (
                            <span
                              key={type}
                              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {product.colors &&
                    product.colors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500">
                          Colors
                        </p>

                        <div className="mt-1 flex flex-wrap gap-1">
                          {product.colors.map((color) => (
                            <span
                              key={color}
                              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
                            >
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() =>
                        router.push(
                          `/admin/products/edit/${product.id}`
                        )
                      }
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      disabled={deletingId === product.id}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === product.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}