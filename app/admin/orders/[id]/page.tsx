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
  const total =
    Number(order.product_price) * order.quantity;

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
        order.product_type
          ? `\nType: ${order.product_type}`
          : ""
      }${
        order.color
          ? `\nColor: ${order.color}`
          : ""
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
        order.product_type
          ? `\nType: ${order.product_type}`
          : ""
      }${
        order.color
          ? `\nColor: ${order.color}`
          : ""
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
        order.product_type
          ? `\nType: ${order.product_type}`
          : ""
      }${
        order.color
          ? `\nColor: ${order.color}`
          : ""
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
        order.product_type
          ? `\nType: ${order.product_type}`
          : ""
      }${
        order.color
          ? `\nColor: ${order.color}`
          : ""
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
        order.product_type
          ? `\nType: ${order.product_type}`
          : ""
      }${
        order.color
          ? `\nColor: ${order.color}`
          : ""
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
        order.product_type
          ? `\nType: ${order.product_type}`
          : ""
      }${
        order.color
          ? `\nColor: ${order.color}`
          : ""
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

  return {
    subject,
    message,
  };
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

      // Automatically generate the email template
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

    // Automatically regenerate email when status changes
    const template = generateEmailTemplate(updatedOrder);

    setEmailSubject(template.subject);
    setEmailMessage(template.message);

    // Clear previous email messages
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

  function getStatusClasses(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";

      case "confirmed":
        return "bg-blue-100 text-blue-800";

      case "processing":
        return "bg-purple-100 text-purple-800";

      case "shipped":
        return "bg-indigo-100 text-indigo-800";

      case "delivered":
        return "bg-green-100 text-green-800";

      case "cancelled":
        return "bg-red-100 text-red-800";

      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">
          Loading order...
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
        <p className="text-red-600">
          {error || "Order not found."}
        </p>

        <Link
          href="/admin/orders"
          className="mt-5 rounded-lg bg-black px-5 py-3 font-semibold text-white"
        >
          Back to Orders
        </Link>
      </main>
    );
  }

  const total =
    Number(order.product_price) * order.quantity;

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Random Picks NG
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Order Details
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ← Orders
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Order Header */}
        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Order #{order.id}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Placed{" "}
                {new Date(
                  order.created_at
                ).toLocaleString()}
              </p>
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-sm font-semibold capitalize ${getStatusClasses(
                order.status
              )}`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold text-gray-900">
            Order Status
          </h3>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={order.status}
              disabled={updating}
              onChange={(event) =>
                updateStatus(event.target.value)
              }
              className="rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-black disabled:opacity-50"
            >
              {statuses.map((status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status.charAt(0).toUpperCase() +
                    status.slice(1)}
                </option>
              ))}
            </select>

            {updating && (
              <span className="text-sm text-gray-500">
                Updating...
              </span>
            )}
          </div>
        </div>

        {/* Customer + Delivery */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-bold text-gray-900">
              Customer Information
            </h3>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-gray-500">
                  Name
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {order.customer_name}
                </p>
              </div>

              <div>
                <p className="text-gray-500">
                  Phone
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {order.phone}
                </p>
              </div>

              {order.email && (
                <div>
                  <p className="text-gray-500">
                    Email
                  </p>

                  <p className="mt-1 break-all font-medium text-gray-900">
                    {order.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-bold text-gray-900">
              Delivery Information
            </h3>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-gray-500">
                  State
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {order.state}
                </p>
              </div>

              <div>
                <p className="text-gray-500">
                  City
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {order.city}
                </p>
              </div>

              <div>
                <p className="text-gray-500">
                  Address
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {order.address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Product */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold text-gray-900">
            Product Information
          </h3>

          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Product
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {order.product_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Unit Price
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                ₦
                {Number(
                  order.product_price
                ).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Quantity
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {order.quantity}
              </p>
            </div>

            {order.product_type && (
              <div>
                <p className="text-sm text-gray-500">
                  Type
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {order.product_type}
                </p>
              </div>
            )}

            {order.color && (
              <div>
                <p className="text-sm text-gray-500">
                  Color
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {order.color}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500">
                Product ID
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {order.product_id ?? "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t pt-5">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">
                Total
              </span>

              <span className="text-2xl font-bold text-gray-900">
                ₦{total.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Note */}
        {order.additional_note && (
          <div className="mt-6 rounded-2xl bg-yellow-50 p-6 shadow-sm sm:p-8">
            <h3 className="text-lg font-bold text-gray-900">
              Customer Note
            </h3>

            <p className="mt-3 whitespace-pre-wrap text-gray-700">
              {order.additional_note}
            </p>
          </div>
        )}

        {/* Send Email */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold text-gray-900">
            Send Email to Customer
          </h3>

          {order.email ? (
            <>
              <p className="mt-2 text-sm text-gray-500">
                Send an email directly to {order.customer_name} at{" "}
                <span className="font-medium text-gray-700">
                  {order.email}
                </span>
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Subject
                  </label>

                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(event) =>
                      setEmailSubject(event.target.value)
                    }
                    placeholder="Enter email subject"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Message
                  </label>

                  <textarea
                    value={emailMessage}
                    onChange={(event) =>
                      setEmailMessage(event.target.value)
                    }
                    placeholder="Write your message to the customer..."
                    rows={7}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                {emailSuccess && (
                  <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                    {emailSuccess}
                  </div>
                )}

                {emailError && (
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                    {emailError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={sendingEmail}
                  className="rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {sendingEmail ? "Sending..." : "Send Email"}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              This customer did not provide an email address.
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="mt-6 rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
          Last updated:{" "}
          {new Date(
            order.updated_at
          ).toLocaleString()}
        </div>
      </div>
    </main>
  );
}