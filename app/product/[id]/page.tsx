"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
};

export default function ProductPage() {
  const params = useParams();

  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  useEffect(() => {
    async function loadProduct() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setProduct(data);
      setLoading(false);
    }

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff7800]" />
          <p className="mt-4 text-sm text-gray-600">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#071a3d]">
            Product not found
          </h1>

          <p className="mt-3 text-sm text-gray-600">
            {error || "This product could not be found."}
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-[#071a3d] px-6 py-3 font-semibold text-white transition duration-300 hover:bg-[#ff7800]"
          >
            Back to Store
          </Link>
        </div>
      </main>
    );
  }

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [];

  const mainImage = images[selectedImage];

  function handleTouchStart(
    event: React.TouchEvent<HTMLDivElement>
  ) {
    setTouchStartX(event.touches[0].clientX);
    setTouchEndX(null);
  }

  function handleTouchMove(
    event: React.TouchEvent<HTMLDivElement>
  ) {
    setTouchEndX(event.touches[0].clientX);
  }

  function handleTouchEnd() {
    if (
      touchStartX === null ||
      touchEndX === null ||
      images.length <= 1
    ) {
      return;
    }

    const swipeDistance = touchStartX - touchEndX;
    const minimumSwipeDistance = 50;

    if (Math.abs(swipeDistance) < minimumSwipeDistance) {
      return;
    }

    if (swipeDistance > 0) {
      setSelectedImage((current) =>
        current < images.length - 1 ? current + 1 : 0
      );
    } else {
      setSelectedImage((current) =>
        current > 0 ? current - 1 : images.length - 1
      );
    }

    setTouchStartX(null);
    setTouchEndX(null);
  }

  return (
    <main className="min-h-screen bg-white text-[#071a3d]">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          {/* Logo */}
          <Link
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
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 text-sm font-medium sm:flex">
            <Link
              href="/"
              className="text-gray-700 transition hover:text-[#ff7800]"
            >
              Home
            </Link>

            <Link
              href="/#products"
              className="text-gray-700 transition hover:text-[#ff7800]"
            >
              Products
            </Link>

            <Link
              href="/track-order"
              className="text-gray-700 transition hover:text-[#ff7800]"
            >
              Track Order
            </Link>

            <Link
              href="/#about"
              className="text-gray-700 transition hover:text-[#ff7800]"
            >
              About
            </Link>

            <Link
              href="/#products"
              className="rounded-lg bg-[#071a3d] px-5 py-2.5 text-white transition duration-300 hover:bg-[#ff7800]"
            >
              Shop Now
            </Link>
          </div>

          {/* Mobile Navigation */}
          <details className="relative sm:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-gray-200 bg-white text-[#071a3d] transition hover:border-[#ff7800] hover:text-[#ff7800]">
              <span className="sr-only">Open menu</span>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </summary>

            <div className="absolute right-0 z-50 mt-3 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="flex flex-col p-2 text-sm font-medium">
                <Link
                  href="/"
                  className="rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-100 hover:text-[#ff7800]"
                >
                  Home
                </Link>

                <Link
                  href="/#products"
                  className="rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-100 hover:text-[#ff7800]"
                >
                  Products
                </Link>

                <Link
                  href="/track-order"
                  className="rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-100 hover:text-[#ff7800]"
                >
                  Track Order
                </Link>

                <Link
                  href="/#about"
                  className="rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-100 hover:text-[#ff7800]"
                >
                  About
                </Link>

                <Link
                  href="/#products"
                  className="mt-1 rounded-lg bg-[#071a3d] px-4 py-3 text-center text-white transition hover:bg-[#ff7800]"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </details>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-gray-500 transition hover:text-[#ff7800]"
        >
          ← Back to Store
        </Link>
      </div>

      {/* Product */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          {/* Gallery */}
          <div className="animate-[fadeIn_0.6s_ease-out]">
            {/* Main Image */}
            <div
              className="group flex h-[340px] touch-pan-y select-none items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm sm:h-[500px] sm:rounded-3xl"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  draggable={false}
                  className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                />
              ) : (
                <div className="text-sm text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {/* Swipe Hint */}
            {images.length > 1 && (
              <p className="mt-2 text-center text-xs text-gray-400 sm:hidden">
                Swipe to view more images
              </p>
            )}

            {/* Thumbnail Scroller */}
            {images.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <div className="flex w-max gap-3 pb-2">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(index)}
                      className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 transition duration-300 sm:h-24 sm:w-24 ${
                        selectedImage === index
                          ? "border-[#ff7800] shadow-md"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="animate-[fadeUp_0.6s_ease-out]">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8">
              {/* Product Label */}
              <p className="text-xs font-semibold uppercase tracking-widest text-[#ff7800]">
                Product Details
              </p>

              {/* Product Name */}
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#071a3d] sm:text-4xl">
                {product.name}
              </h1>

              {/* Price */}
              <p className="mt-4 text-2xl font-bold text-[#ff7800] sm:text-3xl">
                ₦{Number(product.price).toLocaleString()}
              </p>

              {/* Divider */}
              <div className="my-6 border-t border-gray-100" />

              {/* Description */}
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#071a3d]">
                  Description
                </h2>

                <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
                  {product.description ||
                    "No description provided."}
                </p>
              </div>

              {/* Types */}
              {product.types && product.types.length > 0 && (
                <div className="mt-7">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#071a3d]">
                    Available Types
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.types.map((type) => (
                      <span
                        key={type}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition hover:border-[#ff7800]/40 hover:text-[#ff7800]"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {product.colors && product.colors.length > 0 && (
                <div className="mt-7">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[#071a3d]">
                    Available Colors
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <span
                        key={color}
                        className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 transition hover:border-[#ff7800]/40 hover:text-[#ff7800]"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock */}
              <div className="mt-7">
                {product.stock > 0 ? (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {product.stock} available
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Out of stock
                  </div>
                )}
              </div>

              {/* Order Button */}
              {product.stock > 0 && (
                <Link
                  href={`/order/${product.id}`}
                  className="mt-8 block w-full rounded-xl bg-[#071a3d] px-6 py-4 text-center font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-[#ff7800] hover:shadow-lg"
                >
                  Order Now
                </Link>
              )}

              {/* Back Link */}
              <Link
                href="/#products"
                className="mt-4 block w-full rounded-xl border border-gray-200 px-6 py-3.5 text-center text-sm font-semibold text-[#071a3d] transition duration-300 hover:border-[#ff7800] hover:text-[#ff7800]"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-8 border-t border-gray-200 bg-white py-7 sm:py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 text-center sm:px-6">
          <img
            src="/rplogo.png"
            alt="Random Picks NG"
            className="h-10 w-10 rounded-full object-cover"
          />

          <p className="text-xs text-gray-600 sm:text-sm">
            © 2026 Random Picks NG. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Animations */}
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