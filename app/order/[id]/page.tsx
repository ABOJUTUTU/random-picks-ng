"use client";

import { useEffect, useState } from "react";
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
};

type OrderDetails = {
  orderId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  type: string | null;
  color: string | null;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  address: string;
  type: string;
  color: string;
  quantity: number;
  note: string;
};

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormState>({
    name: "",
    phone: "",
    email: "",
    state: "",
    city: "",
    address: "",
    type: "",
    color: "",
    quantity: 1,
    note: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] =
    useState<OrderDetails | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const { id } = await params;

        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          setError("Product could not be found.");
          return;
        }

        setProduct(data);
      } catch {
        setError("Something went wrong while loading the product.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [params]);

  function updateField(
    field: keyof FormState,
    value: string | number
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!product) {
      return;
    }

    setError("");

    if (form.quantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (form.quantity > product.stock) {
      setError(
        `Only ${product.stock} item(s) are currently in stock.`
      );
      return;
    }

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!form.state.trim()) {
      setError("Please enter your state.");
      return;
    }

    if (!form.city.trim()) {
      setError("Please enter your city.");
      return;
    }

    if (!form.address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc(
        "create_order",
        {
          p_product_id: product.id,
          p_product_name: product.name,
          p_product_price: product.price,
          p_customer_name: form.name,
          p_phone: form.phone,
          p_email: form.email || null,
          p_state: form.state,
          p_city: form.city,
          p_address: form.address,
          p_product_type: form.type || null,
          p_color: form.color || null,
          p_quantity: form.quantity,
          p_additional_note: form.note || null,
        }
      );

      if (error) {
        setError(
          `Order could not be placed: ${error.message}`
        );
        return;
      }

      const orderId = Number(data);

      // Send notification to Random Picks NG.
      // If the email notification fails, the order
      // itself will still remain successfully placed.
      try {
        await fetch("/api/notify-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            customerName: form.name,
            phone: form.phone,
            email: form.email || null,
            state: form.state,
            city: form.city,
            address: form.address,
            productName: product.name,
            productPrice: product.price,
            quantity: form.quantity,
            productType: form.type || null,
            color: form.color || null,
            note: form.note || null,
          }),
        });
      } catch (notificationError) {
        console.error(
          "Order notification failed:",
          notificationError
        );
      }

      setOrderSuccess({
        orderId,
        productName: product.name,
        productPrice: product.price,
        quantity: form.quantity,
        type: form.type || null,
        color: form.color || null,
      });
    } catch {
      setError(
        "Something went wrong while placing your order."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* Loading */
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

  /* Product not found */
  if (error && !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <img
            src="/rplogo.png"
            alt="Random Picks NG"
            className="mx-auto h-14 w-14 rounded-full object-cover"
          />

          <h1 className="mt-5 text-2xl font-bold text-[#071a3d]">
            Product Not Found
          </h1>

          <p className="mt-3 text-gray-600">
            {error}
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-[#071a3d] px-6 py-3 font-semibold text-white transition duration-300 hover:bg-[#ff7800]"
          >
            Back to Shopping
          </Link>
        </div>
      </main>
    );
  }

  /* Successful Order */
  if (orderSuccess) {
    const total =
      orderSuccess.productPrice *
      orderSuccess.quantity;

    return (
      <main className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
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

            <Link
              href="/"
              className="text-sm font-medium text-gray-600 transition hover:text-[#ff7800]"
            >
              Back to Store
            </Link>
          </div>
        </nav>

        {/* Success */}
        <div className="px-4 py-8 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-2xl animate-[fadeUp_0.6s_ease-out]">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm sm:rounded-3xl sm:p-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
                🎉
              </div>

              <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[#ff7800]">
                Order Successful
              </p>

              <h1 className="mt-2 text-2xl font-bold text-[#071a3d] sm:text-3xl">
                Congratulations!
              </h1>

              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                Your order has been successfully placed.
              </p>

              {/* Order Summary */}
              <div className="mt-7 rounded-xl bg-gray-50 p-4 text-left sm:mt-8 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600">
                    Order ID
                  </span>

                  <span className="font-bold text-[#071a3d]">
                    #{orderSuccess.orderId}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600">
                    Status
                  </span>

                  <span className="text-right text-sm font-semibold text-green-600">
                    Order Received
                  </span>
                </div>
              </div>

              {/* Order Details */}
              <div className="mt-5 rounded-xl border border-gray-200 p-4 text-left sm:mt-6 sm:p-5">
                <h2 className="text-lg font-bold text-[#071a3d]">
                  Order Details
                </h2>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-gray-600">
                      Product
                    </span>

                    <span className="max-w-[60%] text-right font-medium text-[#071a3d]">
                      {orderSuccess.productName}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">
                      Price
                    </span>

                    <span className="font-medium text-[#071a3d]">
                      ₦
                      {orderSuccess.productPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">
                      Quantity
                    </span>

                    <span className="font-medium text-[#071a3d]">
                      {orderSuccess.quantity}
                    </span>
                  </div>

                  {orderSuccess.type && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">
                        Type
                      </span>

                      <span className="text-right font-medium text-[#071a3d]">
                        {orderSuccess.type}
                      </span>
                    </div>
                  )}

                  {orderSuccess.color && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">
                        Color
                      </span>

                      <span className="text-right font-medium text-[#071a3d]">
                        {orderSuccess.color}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between gap-4 border-t border-gray-200 pt-3">
                    <span className="font-bold text-[#071a3d]">
                      Total
                    </span>

                    <span className="font-bold text-[#ff7800]">
                      ₦{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="mt-5 rounded-xl border border-[#ff7800]/20 bg-orange-50 p-4 text-left sm:mt-6 sm:p-5">
                <h2 className="font-bold text-[#071a3d]">
                  What happens next?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-700">
                  We have received your order. The seller/admin will
                  review your order and contact you using the phone
                  number you provided to confirm the order and delivery
                  details.
                </p>
              </div>

              <Link
                href="/"
                className="mt-7 block w-full rounded-xl bg-[#071a3d] px-7 py-4 font-semibold text-white transition duration-300 hover:-translate-y-1 hover:bg-[#ff7800] hover:shadow-lg sm:mt-8 sm:inline-block sm:w-auto"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>

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

        <style>{`
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

  if (!product) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 text-[#071a3d]">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
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

          <Link
            href={`/product/${product.id}`}
            className="text-sm font-medium text-gray-600 transition hover:text-[#ff7800]"
          >
            ← Back to Product
          </Link>
        </div>
      </nav>

      {/* Order Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Product Summary */}
          <div className="h-fit animate-[fadeIn_0.6s_ease-out] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-xl bg-gray-50 sm:rounded-2xl">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-64 w-full object-cover transition duration-500 hover:scale-105 sm:h-80"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-gray-400 sm:h-80">
                  No image available
                </div>
              )}
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[#ff7800]">
              Your Selection
            </p>

            <h1 className="mt-2 text-2xl font-bold text-[#071a3d] sm:text-3xl">
              {product.name}
            </h1>

            <p className="mt-2 text-2xl font-bold text-[#ff7800]">
              ₦{product.price.toLocaleString()}
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  product.stock > 0
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />

              <span
                className={
                  product.stock > 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {product.stock > 0
                  ? `${product.stock} item(s) available`
                  : "Out of stock"}
              </span>
            </div>

            {product.description && (
              <p className="mt-5 border-t border-gray-100 pt-5 text-sm leading-6 text-gray-600">
                {product.description}
              </p>
            )}
          </div>

          {/* Order Form */}
          <div className="animate-[fadeUp_0.6s_ease-out] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7 lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#ff7800]">
              Checkout
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#071a3d] sm:text-3xl">
              Place Your Order
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Fill in your details and we will contact you to confirm
              your order.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-7"
            >
              {/* Customer Information */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-[#071a3d]">
                  Customer Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Full Name *
                    </label>

                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        updateField("name", e.target.value)
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Phone Number *
                    </label>

                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        updateField("phone", e.target.value)
                      }
                      placeholder="08012345678"
                      autoComplete="tel"
                      inputMode="tel"
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email
                    </label>

                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        updateField("email", e.target.value)
                      }
                      placeholder="you@example.com"
                      autoComplete="email"
                      inputMode="email"
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="border-t border-gray-100 pt-7">
                <h3 className="mb-4 text-lg font-semibold text-[#071a3d]">
                  Delivery Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      State *
                    </label>

                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) =>
                        updateField("state", e.target.value)
                      }
                      placeholder="e.g. Lagos"
                      autoComplete="address-level1"
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      City *
                    </label>

                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) =>
                        updateField("city", e.target.value)
                      }
                      placeholder="e.g. Ikeja"
                      autoComplete="address-level2"
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Full Delivery Address *
                    </label>

                    <textarea
                      value={form.address}
                      onChange={(e) =>
                        updateField("address", e.target.value)
                      }
                      placeholder="Enter your complete delivery address"
                      autoComplete="street-address"
                      rows={4}
                      className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-base leading-6 outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="border-t border-gray-100 pt-7">
                <h3 className="mb-4 text-lg font-semibold text-[#071a3d]">
                  Order Details
                </h3>

                <div className="space-y-4">
                  {/* Type */}
                  {product.types && product.types.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Type
                      </label>

                      <select
                        value={form.type}
                        onChange={(e) =>
                          updateField("type", e.target.value)
                        }
                        className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                      >
                        <option value="">
                          Select a type
                        </option>

                        {product.types.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Color */}
                  {product.colors && product.colors.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Color
                      </label>

                      <select
                        value={form.color}
                        onChange={(e) =>
                          updateField("color", e.target.value)
                        }
                        className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                      >
                        <option value="">
                          Select a color
                        </option>

                        {product.colors.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Quantity *
                    </label>

                    <input
                      type="number"
                      min={1}
                      max={product.stock}
                      value={form.quantity}
                      onChange={(e) =>
                        updateField(
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      inputMode="numeric"
                      className="min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                    />
                  </div>

                  {/* Additional Note */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Additional Note
                    </label>

                    <textarea
                      value={form.note}
                      onChange={(e) =>
                        updateField("note", e.target.value)
                      }
                      placeholder="Any additional information?"
                      rows={3}
                      className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-base leading-6 outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-[#ff7800]/10"
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {error}
                </div>
              )}

              {/* Order Total */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                <div className="flex justify-between gap-4 text-sm text-gray-600">
                  <span>Price</span>

                  <span>
                    ₦{product.price.toLocaleString()}
                  </span>
                </div>

                <div className="mt-2 flex justify-between gap-4 text-sm text-gray-600">
                  <span>Quantity</span>

                  <span>{form.quantity}</span>
                </div>

                <div className="mt-3 flex justify-between gap-4 border-t border-gray-200 pt-3 text-lg font-bold text-[#071a3d]">
                  <span>Total</span>

                  <span className="text-[#ff7800]">
                    ₦
                    {(
                      product.price *
                      form.quantity
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  product.stock <= 0
                }
                className="min-h-14 w-full rounded-xl bg-[#071a3d] px-6 py-4 text-base font-semibold text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-[#ff7800] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {submitting
                  ? "Placing Order..."
                  : product.stock <= 0
                    ? "Out of Stock"
                    : "Place Order"}
              </button>
            </form>
          </div>
        </div>
      </div>

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