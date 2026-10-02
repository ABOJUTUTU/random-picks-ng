"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [types, setTypes] = useState("");
  const [colors, setColors] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);

    setImages(files);

    const previewUrls = files.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviews(previewUrls);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter a product name.");
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!stock || Number(stock) < 0) {
      setError("Please enter a valid stock quantity.");
      return;
    }

    setLoading(true);

    try {
      const typeArray = types
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const colorArray = colors
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      /*
       * 1. Create the product first
       */
      const { data: product, error: productError } =
        await supabase
          .from("products")
          .insert({
            name: name.trim(),
            price: Number(price),
            description: description.trim() || null,
            types: typeArray,
            colors: colorArray,
            images: [],
            stock: Number(stock),
          })
          .select("id")
          .single();

      if (productError || !product) {
        throw new Error(
          productError?.message ||
            "Could not create product."
        );
      }

      /*
       * 2. Upload images
       */
      const imageUrls: string[] = [];

      for (const file of images) {
        const fileExtension =
          file.name.split(".").pop() || "jpg";

        const fileName = `${crypto.randomUUID()}.${fileExtension}`;

        const filePath = `${product.id}/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("product-images")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          throw new Error(
            `Could not upload ${file.name}: ${uploadError.message}`
          );
        }

        /*
         * 3. Get the public URL
         */
        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        imageUrls.push(data.publicUrl);
      }

      /*
       * 4. Save image URLs to the product
       */
      if (imageUrls.length > 0) {
        const { error: updateError } =
          await supabase
            .from("products")
            .update({
              images: imageUrls,
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id);

        if (updateError) {
          throw new Error(
            `Product was created, but the image URLs could not be saved: ${updateError.message}`
          );
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Random Picks NG
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Add New Product
            </p>
          </div>

          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ← Products
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Add Product
          </h2>

          <p className="mt-2 text-gray-600">
            Enter the details of the product you want to sell.
          </p>

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            {/* Product Name */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Product Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Premium Sneakers"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Price + Stock */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Price (₦)
                </label>

                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="45000"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Stock
                </label>

                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="20"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe the product..."
                rows={5}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Types */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Types
              </label>

              <input
                type="text"
                value={types}
                onChange={(e) => setTypes(e.target.value)}
                placeholder="Standard, Premium, Deluxe"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <p className="mt-2 text-xs text-gray-500">
                Separate different types with commas.
              </p>
            </div>

            {/* Colors */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Colors
              </label>

              <input
                type="text"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="Black, White, Blue"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <p className="mt-2 text-xs text-gray-500">
                Separate different colors with commas.
              </p>
            </div>

            {/* Images */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Product Images
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white p-3 text-sm"
              />

              <p className="mt-2 text-xs text-gray-500">
                You can select multiple images at once.
              </p>

              {/* Image previews */}
              {previews.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {previews.map((preview, index) => (
                    <div
                      key={preview}
                      className="overflow-hidden rounded-xl border border-gray-200"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-40 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/admin/products"
                className="rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Creating Product..."
                  : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}