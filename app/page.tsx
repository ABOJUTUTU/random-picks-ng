export const dynamic = "force-dynamic";

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
          <h1 className="text-3xl font-bold text-red-600">
            Could not load products
          </h1>

          <p className="mt-4 text-gray-700">
            {error.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
          <a
            href="/"
            className="text-xl font-bold tracking-tight text-gray-950 sm:text-2xl"
          >
            Random Picks NG
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 text-sm font-medium sm:flex">
            <a
              href="/"
              className="text-gray-700 hover:text-black"
            >
              Home
            </a>

            <a
              href="#products"
              className="text-gray-700 hover:text-black"
            >
              Products
            </a>

            <a
              href="/track-order"
              className="text-gray-700 hover:text-black"
            >
              Track Order
            </a>

            <a
              href="#about"
              className="text-gray-700 hover:text-black"
            >
              About
            </a>

            <a
              href="#products"
              className="rounded-lg bg-black px-5 py-2.5 text-white hover:bg-gray-800"
            >
              Shop Now
            </a>
          </div>

          {/* Mobile Navigation */}
          <details className="relative sm:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-800">
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
                <a
                  href="/"
                  className="rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black"
                >
                  Home
                </a>

                <a
                  href="#products"
                  className="rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black"
                >
                  Products
                </a>

                <a
                  href="/track-order"
                  className="rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black"
                >
                  Track Order
                </a>

                <a
                  href="#about"
                  className="rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-100 hover:text-black"
                >
                  About
                </a>

                <a
                  href="#products"
                  className="mt-1 rounded-lg bg-black px-4 py-3 text-center text-white hover:bg-gray-800"
                >
                  Shop Now
                </a>
              </div>
            </div>
          </details>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500 sm:text-sm">
              Welcome to Random Picks NG
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-gray-950 sm:text-5xl md:text-6xl">
              Discover products you'll love.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:mt-6 sm:text-lg sm:leading-8">
              Shop quality products at great prices, carefully selected for
              you.
            </p>

            <a
              href="#products"
              className="mt-7 inline-block rounded-lg bg-black px-6 py-3.5 font-semibold text-white transition hover:bg-gray-800 sm:mt-8 sm:px-7"
            >
              Start Shopping
            </a>
          </div>
        </div>
      </section>

      {/* Products */}
      <section
        id="products"
        className="mx-auto max-w-7xl px-3 py-12 sm:px-6 sm:py-20"
      >
        <div className="mb-7 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 sm:text-sm">
            Our Products
          </p>

          <h2 className="mt-2 text-2xl font-bold text-gray-950 sm:text-3xl">
            Featured Products
          </h2>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:rounded-2xl"
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
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-1 text-center text-[9px] text-gray-400 sm:text-sm">
                      Product Image
                    </span>
                  )}
                </div>

                {/* Product Information */}
                <div className="p-2 sm:p-6">
                  <h3 className="line-clamp-2 text-sm font-bold text-gray-950 sm:text-xl">
                    {product.name}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-gray-600 sm:mt-2 sm:text-sm sm:leading-6">
                    {product.description || "No description provided."}
                  </p>

                  <p className="mt-2 text-sm font-bold text-gray-950 sm:mt-4 sm:text-xl">
                    ₦{Number(product.price).toLocaleString()}
                  </p>

                  <a
                    href={`/product/${product.id}`}
                    className="mt-3 block rounded-md bg-black px-2 py-2 text-center text-[10px] font-semibold text-white transition hover:bg-gray-800 sm:mt-5 sm:rounded-lg sm:px-4 sm:py-3 sm:text-base"
                  >
                    View Product
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">
            No products available yet.
          </p>
        )}
      </section>

      {/* About */}
      <section
        id="about"
        className="border-t border-gray-200 bg-gray-50"
      >
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-bold text-gray-950 sm:text-3xl">
            About Random Picks NG
          </h2>

          <p className="mt-5 text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
            Random Picks NG makes it simple to discover and order products
            online. We're building a straightforward shopping experience
            focused on quality, convenience and great products.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-7 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-600 sm:px-6 sm:text-sm">
          © 2026 Random Picks NG. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
