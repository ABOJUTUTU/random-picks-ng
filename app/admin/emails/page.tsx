"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  updated_at?: string;
};

export default function AdminEmailsPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(`Could not load orders: ${error.message}`);
        setLoading(false);
        return;
      }

      setOrders(data || []);
      setLoading(false);
    }

    loadOrders();
  }, [router]);

  function createEmailTemplate(order: Order) {
    const total =
      Number(order.product_price) * order.quantity;

    return `Hello ${order.customer_name},

Thank you for shopping with Random Picks NG.

Your order #${order.id} has been received and is currently ${order.status}.

Order Details:
Product: ${order.product_name}
Quantity: ${order.quantity}
Price: ₦${Number(
      order.product_price
    ).toLocaleString()}
Total: ₦${total.toLocaleString()}${
      order.product_type
        ? `\nType: ${order.product_type}`
        : ""
    }${
      order.color
        ? `\nColor: ${order.color}`
        : ""
    }

Delivery Information:
State: ${order.state}
City: ${order.city}
Address: ${order.address}

We will keep you updated about your order.

Thank you for choosing Random Picks NG.

Best regards,
Random Picks NG`;
  }

  function handleOrderChange(orderId: string) {
    setSelectedOrderId(orderId);
    setError("");
    setSuccess("");

    const order = orders.find(
      (item) => String(item.id) === orderId
    );

    if (!order) {
      setTo("");
      setSubject("");
      setMessage("");
      return;
    }

    setTo(order.email || "");

    setSubject(
      `Order #${order.id} - Random Picks NG`
    );

    setMessage(createEmailTemplate(order));
  }

  async function sendEmail(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSending(true);
    setError("");
    setSuccess("");

    if (!to.trim()) {
      setError(
        "This order does not have a customer email address."
      );
      setSending(false);
      return;
    }

    if (!subject.trim()) {
      setError("Please enter an email subject.");
      setSending(false);
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message.");
      setSending(false);
      return;
    }

    const selectedOrder = orders.find(
      (order) =>
        String(order.id) === selectedOrderId
    );

    if (!selectedOrder) {
      setError("Please select a valid order.");
      setSending(false);
      return;
    }

    if (!selectedOrder.email) {
      setError(
        "This order does not have a customer email address."
      );
      setSending(false);
      return;
    }

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: to.trim(),
          customerName: selectedOrder.customer_name,
          subject: subject.trim(),
          message: message.trim(),

          // Send the complete order to the new email API.
          // The API uses this to build the branded email
          // and retrieve the product image.
          order: selectedOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Could not send email."
        );
      }

      setSuccess(
        `Email sent successfully to ${to.trim()}.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while sending the email."
      );
    } finally {
      setSending(false);
    }
  }

  const selectedOrder = orders.find(
    (order) => String(order.id) === selectedOrderId
  );

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff7800]" />

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading email center...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-gray-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/admin"
            className="flex items-center"
          >
            <img
              src="/rplogo.png"
              alt="Random Picks NG"
              className="h-11 w-11 rounded-full object-cover"
            />

            <div className="ml-3 hidden sm:block">
              <p className="font-bold text-[#071a3d]">
                Random Picks NG
              </p>

              <p className="text-xs text-gray-500">
                Admin Panel
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-[#071a3d] transition hover:border-[#ff7800] hover:text-[#ff7800] sm:px-4"
            >
              <span className="hidden sm:inline">
                ← Orders
              </span>

              <span className="sm:hidden">
                Orders
              </span>
            </Link>

            <Link
              href="/admin"
              className="rounded-xl bg-[#071a3d] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#ff7800] sm:px-4"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {/* PAGE HEADER */}
        <section className="rounded-3xl bg-[#071a3d] p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-[#ff7800]">
                Communication
              </p>

              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Email Center
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                Send professional order updates and
                messages directly to your customers.
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-3xl">
              ✉️
            </div>
          </div>
        </section>

        {/* ALERTS */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            <span className="text-lg">!</span>

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
            <span className="text-lg">✓</span>

            <span>{success}</span>
          </div>
        )}

        {/* MAIN CONTENT */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* ORDER SELECTOR */}
          <section className="h-fit rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                📦
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                  Recipient
                </p>

                <h2 className="text-xl font-bold text-[#071a3d]">
                  Select an Order
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-6 text-gray-500">
              Select an order to automatically load the
              customer's email address and a ready-made
              message.
            </p>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                Order
              </label>

              <select
                value={selectedOrderId}
                onChange={(e) =>
                  handleOrderChange(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#ff7800] focus:ring-4 focus:ring-orange-50"
              >
                <option value="">
                  Select an order
                </option>

                {orders.map((order) => (
                  <option
                    key={order.id}
                    value={order.id}
                  >
                    Order #{order.id} —{" "}
                    {order.customer_name}
                    {order.email
                      ? ` — ${order.email}`
                      : " — No email"}
                  </option>
                ))}
              </select>
            </div>

            {/* SELECTED ORDER SUMMARY */}
            {selectedOrder && (
              <div className="mt-6 rounded-2xl bg-[#071a3d] p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                  Selected Order
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  #{selectedOrder.id}
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-blue-200">
                      Customer
                    </span>

                    <span className="text-right font-semibold">
                      {selectedOrder.customer_name}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-blue-200">
                      Product
                    </span>

                    <span className="text-right font-semibold">
                      {selectedOrder.product_name}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-blue-200">
                      Status
                    </span>

                    <span className="capitalize text-right font-semibold text-[#ff7800]">
                      {selectedOrder.status}
                    </span>
                  </div>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  {selectedOrder.email ? (
                    <p className="break-all text-sm text-blue-100">
                      ✉️ {selectedOrder.email}
                    </p>
                  ) : (
                    <p className="text-sm text-orange-200">
                      ⚠️ No email address provided
                    </p>
                  )}
                </div>
              </div>
            )}

            {!selectedOrderId &&
              orders.length === 0 && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800">
                  There are currently no orders available.
                </div>
              )}
          </section>

          {/* EMAIL COMPOSER */}
          <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                ✍️
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                  Composer
                </p>

                <h2 className="text-xl font-bold text-[#071a3d]">
                  Compose Email
                </h2>
              </div>
            </div>

            {!selectedOrderId ? (
              <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 text-center">
                <div className="text-5xl">✉️</div>

                <h3 className="mt-4 text-lg font-bold text-[#071a3d]">
                  Select an order first
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                  Choose an order from the left to load the
                  customer's information and start composing
                  an email.
                </p>
              </div>
            ) : (
              <form
                onSubmit={sendEmail}
                className="mt-6"
              >
                <div className="space-y-5">
                  {/* TO */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                      To
                    </label>

                    <input
                      type="email"
                      value={to}
                      onChange={(e) =>
                        setTo(e.target.value)
                      }
                      required
                      placeholder="customer@example.com"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:ring-4 focus:ring-orange-50"
                    />
                  </div>

                  {/* SUBJECT */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                      Subject
                    </label>

                    <input
                      type="text"
                      value={subject}
                      onChange={(e) =>
                        setSubject(e.target.value)
                      }
                      required
                      placeholder="Email subject"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:ring-4 focus:ring-orange-50"
                    />
                  </div>

                  {/* MESSAGE */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-bold text-[#071a3d]">
                        Message
                      </label>

                      <span className="text-xs text-gray-400">
                        Editable
                      </span>
                    </div>

                    <textarea
                      value={message}
                      onChange={(e) =>
                        setMessage(e.target.value)
                      }
                      required
                      rows={18}
                      className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3.5 leading-7 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:ring-4 focus:ring-orange-50"
                    />
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                    <span className="font-bold text-[#071a3d]">
                      Tip:
                    </span>{" "}
                    The message is automatically generated
                    from the selected order, but you can
                    edit the recipient, subject and message
                    before sending.
                  </div>

                  <button
                    type="submit"
                    disabled={sending || !to.trim()}
                    className="flex w-full items-center justify-center rounded-xl bg-[#ff7800] px-6 py-4 font-bold text-white transition hover:bg-[#e96d00] disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {sending ? (
                      <>
                        <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Sending Email...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">
                          ✈️
                        </span>
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>

        {/* QUICK INFO */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Available Orders
            </p>

            <p className="mt-2 text-2xl font-extrabold text-[#071a3d]">
              {orders.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Orders With Email
            </p>

            <p className="mt-2 text-2xl font-extrabold text-[#071a3d]">
              {
                orders.filter(
                  (order) => order.email
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Ready to Contact
            </p>

            <p className="mt-2 text-2xl font-extrabold text-[#ff7800]">
              {
                orders.filter(
                  (order) => order.email
                ).length
              }
            </p>
          </div>
        </section>

        {/* BOTTOM NAVIGATION */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            href="/admin"
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-center font-semibold text-[#071a3d] transition hover:border-[#ff7800] hover:text-[#ff7800]"
          >
            ← Back to Dashboard
          </Link>

          <Link
            href="/admin/orders"
            className="rounded-xl bg-[#071a3d] px-6 py-3 text-center font-semibold text-white transition hover:bg-[#ff7800]"
          >
            View Orders
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/rplogo.png"
              alt="Random Picks NG"
              className="h-9 w-9 rounded-full object-cover"
            />

            <p className="text-sm font-semibold text-[#071a3d]">
              Random Picks NG
            </p>
          </div>

          <p className="text-xs text-gray-400">
            Random Picks NG Admin Panel
          </p>
        </div>
      </footer>
    </main>
  );
}