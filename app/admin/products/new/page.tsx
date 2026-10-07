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
    <main className="min-h-screen bg-[#f7f8fb] text-[#071a3d]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/admin/products"
            className="flex items-center gap-3"
          >
            <img
              src="/rplogo.png"
              alt="Random Picks NG"
              className="h-11 w-11 rounded-full object-contain"
            />

            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-[#071a3d] sm:text-xl">
                Random Picks NG
              </h1>

              <p className="text-xs font-medium text-gray-500">
                Product Management
              </p>
            </div>
          </Link>

          <Link
            href="/admin/products"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#071a3d] shadow-sm transition hover:border-[#ff7800] hover:bg-orange-50"
          >
            ← Products
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Page heading */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#ff7800]">
            <span className="h-2 w-2 rounded-full bg-[#ff7800]" />
            Inventory
          </div>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#071a3d] sm:text-4xl">
            Add New Product
          </h2>

          <p className="mt-2 max-w-2xl text-gray-600">
            Add a product to your Random Picks NG storefront.
            Fill in the product details, upload images, and set
            your available stock.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
              !
            </span>

            <div>
              <p className="font-bold">Something went wrong</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main information */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic information */}
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                      📦
                    </div>

                    <div>
                      <h3 className="font-bold text-[#071a3d]">
                        Basic Information
                      </h3>

                      <p className="text-sm text-gray-500">
                        The main details customers will see.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                      Product Name
                      <span className="ml-1 text-[#ff7800]">
                        *
                      </span>
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Premium Sneakers"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>

                  {/* Price + Stock */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                        Price (₦)
                        <span className="ml-1 text-[#ff7800]">
                          *
                        </span>
                      </label>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#ff7800]">
                          ₦
                        </span>

                        <input
                          type="number"
                          min="0"
                          value={price}
                          onChange={(e) =>
                            setPrice(e.target.value)
                          }
                          placeholder="45000"
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                        Stock Quantity
                        <span className="ml-1 text-[#ff7800]">
                          *
                        </span>
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) =>
                          setStock(e.target.value)
                        }
                        placeholder="20"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                      Description
                    </label>

                    <textarea
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      placeholder="Describe the product, its features, materials, benefits, or anything customers should know..."
                      rows={6}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      Give customers enough information to
                      understand what they are buying.
                    </p>
                  </div>
                </div>
              </section>

              {/* Variations */}
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                      🎨
                    </div>

                    <div>
                      <h3 className="font-bold text-[#071a3d]">
                        Product Options
                      </h3>

                      <p className="text-sm text-gray-500">
                        Add types and colors customers can
                        choose from.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Types */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                      Types
                    </label>

                    <input
                      type="text"
                      value={types}
                      onChange={(e) => setTypes(e.target.value)}
                      placeholder="Standard, Premium, Deluxe"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      Separate each option with a comma.
                    </p>

                    {types.trim() && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {types
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-[#ff7800]"
                            >
                              {item}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Colors */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                      Colors
                    </label>

                    <input
                      type="text"
                      value={colors}
                      onChange={(e) =>
                        setColors(e.target.value)
                      }
                      placeholder="Black, White, Blue"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      Separate each color with a comma.
                    </p>

                    {colors.trim() && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {colors
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-[#071a3d]/5 px-3 py-1.5 text-xs font-semibold text-[#071a3d]"
                            >
                              {item}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Images */}
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                      🖼️
                    </div>

                    <div>
                      <h3 className="font-bold text-[#071a3d]">
                        Product Images
                      </h3>

                      <p className="text-sm text-gray-500">
                        Upload clear images of your product.
                      </p>
                    </div>
                  </div>
                </div>

                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center transition hover:border-[#ff7800] hover:bg-orange-50/40">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition group-hover:scale-105">
                    📷
                  </div>

                  <p className="mt-4 font-bold text-[#071a3d]">
                    Choose product images
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Select multiple images at once
                  </p>

                  <span className="mt-4 rounded-xl bg-[#071a3d] px-4 py-2 text-xs font-bold text-white transition group-hover:bg-[#ff7800]">
                    Browse Files
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {images.length > 0 && (
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
                    <span className="text-sm font-semibold text-[#071a3d]">
                      {images.length}{" "}
                      {images.length === 1
                        ? "image selected"
                        : "images selected"}
                    </span>

                    <span className="text-xs font-medium text-[#ff7800]">
                      Ready to upload
                    </span>
                  </div>
                )}

                {previews.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {previews.map((preview, index) => (
                      <div
                        key={preview}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                      >
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        {index === 0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-[#ff7800] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            Main Image
                          </span>
                        )}

                        <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-4 text-xs text-gray-400">
                  The first selected image will be used as the
                  main product image.
                </p>
              </section>
            </div>

            {/* Side summary */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                {/* Preview card */}
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                  <div className="bg-[#071a3d] px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
                      Product Preview
                    </p>

                    <h3 className="mt-1 font-bold text-white">
                      How it will look
                    </h3>
                  </div>

                  <div className="p-5">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                      {previews[0] ? (
                        <img
                          src={previews[0]}
                          alt="Product preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-5xl">
                            📦
                          </div>

                          <p className="mt-3 text-sm font-medium text-gray-400">
                            Product image preview
                          </p>
                        </div>
                      )}
                    </div>

                    <h4 className="mt-4 text-lg font-bold text-[#071a3d]">
                      {name.trim() || "Product Name"}
                    </h4>

                    <p className="mt-1 text-xl font-extrabold text-[#ff7800]">
                      {price
                        ? `₦${Number(price).toLocaleString()}`
                        : "₦0"}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                      <span className="text-gray-500">
                        Stock
                      </span>

                      <span className="font-bold text-[#071a3d]">
                        {stock || "0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Publishing checklist */}
                <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-[#071a3d]">
                    Before you publish
                  </h3>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex gap-3">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          name.trim()
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        ✓
                      </span>

                      <span className="text-gray-600">
                        Product name added
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          price
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        ✓
                      </span>

                      <span className="text-gray-600">
                        Price added
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          stock
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        ✓
                      </span>

                      <span className="text-gray-600">
                        Stock quantity added
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          images.length > 0
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        ✓
                      </span>

                      <span className="text-gray-600">
                        Product image selected
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          {/* Bottom actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <Link
              href="/admin/products"
              className="rounded-xl border border-gray-200 px-6 py-3 text-center text-sm font-bold text-[#071a3d] transition hover:border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="group flex items-center justify-center gap-2 rounded-xl bg-[#071a3d] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#ff7800] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating Product...
                </>
              ) : (
                <>
                  Create Product
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/rplogo.png"
              alt="Random Picks NG"
              className="h-9 w-9 rounded-full object-contain"
            />

            <div>
              <p className="text-sm font-bold text-[#071a3d]">
                Random Picks NG
              </p>

              <p className="text-xs text-gray-500">
                Admin Product Management
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Random Picks NG
          </p>
        </div>
      </footer>
    </main>
  );
}