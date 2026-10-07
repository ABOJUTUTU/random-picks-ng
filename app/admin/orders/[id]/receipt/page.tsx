"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
  product_id: number | null;
  product_name: string;
  product_price: number;
  customer_name: string;
  phone: string;
  email: string | null;
  state: string;
  city: string;
  address: string;
  product_type: string | null;
  color: string | null;
  quantity: number;
  additional_note: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function formatCurrency(amount: number) {
  return `₦${Number(amount).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        setError("");

        // Check admin authentication
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/admin/login");
          return;
        }

        // Get the exact order
        const { data, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .single();

        if (orderError) {
          console.error("Receipt order error:", orderError);
          setError(orderError.message);
          return;
        }

        if (!data) {
          setError("Order not found.");
          return;
        }

        setOrder(data as Order);
      } catch (err) {
        console.error("Receipt loading error:", err);
        setError("Something went wrong while loading the receipt.");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadOrder();
    }
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff7800]" />
          <p className="text-gray-600">Loading receipt...</p>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">⚠️</div>

          <h1 className="mb-2 text-xl font-bold text-gray-900">
            Unable to load receipt
          </h1>

          <p className="mb-6 text-sm text-gray-500">
            {error || "The requested order could not be found."}
          </p>

          <button
            onClick={() => router.back()}
            className="rounded-lg bg-[#071a3d] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  const total = Number(order.product_price) * Number(order.quantity);

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .receipt-page {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
          }

          .receipt {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

      <main className="receipt-page min-h-screen bg-gray-100 px-4 py-8">
        {/* Top controls */}
        <div className="no-print mx-auto mb-6 flex w-full max-w-3xl items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            ← Back to Order
          </button>

          <button
            onClick={() => window.print()}
            className="rounded-lg bg-[#ff7800] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
          >
            🧾 Print / Save Receipt
          </button>
        </div>

        {/* Receipt */}
        <section className="receipt mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-gray-200 px-8 py-8 sm:px-10">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div className="flex items-center gap-4">
                <img
                  src="/rplogo.png"
                  alt="Random Picks NG"
                  className="h-16 w-16 rounded-full object-cover"
                />

                <div>
                  <h1 className="text-2xl font-black text-[#071a3d]">
                    Random Picks NG
                  </h1>

                  <p className="mt-1 text-sm text-gray-500">
                    Official Order Receipt
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Order
                </p>

                <p className="text-xl font-black text-[#071a3d]">
                  #{order.id}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-4 sm:px-10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Order Status
              </span>

              <span className="rounded-full bg-[#071a3d] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                {order.status}
              </span>
            </div>
          </div>

          {/* Customer + Delivery */}
          <div className="grid gap-8 border-b border-gray-200 px-8 py-8 sm:grid-cols-2 sm:px-10">
            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                Customer
              </h2>

              <div className="space-y-2 text-sm">
                <p className="font-bold text-gray-900">
                  {order.customer_name}
                </p>

                <p className="text-gray-600">{order.phone}</p>

                {order.email && (
                  <p className="break-all text-gray-600">{order.email}</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                Delivery Address
              </h2>

              <div className="space-y-1 text-sm text-gray-600">
                <p>{order.address}</p>
                <p>
                  {order.city}, {order.state}
                </p>
                <p>Nigeria</p>
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="px-8 py-8 sm:px-10">
            <h2 className="mb-5 text-xs font-bold uppercase tracking-wider text-gray-400">
              Order Details
            </h2>

            <div className="overflow-hidden rounded-xl border border-gray-200">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 bg-gray-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">
                <span>Item</span>
                <span>Qty</span>
                <span className="text-right">Amount</span>
              </div>

              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-5">
                <div>
                  <p className="font-bold text-gray-900">
                    {order.product_name}
                  </p>

                  {(order.product_type || order.color) && (
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                      {order.product_type && (
                        <p>
                          <span className="font-semibold">Type:</span>{" "}
                          {order.product_type}
                        </p>
                      )}

                      {order.color && (
                        <p>
                          <span className="font-semibold">Color:</span>{" "}
                          {order.color}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="mt-2 text-sm text-gray-500">
                    {formatCurrency(Number(order.product_price))} each
                  </p>
                </div>

                <div className="text-sm font-semibold text-gray-700">
                  {order.quantity}
                </div>

                <div className="text-right text-sm font-bold text-gray-900">
                  {formatCurrency(
                    Number(order.product_price) * Number(order.quantity)
                  )}
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">
              <span className="text-base font-bold text-gray-700">
                Total
              </span>

              <span className="text-2xl font-black text-[#071a3d]">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Customer note */}
          {order.additional_note && (
            <div className="mx-8 mb-8 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 sm:mx-10">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                Customer Note
              </h2>

              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {order.additional_note}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-8 py-7 text-center sm:px-10">
            <p className="font-bold text-[#071a3d]">
              Thank you for shopping with Random Picks NG.
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Please keep this receipt for your order records.
            </p>

            <p className="mt-4 text-[11px] text-gray-400">
              Order #{order.id}
            </p>
          </div>
        </section>
      </main>
    </>
  );
}