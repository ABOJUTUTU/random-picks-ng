"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Order = {
  id: number;
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
Price: ₦${Number(order.product_price).toLocaleString()}
Total: ₦${total.toLocaleString()}

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
      setError("This order does not have a customer email address.");
      setSending(false);
      return;
    }

    try {
      const htmlMessage = message
        .replace(/\n/g, "<br />");

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          html: htmlMessage,
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
      setSending(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while sending the email."
      );
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Loading email center...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Random Picks NG
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Email Center
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Send Customer Email
          </h2>

          <p className="mt-2 text-gray-600">
            Select an order to automatically load the
            customer's information and email template.
          </p>
        </div>

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
          onSubmit={sendEmail}
          className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8"
        >
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Select Order
            </label>

            <select
              value={selectedOrderId}
              onChange={(e) =>
                handleOrderChange(e.target.value)
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black"
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

          {selectedOrderId && (
            <>
              <div className="mt-6">
                <label className="text-sm font-semibold text-gray-700">
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
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="mt-6">
                <label className="text-sm font-semibold text-gray-700">
                  Subject
                </label>

                <input
                  type="text"
                  value={subject}
                  onChange={(e) =>
                    setSubject(e.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                />
              </div>

              <div className="mt-6">
                <label className="text-sm font-semibold text-gray-700">
                  Message
                </label>

                <textarea
                  value={message}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  required
                  rows={18}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 leading-7 outline-none focus:border-black"
                />
              </div>

              <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                You can edit the recipient, subject and
                message before sending.
              </div>

              <button
                type="submit"
                disabled={sending || !to.trim()}
                className="mt-6 w-full rounded-lg bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? "Sending Email..." : "Send Email"}
              </button>
            </>
          )}

          {!selectedOrderId && orders.length === 0 && (
            <div className="mt-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              There are currently no orders available.
            </div>
          )}
        </form>
      </div>
    </main>
  );
}