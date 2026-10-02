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

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(storagePath, file);

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
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Loading product...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
        <p className="text-red-600">
          {error || "Product not found."}
        </p>

        <Link
          href="/admin/products"
          className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white"
        >
          Back to Products
        </Link>
      </main>
    );
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
              Edit Product
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
            Edit Product
          </h2>

          <p className="mt-2 text-gray-600">
            Update the information for this product.
          </p>

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            {/* Name */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Product Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Price */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Price (₦)
              </label>

              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                required
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={5}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Stock
              </label>

              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="0"
                required
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />
            </div>

            {/* Types */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Types
              </label>

              <input
                type="text"
                value={types}
                onChange={(e) => setTypes(e.target.value)}
                placeholder="Standard, Premium, Large"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <p className="mt-1 text-xs text-gray-500">
                Separate multiple types with commas.
              </p>
            </div>

            {/* Colors */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Colors
              </label>

              <input
                type="text"
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder="Black, White, Blue"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
              />

              <p className="mt-1 text-xs text-gray-500">
                Separate multiple colors with commas.
              </p>
            </div>

            {/* Existing Images */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Current Images
              </label>

              {currentImages.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {currentImages.map(
                    (image, index) => (
                      <div
                        key={image}
                        className="relative overflow-hidden rounded-lg border border-gray-200"
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${
                            index + 1
                          }`}
                          className="h-32 w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeCurrentImage(index)
                          }
                          className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  No images currently selected.
                </p>
              )}
            </div>

            {/* Add New Images */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Add New Images
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleNewImageChange}
                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700"
              />

              <p className="mt-1 text-xs text-gray-500">
                You can select multiple images.
              </p>

              {newPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {newPreviews.map(
                    (preview, index) => (
                      <div
                        key={preview}
                        className="relative overflow-hidden rounded-lg border border-gray-200"
                      >
                        <img
                          src={preview}
                          alt={`New image ${
                            index + 1
                          }`}
                          className="h-32 w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeNewImage(index)
                          }
                          className="absolute right-2 top-2 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <Link
                href="/admin/products"
                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}