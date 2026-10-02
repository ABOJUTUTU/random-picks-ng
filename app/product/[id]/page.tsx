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

  const [touchStartX, setTouchStartX] = useState<number | null>(
    null
  );

  const [touchEndX, setTouchEndX] = useState<number | null>(
    null
  );

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
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">
          Loading product...
        </p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-red-600">
          {error || "Product not found."}
        </p>

        <Link
          href="/"
          className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white"
        >
          Back to Store
        </Link>
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
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Random Picks NG
          </h1>

          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-black"
          >
            ← Back to Store
          </Link>
        </div>
      </header>

      {/* Product */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            {/* Main Image */}
            <div
              className="flex h-[380px] touch-pan-y select-none items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm sm:h-[500px]"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  draggable={false}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-gray-400">
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
                      key={image}
                      type="button"
                      onClick={() =>
                        setSelectedImage(index)
                      }
                      className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-24 sm:w-24 ${
                        selectedImage === index
                          ? "border-black"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {product.name}
            </h2>

            <p className="mt-4 text-2xl font-bold text-gray-900">
              ₦{Number(product.price).toLocaleString()}
            </p>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-500">
                Description
              </h3>

              <p className="mt-2 leading-7 text-gray-700">
                {product.description ||
                  "No description provided."}
              </p>
            </div>

            {/* Types */}
            {product.types &&
              product.types.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-500">
                    Available Types
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.types.map((type) => (
                      <span
                        key={type}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Colors */}
            {product.colors &&
              product.colors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-500">
                    Available Colors
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.colors.map((color) => (
                      <span
                        key={color}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Stock */}
            <div className="mt-6">
              {product.stock > 0 ? (
                <p className="font-medium text-green-600">
                  {product.stock} available
                </p>
              ) : (
                <p className="font-medium text-red-600">
                  Out of stock
                </p>
              )}
            </div>

            {/* Order Button */}
            {product.stock > 0 && (
              <Link
                href={`/order/${product.id}`}
                className="mt-8 block w-full rounded-xl bg-black px-6 py-4 text-center font-semibold text-white transition hover:bg-gray-800"
              >
                Order Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}