export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function HomePage() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="max-w-xl text-center">
          <h1 className="text-3xl font-bold text-[#071a3d]">
            Could not load products
          </h1>

          <p className="mt-4 text-gray-700">{error.message}</p>
        </div>
      </main>
    );
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
              href="#products"
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
              href="#about"
              className="text-gray-700 transition hover:text-[#ff7800]"
            >
              About
            </Link>

            <Link
              href="#products"
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
                  href="#products"
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
                  href="#about"
                  className="rounded-lg px-4 py-3 text-gray-700 transition hover:bg-gray-100 hover:text-[#ff7800]"
                >
                  About
                </Link>

                <Link
                  href="#products"
                  className="mt-1 rounded-lg bg-[#071a3d] px-4 py-3 text-center text-white transition hover:bg-[#ff7800]"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </details>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="flex flex-col-reverse items-center gap-8 sm:gap-10 lg:flex-row lg:justify-between lg:gap-16">
            {/* Hero Text */}
            <div className="w-full max-w-3xl text-center animate-[fadeIn_0.7s_ease-out] lg:text-left">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#ff7800] sm:mb-4 sm:text-sm">
                Welcome to Random Picks NG
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-[#071a3d] sm:text-5xl md:text-6xl">
                Discover products you&apos;ll love.
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-gray-600 sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0">
                Shop quality products at great prices, carefully selected for
                you.
              </p>

              <Link
                href="#products"
                className="mt-6 inline-block rounded-lg bg-[#071a3d] px-6 py-3.5 font-semibold text-white transition duration-300 hover:-translate-y-1 hover:bg-[#ff7800] hover:shadow-lg sm:mt-8 sm:px-7"
              >
                Start Shopping
              </Link>
            </div>

            {/* Hero Logo */}
            <div className="flex shrink-0 justify-center">
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-lg transition duration-500 hover:-translate-y-2 hover:shadow-xl sm:h-64 sm:w-64 lg:h-[400px] lg:w-[400px]">
                <img
                  src="/rplogo.png"
                  alt="Random Picks NG"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-3 py-12 sm:px-6 sm:py-20"
      >
        <div className="mb-7 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#ff7800] sm:text-sm">
            Our Products
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#071a3d] sm:text-3xl">
            Featured Products
          </h2>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {products.map((product, index) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#ff7800]/30 hover:shadow-xl sm:rounded-2xl"
                style={{
                  animation: `fadeUp 0.5s ease-out ${index * 0.08}s both`,
                }}
              >
                {/* Product Image */}
                <div className="flex h-32 w-full items-center justify-center overflow-hidden bg-gray-100 sm:h-64">
                  {product.images &&
                  product.images.length > 0 &&
                  product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="px-1 text-center text-[9px] text-gray-400 transition duration-300 group-hover:text-[#ff7800] sm:text-sm">
                      Product Image
                    </span>
                  )}
                </div>

                {/* Product Information */}
                <div className="p-2 sm:p-6">
                  <h3 className="line-clamp-2 text-sm font-bold text-[#071a3d] transition-colors duration-300 group-hover:text-[#ff7800] sm:text-xl">
                    {product.name}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-gray-600 sm:mt-2 sm:text-sm sm:leading-6">
                    {product.description || "No description provided."}
                  </p>

                  <p className="mt-2 text-sm font-bold text-[#071a3d] sm:mt-4 sm:text-xl">
                    ₦{Number(product.price).toLocaleString()}
                  </p>

                  <span className="mt-3 block rounded-md bg-[#071a3d] px-2 py-2 text-center text-[10px] font-semibold text-white transition duration-300 group-hover:bg-[#ff7800] sm:mt-5 sm:rounded-lg sm:px-4 sm:py-3 sm:text-base">
                    View Product
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No products available yet.</p>
        )}
      </section>

      {/* About */}
      <section
        id="about"
        className="border-t border-gray-200 bg-gray-50"
      >
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-bold text-[#071a3d] sm:text-3xl">
            About Random Picks NG
          </h2>

          <p className="mt-5 text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
            Random Picks NG makes it simple to discover and order products
            online. We&apos;re building a straightforward shopping experience
            focused on quality, convenience and great products.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-7 sm:py-8">
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
            transform: translateY(14px);
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