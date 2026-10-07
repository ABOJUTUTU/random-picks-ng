"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  updated_at: string;
};

const statuses = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function generateEmailTemplate(order: Order) {
  const total = Number(order.product_price) * order.quantity;

  const totalFormatted = `₦${total.toLocaleString()}`;
  const priceFormatted = `₦${Number(
    order.product_price
  ).toLocaleString()}`;

  let subject = "";
  let message = "";

  switch (order.status) {
    case "pending":
      subject = `We've received your order #${order.id}`;
      message = `Dear ${order.customer_name},

Thank you for shopping with Random Picks NG.

We have received your order and it is currently pending confirmation.

Order Details:
Order Number: #${order.id}
Product: ${order.product_name}
Quantity: ${order.quantity}
Unit Price: ${priceFormatted}
Total: ${totalFormatted}${
        order.product_type ? `\nType: ${order.product_type}` : ""
      }${
        order.color ? `\nColor: ${order.color}` : ""
      }

Delivery Location:
${order.city}, ${order.state}
${order.address}

We will update you once your order has been confirmed.

Thank you for choosing Random Picks NG.`;
      break;

    case "confirmed":
      subject = `Your order #${order.id} has been confirmed`;
      message = `Dear ${order.customer_name},

Good news! Your order with Random Picks NG has been confirmed.

Order Details:
Order Number: #${order.id}
Product: ${order.product_name}
Quantity: ${order.quantity}
Unit Price: ${priceFormatted}
Total: ${totalFormatted}${
        order.product_type ? `\nType: ${order.product_type}` : ""
      }${
        order.color ? `\nColor: ${order.color}` : ""
      }

Delivery Location:
${order.city}, ${order.state}
${order.address}

We will keep you updated as your order moves through the next stage.

Thank you for shopping with Random Picks NG.`;
      break;

    case "processing":
      subject = `Your order #${order.id} is being prepared`;
      message = `Dear ${order.customer_name},

Your order with Random Picks NG is now being prepared.

Order Details:
Order Number: #${order.id}
Product: ${order.product_name}
Quantity: ${order.quantity}
Unit Price: ${priceFormatted}
Total: ${totalFormatted}${
        order.product_type ? `\nType: ${order.product_type}` : ""
      }${
        order.color ? `\nColor: ${order.color}` : ""
      }

Delivery Location:
${order.city}, ${order.state}
${order.address}

We will notify you when your order has been shipped.

Thank you for choosing Random Picks NG.`;
      break;

    case "shipped":
      subject = `Your order #${order.id} has been shipped`;
      message = `Dear ${order.customer_name},

Your order with Random Picks NG has been shipped.

Order Details:
Order Number: #${order.id}
Product: ${order.product_name}
Quantity: ${order.quantity}
Unit Price: ${priceFormatted}
Total: ${totalFormatted}${
        order.product_type ? `\nType: ${order.product_type}` : ""
      }${
        order.color ? `\nColor: ${order.color}` : ""
      }

Delivery Location:
${order.city}, ${order.state}
${order.address}

Your order is now on its way.

Thank you for shopping with Random Picks NG.`;
      break;

    case "delivered":
      subject = `Your order #${order.id} has been delivered`;
      message = `Dear ${order.customer_name},

Your order with Random Picks NG has been marked as delivered.

Order Details:
Order Number: #${order.id}
Product: ${order.product_name}
Quantity: ${order.quantity}
Unit Price: ${priceFormatted}
Total: ${totalFormatted}${
        order.product_type ? `\nType: ${order.product_type}` : ""
      }${
        order.color ? `\nColor: ${order.color}` : ""
      }

We hope you are happy with your purchase.

Thank you for choosing Random Picks NG. We appreciate your business.`;
      break;

    case "cancelled":
      subject = `Your order #${order.id} has been cancelled`;
      message = `Dear ${order.customer_name},

We are writing to let you know that your order with Random Picks NG has been cancelled.

Order Details:
Order Number: #${order.id}
Product: ${order.product_name}
Quantity: ${order.quantity}
Unit Price: ${priceFormatted}
Total: ${totalFormatted}${
        order.product_type ? `\nType: ${order.product_type}` : ""
      }${
        order.color ? `\nColor: ${order.color}` : ""
      }

If you have any questions about this cancellation, please contact Random Picks NG.

Thank you.`;
      break;

    default:
      subject = `Update regarding your order #${order.id}`;
      message = `Dear ${order.customer_name},

We have an update regarding your order with Random Picks NG.

Order Number: #${order.id}
Product: ${order.product_name}
Quantity: ${order.quantity}
Total: ${totalFormatted}

Current Status: ${order.status}

Thank you for choosing Random Picks NG.`;
  }

  return { subject, message };
}

function getStatusStyle(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "confirmed":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "processing":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "shipped":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";

    case "delivered":
      return "bg-green-50 text-green-700 border-green-200";

    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getStatusDot(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-500";

    case "confirmed":
      return "bg-blue-500";

    case "processing":
      return "bg-purple-500";

    case "shipped":
      return "bg-indigo-500";

    case "delivered":
      return "bg-green-500";

    case "cancelled":
      return "bg-red-500";

    default:
      return "bg-gray-500";
  }
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    async function loadOrder() {
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
        .eq("id", id)
        .single();

      if (error) {
        setError(`Could not load order: ${error.message}`);
        setLoading(false);
        return;
      }

      setOrder(data);

      const template = generateEmailTemplate(data);

      setEmailSubject(template.subject);
      setEmailMessage(template.message);

      setLoading(false);
    }

    loadOrder();
  }, [id, router]);

  async function updateStatus(newStatus: string) {
    if (!order) return;

    setUpdating(true);
    setError("");

    const updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        updated_at: updatedAt,
      })
      .eq("id", order.id);

    if (error) {
      setError(`Could not update order: ${error.message}`);
      setUpdating(false);
      return;
    }

    const updatedOrder = {
      ...order,
      status: newStatus,
      updated_at: updatedAt,
    };

    setOrder(updatedOrder);

    const template = generateEmailTemplate(updatedOrder);

    setEmailSubject(template.subject);
    setEmailMessage(template.message);

    setEmailSuccess("");
    setEmailError("");

    setUpdating(false);
  }

  async function sendEmail() {
    if (!order) return;

    setEmailSuccess("");
    setEmailError("");

    if (!order.email) {
      setEmailError(
        "This customer did not provide an email address."
      );
      return;
    }

    if (!emailSubject.trim()) {
      setEmailError("Please enter an email subject.");
      return;
    }

    if (!emailMessage.trim()) {
      setEmailError("Please enter your message.");
      return;
    }

    setSendingEmail(true);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: order.email,
          customerName: order.customer_name,
          subject: emailSubject,
          message: emailMessage,

          // Send the complete order so the API can build
          // the branded order email and retrieve the product image.
          order,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setEmailError(
          result.error || "Could not send email."
        );
        return;
      }

      setEmailSuccess(
        `Email sent successfully to ${order.email}.`
      );

      setEmailSubject("");
      setEmailMessage("");
    } catch {
      setEmailError(
        "Something went wrong while sending the email."
      );
    } finally {
      setSendingEmail(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fb]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff7800]" />

          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading order...
          </p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8fb] px-6">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-2xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[#071a3d]">
            Order not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error || "We could not find this order."}
          </p>

          <Link
            href="/admin/orders"
            className="mt-6 inline-flex rounded-xl bg-[#071a3d] px-6 py-3 font-semibold text-white transition hover:bg-[#ff7800]"
          >
            ← Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  const total =
    Number(order.product_price) * order.quantity;

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-gray-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center">
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
              ←{" "}
              <span className="hidden sm:inline">
                All Orders
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
        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* PAGE HEADER */}
        <section className="rounded-3xl bg-[#071a3d] p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#ff7800]">
                Order Details
              </p>

              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">
                Order #{order.id}
              </h1>

              <p className="mt-2 text-sm text-blue-100">
                Placed{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>

            <div
              className={`flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${getStatusStyle(
                order.status
              )}`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${getStatusDot(
                  order.status
                )}`}
              />

              {formatStatus(order.status)}
            </div>
          </div>
        </section>

        {/* STATUS */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                Order Progress
              </p>

              <h2 className="mt-1 text-xl font-bold text-[#071a3d]">
                Update Order Status
              </h2>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <select
                value={order.status}
                disabled={updating}
                onChange={(event) =>
                  updateStatus(event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-[#071a3d] outline-none transition focus:border-[#ff7800] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-52"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatus(status)}
                  </option>
                ))}
              </select>

              {updating && (
                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-[#ff7800]" />
                  Updating...
                </div>
              )}
            </div>
          </div>

          {/* STATUS STEPS */}
          <div className="mt-8 hidden grid-cols-5 gap-2 md:grid">
            {[
              "pending",
              "confirmed",
              "processing",
              "shipped",
              "delivered",
            ].map((status, index) => {
              const currentIndex = [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
              ].indexOf(order.status);

              const active = index <= currentIndex;

              return (
                <div key={status}>
                  <div
                    className={`h-1.5 rounded-full ${
                      active
                        ? "bg-[#ff7800]"
                        : "bg-gray-100"
                    }`}
                  />

                  <p
                    className={`mt-2 text-xs font-semibold ${
                      active
                        ? "text-[#071a3d]"
                        : "text-gray-400"
                    }`}
                  >
                    {formatStatus(status)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CUSTOMER + DELIVERY */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* CUSTOMER */}
          <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                👤
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                  Customer
                </p>

                <h2 className="text-xl font-bold text-[#071a3d]">
                  Customer Information
                </h2>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Full Name
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {order.customer_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Phone
                </p>

                <a
                  href={`tel:${order.phone}`}
                  className="mt-1 block font-semibold text-[#071a3d] transition hover:text-[#ff7800]"
                >
                  {order.phone}
                </a>
              </div>

              {order.email && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Email
                  </p>

                  <a
                    href={`mailto:${order.email}`}
                    className="mt-1 block break-all font-semibold text-[#071a3d] transition hover:text-[#ff7800]"
                  >
                    {order.email}
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* DELIVERY */}
          <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                📍
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                  Delivery
                </p>

                <h2 className="text-xl font-bold text-[#071a3d]">
                  Delivery Information
                </h2>
              </div>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  State
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {order.state}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  City
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {order.city}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Address
                </p>

                <p className="mt-1 font-semibold leading-6 text-gray-900">
                  {order.address}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* PRODUCT */}
        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-5 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
              Purchase
            </p>

            <h2 className="mt-1 text-xl font-bold text-[#071a3d]">
              Product Information
            </h2>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Product
                </p>

                <p className="mt-1 font-bold text-[#071a3d]">
                  {order.product_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Unit Price
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  ₦{Number(
                    order.product_price
                  ).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Quantity
                </p>

                <p className="mt-1 font-bold text-gray-900">
                  {order.quantity}
                </p>
              </div>

              {order.product_type && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Type
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {order.product_type}
                  </p>
                </div>
              )}

              {order.color && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Color
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {order.color}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Product ID
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {order.product_id ?? "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2 rounded-2xl bg-[#071a3d] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-blue-100">
                  Order Total
                </p>

                <p className="text-xs text-blue-200">
                  {order.quantity} × ₦
                  {Number(
                    order.product_price
                  ).toLocaleString()}
                </p>
              </div>

              <p className="text-3xl font-extrabold text-[#ff7800]">
                ₦{total.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* CUSTOMER NOTE */}
        {order.additional_note && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="text-2xl">📝</div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Customer Message
                </p>

                <h2 className="mt-1 text-xl font-bold text-amber-900">
                  Additional Note
                </h2>

                <p className="mt-4 whitespace-pre-wrap leading-7 text-amber-900">
                  {order.additional_note}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* EMAIL */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">
              ✉️
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                Communication
              </p>

              <h2 className="text-xl font-bold text-[#071a3d]">
                Send Email to Customer
              </h2>
            </div>
          </div>

          {order.email ? (
            <div className="mt-7">
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                Sending to{" "}
                <span className="font-bold text-[#071a3d]">
                  {order.email}
                </span>
              </div>

              <div className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                    Subject
                  </label>

                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(event) =>
                      setEmailSubject(event.target.value)
                    }
                    placeholder="Enter email subject"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:ring-4 focus:ring-orange-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#071a3d]">
                    Message
                  </label>

                  <textarea
                    value={emailMessage}
                    onChange={(event) =>
                      setEmailMessage(event.target.value)
                    }
                    placeholder="Write your message to the customer..."
                    rows={9}
                    className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3.5 leading-6 outline-none transition placeholder:text-gray-400 focus:border-[#ff7800] focus:ring-4 focus:ring-orange-50"
                  />
                </div>

                {emailSuccess && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                    ✓ {emailSuccess}
                  </div>
                )}

                {emailError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                    {emailError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={sendingEmail}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#ff7800] px-6 py-3.5 font-bold text-white transition hover:bg-[#e96d00] disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
                >
                  {sendingEmail ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-800">
              This customer did not provide an email address.
            </div>
          )}
        </section>

        {/* ORDER TIMESTAMPS */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Order Created
            </p>

            <p className="mt-2 text-sm font-semibold text-[#071a3d]">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Last Updated
            </p>

            <p className="mt-2 text-sm font-semibold text-[#071a3d]">
              {new Date(order.updated_at).toLocaleString()}
            </p>
          </div>
        </section>

        {/* BOTTOM NAVIGATION */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Link
            href="/admin/orders"
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-center font-semibold text-[#071a3d] transition hover:border-[#ff7800] hover:text-[#ff7800]"
          >
            ← Back to Orders
          </Link>

          <Link
            href="/admin"
            className="rounded-xl bg-[#071a3d] px-6 py-3 text-center font-semibold text-white transition hover:bg-[#ff7800]"
          >
            Back to Dashboard
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
            Admin Panel
          </p>
        </div>
      </footer>
    </main>
  );
}