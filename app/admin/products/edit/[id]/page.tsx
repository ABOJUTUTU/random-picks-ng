"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  price: number;
  description: string | null;
  types: string[];
  colors: string[];
  stock: number;
  images: string[];
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [types, setTypes] = useState("");
  const [colors, setColors] = useState("");

  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProduct() {
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
        .eq("id", id)
        .single();

      if (error) {
        setError(`Could not load product: ${error.message}`);
        setLoading(false);
        return;
      }

      setProduct(data);

      setName(data.name);
      setPrice(String(data.price));
      setDescription(data.description || "");
      setStock(String(data.stock));
      setTypes(data.types?.join(", ") || "");
      setColors(data.colors?.join(", ") || "");
      setCurrentImages(data.images || []);

      setLoading(false);
    }

    loadProduct();
  }, [id, router]);

  function handleNewImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);

    setNewImages(files);

    const previewUrls = files.map((file) =>
      URL.createObjectURL(file)
    );

    setNewPreviews(previewUrls);
  }

  function removeCurrentImage(index: number) {
    setCurrentImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  }

  function removeNewImage(index: number) {
    setNewImages((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );

    setNewPreviews((previous) =>
      previous.filter((_, imageIndex) => imageIndex !== index)
    );
  }

  function getStoragePathFromUrl(url: string) {
    const marker =
      "/storage/v1/object/public/product-images/";

    const index = url.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(
      url.slice(index + marker.length)
    );
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Please enter a product name.");
      setSaving(false);
      return;
    }

    if (!price || Number(price) < 0) {
      setError("Please enter a valid price.");
      setSaving(false);
      return;
    }

    if (!stock || Number(stock) < 0) {
      setError("Please enter a valid stock quantity.");
      setSaving(false);
      return;
    }

    const cleanedTypes = types
      .split(",")
      .map((type) => type.trim())
      .filter(Boolean);

    const cleanedColors = colors
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);

    const originalImages = product?.images || [];

    const removedImages = originalImages.filter(
      (image) => !currentImages.includes(image)
    );

    const uploadedPaths: string[] = [];
    const uploadedUrls: string[] = [];

    try {
      // Upload new images
      for (const file of newImages) {
        const fileExtension =
          file.name.split(".").pop() || "jpg";

        const fileName = `${crypto.randomUUID()}.${fileExtension}`;

        const storagePath = `${id}/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("product-images")
            .upload(storagePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          throw new Error(
            `Could not upload image: ${uploadError.message}`
          );
        }

        uploadedPaths.push(storagePath);

        const { data } = supabase.storage
          .from("product-images")
          .getPublicUrl(storagePath);

        uploadedUrls.push(data.publicUrl);
      }

      const finalImages = [
        ...currentImages,
        ...uploadedUrls,
      ];

      // Update product
      const { error: updateError } = await supabase
        .from("products")
        .update({
          name: name.trim(),
          price: Number(price),
          description: description.trim() || null,
          stock: Number(stock),
          types: cleanedTypes,
          colors: cleanedColors,
          images: finalImages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", Number(id));

      if (updateError) {
        throw new Error(
          `Could not update product: ${updateError.message}`
        );
      }

      // Delete removed images from Storage
      const removedPaths = removedImages
        .map(getStoragePathFromUrl)
        .filter(
          (path): path is string => path !== null
        );

      if (removedPaths.length > 0) {
        const { error: deleteError } =
          await supabase.storage
            .from("product-images")
            .remove(removedPaths);

        if (deleteError) {
          console.error(
            "Could not delete removed images:",
            deleteError.message
          );
        }
      }

      setProduct((previous) =>
        previous
          ? {
              ...previous,
              name: name.trim(),
              price: Number(price),
              description: description.trim() || null,
              stock: Number(stock),
              types: cleanedTypes,
              colors: cleanedColors,
              images: finalImages,
            }
          : previous
      );

      setCurrentImages(finalImages);
      setNewImages([]);
      setNewPreviews([]);

      setSuccess("Product updated successfully.");
      setSaving(false);

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err) {
      // Clean up newly uploaded files if something failed
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from("product-images")
          .remove(uploadedPaths);
      }

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the product."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff7800]" />

          <p className="mt-4 text-sm font-semibold text-[#071a3d]">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8fb] px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
          ⚠️
        </div>

        <h1 className="mt-5 text-2xl font-extrabold text-[#071a3d]">
          Product not found
        </h1>

        <p className="mt-2 max-w-md text-sm text-gray-500">
          {error ||
            "We could not find the product you are trying to edit."}
        </p>

        <Link
          href="/admin/products"
          className="mt-6 rounded-xl bg-[#071a3d] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#ff7800]"
        >
          ← Back to Products
        </Link>
      </main>
    );
  }

  const allPreviewImages = [
    ...currentImages,
    ...newPreviews,
  ];

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
        {/* Heading */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#ff7800]">
            <span className="h-2 w-2 rounded-full bg-[#ff7800]" />
            Inventory
          </div>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#071a3d] sm:text-4xl">
                Edit Product
              </h2>

              <p className="mt-2 max-w-2xl text-gray-600">
                Update the details, options, stock, and images
                for this product.
              </p>
            </div>

            <span className="w-fit rounded-full bg-[#071a3d]/5 px-3 py-1.5 text-xs font-bold text-[#071a3d]">
              Product ID: {product.id}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
              !
            </span>

            <div>
              <p className="font-bold">Unable to save changes</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 shadow-sm">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold">
              ✓
            </span>

            <div>
              <p className="font-bold">Changes saved</p>
              <p className="mt-1">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Information */}
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                    📦
                  </div>

                  <div>
                    <h3 className="font-bold text-[#071a3d]">
                      Basic Information
                    </h3>

                    <p className="text-sm text-gray-500">
                      Update the information customers see.
                    </p>
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
                      required
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
                          value={price}
                          onChange={(e) =>
                            setPrice(e.target.value)
                          }
                          min="0"
                          required
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
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
                        value={stock}
                        onChange={(e) =>
                          setStock(e.target.value)
                        }
                        min="0"
                        required
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
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
                      rows={6}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />
                  </div>
                </div>
              </section>

              {/* Product Options */}
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                    🎨
                  </div>

                  <div>
                    <h3 className="font-bold text-[#071a3d]">
                      Product Options
                    </h3>

                    <p className="text-sm text-gray-500">
                      Update available types and colors.
                    </p>
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
                      placeholder="Standard, Premium, Large"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      Separate multiple types with commas.
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
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-[#ff7800] focus:bg-white focus:ring-4 focus:ring-orange-100"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      Separate multiple colors with commas.
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

              {/* Current Images */}
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                      🖼️
                    </div>

                    <div>
                      <h3 className="font-bold text-[#071a3d]">
                        Current Images
                      </h3>

                      <p className="text-sm text-gray-500">
                        Remove images you no longer want.
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#071a3d]/5 px-3 py-1.5 text-xs font-bold text-[#071a3d]">
                    {currentImages.length}{" "}
                    {currentImages.length === 1
                      ? "image"
                      : "images"}
                  </span>
                </div>

                {currentImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {currentImages.map((image, index) => (
                      <div
                        key={image}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        {index === 0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-[#ff7800] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                            Main Image
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            removeCurrentImage(index)
                          }
                          className="absolute right-2 top-2 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
                        >
                          Remove
                        </button>

                        <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
                    <div className="text-4xl">
                      🖼️
                    </div>

                    <p className="mt-3 text-sm font-semibold text-gray-500">
                      No current images
                    </p>
                  </div>
                )}
              </section>

              {/* Add New Images */}
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-lg">
                    ➕
                  </div>

                  <div>
                    <h3 className="font-bold text-[#071a3d]">
                      Add New Images
                    </h3>

                    <p className="text-sm text-gray-500">
                      Add additional product images.
                    </p>
                  </div>
                </div>

                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center transition hover:border-[#ff7800] hover:bg-orange-50/40">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm transition group-hover:scale-105">
                    📷
                  </div>

                  <p className="mt-4 font-bold text-[#071a3d]">
                    Choose additional images
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    You can select multiple images
                  </p>

                  <span className="mt-4 rounded-xl bg-[#071a3d] px-4 py-2 text-xs font-bold text-white transition group-hover:bg-[#ff7800]">
                    Browse Files
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleNewImageChange}
                    className="hidden"
                  />
                </label>

                {newImages.length > 0 && (
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
                    <span className="text-sm font-semibold text-[#071a3d]">
                      {newImages.length}{" "}
                      {newImages.length === 1
                        ? "new image"
                        : "new images"}{" "}
                      selected
                    </span>

                    <span className="text-xs font-bold text-[#ff7800]">
                      Ready to upload
                    </span>
                  </div>
                )}

                {newPreviews.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {newPreviews.map((preview, index) => (
                      <div
                        key={preview}
                        className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100"
                      >
                        <img
                          src={preview}
                          alt={`New image ${index + 1}`}
                          className="h-40 w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeNewImage(index)
                          }
                          className="absolute right-2 top-2 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
                        >
                          Remove
                        </button>

                        <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                          New {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 space-y-5">
                {/* Product Preview */}
                <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                  <div className="bg-[#071a3d] px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
                      Live Preview
                    </p>

                    <h3 className="mt-1 font-bold text-white">
                      Product Overview
                    </h3>
                  </div>

                  <div className="p-5">
                    <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100">
                      {allPreviewImages[0] ? (
                        <img
                          src={allPreviewImages[0]}
                          alt={name || product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">
                          📦
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

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">
                          Stock
                        </p>

                        <p className="mt-1 font-bold text-[#071a3d]">
                          {stock || "0"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <p className="text-xs text-gray-400">
                          Images
                        </p>

                        <p className="mt-1 font-bold text-[#071a3d]">
                          {allPreviewImages.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options summary */}
                <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-[#071a3d]">
                    Product Options
                  </h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Types
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {types
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#ff7800]"
                            >
                              {item}
                            </span>
                          ))}

                        {!types.trim() && (
                          <span className="text-sm text-gray-400">
                            None added
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Colors
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {colors
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean)
                          .map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-[#071a3d]/5 px-2.5 py-1 text-xs font-semibold text-[#071a3d]"
                            >
                              {item}
                            </span>
                          ))}

                        {!colors.trim() && (
                          <span className="text-sm text-gray-400">
                            None added
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save reminder */}
                <div className="rounded-3xl border border-orange-100 bg-orange-50 p-5">
                  <div className="flex gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm shadow-sm">
                      💡
                    </span>

                    <div>
                      <p className="text-sm font-bold text-[#071a3d]">
                        Remember
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-600">
                        Removing an image here also removes it
                        from your product image storage after
                        the changes are saved.
                      </p>
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
              disabled={saving}
              className="group flex items-center justify-center gap-2 rounded-xl bg-[#071a3d] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#ff7800] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving Changes...
                </>
              ) : (
                <>
                  Save Changes
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