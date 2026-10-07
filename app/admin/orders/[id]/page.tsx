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

function formatCurrency(value: number) {
  return `₦${Number(value).toLocaleString()}`;
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

  const [receiptMessage, setReceiptMessage] = useState("");
  const [receiptError, setReceiptError] = useState("");
  const [downloadingReceipt, setDownloadingReceipt] =
    useState(false);

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

  function printReceipt() {
    setReceiptMessage("");
    setReceiptError("");

    window.print();
  }

  function wrapCanvasText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ) {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine
        ? `${currentLine} ${word}`
        : word;

      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }

        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  function drawCanvasText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const lines = wrapCanvasText(
      ctx,
      text,
      maxWidth
    );

    lines.forEach((line) => {
      ctx.fillText(line, x, y);
      y += lineHeight;
    });

    return y;
  }

  async function downloadReceiptImage() {
    if (!order) return;

    setDownloadingReceipt(true);
    setReceiptMessage("");
    setReceiptError("");

    try {
      const canvas = document.createElement("canvas");

      const width = 1240;
      const height = 1754;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not create receipt image.");
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      const navy = "#071a3d";
      const orange = "#ff7800";
      const gray = "#667085";
      const lightGray = "#eaecf0";

      let y = 90;

      ctx.fillStyle = navy;
      ctx.font = "bold 42px Arial";
      ctx.textAlign = "left";
      ctx.fillText("RANDOM PICKS NG", 90, y);

      ctx.fillStyle = orange;
      ctx.font = "bold 22px Arial";
      ctx.fillText("OFFICIAL ORDER RECEIPT", 90, y + 42);

      ctx.textAlign = "right";
      ctx.fillStyle = navy;
      ctx.font = "bold 26px Arial";
      ctx.fillText(
        `ORDER #${order.id}`,
        width - 90,
        y
      );

      ctx.fillStyle = gray;
      ctx.font = "18px Arial";
      ctx.fillText(
        new Date(order.created_at).toLocaleDateString(),
        width - 90,
        y + 32
      );

      y += 90;

      ctx.strokeStyle = lightGray;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(90, y);
      ctx.lineTo(width - 90, y);
      ctx.stroke();

      y += 55;

      ctx.textAlign = "left";
      ctx.fillStyle = navy;
      ctx.font = "bold 20px Arial";
      ctx.fillText("ORDER INFORMATION", 90, y);

      y += 38;

      ctx.fillStyle = gray;
      ctx.font = "18px Arial";

      ctx.fillText(
        `Status: ${formatStatus(order.status)}`,
        90,
        y
      );

      ctx.fillText(
        `Quantity: ${order.quantity}`,
        500,
        y
      );

      ctx.fillText(
        `Product ID: ${order.product_id ?? "N/A"}`,
        820,
        y
      );

      y += 65;

      ctx.fillStyle = navy;
      ctx.font = "bold 20px Arial";
      ctx.fillText("CUSTOMER", 90, y);

      ctx.fillText("DELIVERY", 670, y);

      y += 38;

      ctx.fillStyle = "#111827";
      ctx.font = "18px Arial";

      ctx.fillText(
        order.customer_name,
        90,
        y
      );

      ctx.fillText(
        `${order.city}, ${order.state}`,
        670,
        y
      );

      y += 32;

      ctx.fillStyle = gray;

      ctx.fillText(
        order.phone,
        90,
        y
      );

      ctx.fillText(
        order.address,
        670,
        y
      );

      if (order.email) {
        y += 32;

        ctx.fillText(
          order.email,
          90,
          y
        );
      }

      y += 70;

      ctx.fillStyle = navy;
      ctx.font = "bold 20px Arial";
      ctx.fillText("PRODUCT", 90, y);

      y += 38;

      ctx.fillStyle = "#f7f8fb";
      ctx.fillRect(
        70,
        y - 28,
        width - 140,
        55
      );

      ctx.fillStyle = gray;
      ctx.font = "bold 16px Arial";

      ctx.fillText("ITEM", 90, y);
      ctx.fillText("QTY", 730, y);
      ctx.fillText("UNIT PRICE", 830, y);
      ctx.fillText("TOTAL", 1050, y);

      y += 62;

      ctx.fillStyle = "#111827";
      ctx.font = "18px Arial";

      const productLines = wrapCanvasText(
        ctx,
        order.product_name,
        580
      );

      productLines.forEach((line, index) => {
        ctx.fillText(
          line,
          90,
          y + index * 27
        );
      });

      const productHeight =
        Math.max(productLines.length, 1) * 27;

      ctx.fillText(
        String(order.quantity),
        750,
        y
      );

      ctx.fillText(
        formatCurrency(Number(order.product_price)),
        830,
        y
      );

      ctx.font = "bold 18px Arial";

      ctx.fillText(
        formatCurrency(
          Number(order.product_price) *
            order.quantity
        ),
        1050,
        y
      );

      y += productHeight + 25;

      if (order.product_type) {
        ctx.fillStyle = gray;
        ctx.font = "17px Arial";

        ctx.fillText(
          `Type: ${order.product_type}`,
          90,
          y
        );

        y += 28;
      }

      if (order.color) {
        ctx.fillStyle = gray;
        ctx.font = "17px Arial";

        ctx.fillText(
          `Color: ${order.color}`,
          90,
          y
        );

        y += 28;
      }

      y += 35;

      ctx.strokeStyle = lightGray;
      ctx.beginPath();
      ctx.moveTo(90, y);
      ctx.lineTo(width - 90, y);
      ctx.stroke();

      y += 65;

      ctx.fillStyle = navy;
      ctx.font = "bold 26px Arial";
      ctx.fillText("ORDER TOTAL", 90, y);

      ctx.textAlign = "right";
      ctx.fillStyle = orange;
      ctx.font = "bold 34px Arial";

      ctx.fillText(
        formatCurrency(
          Number(order.product_price) *
            order.quantity
        ),
        width - 90,
        y
      );

      ctx.textAlign = "left";

      y += 90;

      if (order.additional_note) {
        ctx.fillStyle = "#fffbeb";
        ctx.fillRect(
          90,
          y,
          width - 180,
          110
        );

        ctx.fillStyle = "#92400e";
        ctx.font = "bold 18px Arial";

        ctx.fillText(
          "CUSTOMER NOTE",
          115,
          y + 32
        );

        ctx.font = "16px Arial";

        drawCanvasText(
          ctx,
          order.additional_note,
          115,
          y + 62,
          width - 230,
          24
        );

        y += 145;
      }

      ctx.strokeStyle = lightGray;
      ctx.beginPath();
      ctx.moveTo(90, y);
      ctx.lineTo(width - 90, y);
      ctx.stroke();

      y += 55;

      ctx.textAlign = "center";
      ctx.fillStyle = navy;
      ctx.font = "bold 22px Arial";

      ctx.fillText(
        "Thank you for shopping with Random Picks NG.",
        width / 2,
        y
      );

      y += 32;

      ctx.fillStyle = gray;
      ctx.font = "16px Arial";

      ctx.fillText(
        "Please keep this receipt for your records.",
        width / 2,
        y
      );

      const link = document.createElement("a");

      link.download = `random-picks-ng-receipt-${order.id}.png`;

      link.href = canvas.toDataURL(
        "image/png"
      );

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setReceiptMessage(
        "Receipt image downloaded successfully."
      );
    } catch (error) {
      console.error(error);

      setReceiptError(
        "Unable to download the receipt image. Please try again."
      );
    } finally {
      setDownloadingReceipt(false);
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
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur print:hidden">
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

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 print:hidden">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

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
                {new Date(
                  order.created_at
                ).toLocaleString()}
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
                  <option
                    key={status}
                    value={status}
                  >
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

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
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
                  {formatCurrency(
                    Number(order.product_price)
                  )}
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
                  {order.quantity} ×{" "}
                  {formatCurrency(
                    Number(order.product_price)
                  )}
                </p>
              </div>

              <p className="text-3xl font-extrabold text-[#ff7800]">
                {formatCurrency(total)}
              </p>
            </div>
          </div>
        </section>

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
                      setEmailSubject(
                        event.target.value
                      )
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
                      setEmailMessage(
                        event.target.value
                      )
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

        {/* RECEIPT ACTIONS */}
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#ff7800]">
                Receipt
              </p>

              <h2 className="mt-1 text-xl font-bold text-[#071a3d]">
                Order Receipt
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Print the receipt or download it as an image.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={printReceipt}
                className="inline-flex items-center justify-center rounded-xl bg-[#071a3d] px-6 py-3.5 font-bold text-white transition hover:bg-[#ff7800]"
              >
                🖨️ Print Receipt
              </button>

              <button
                type="button"
                onClick={downloadReceiptImage}
                disabled={downloadingReceipt}
                className="inline-flex items-center justify-center rounded-xl bg-[#ff7800] px-6 py-3.5 font-bold text-white transition hover:bg-[#e96d00] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {downloadingReceipt ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Preparing...
                  </>
                ) : (
                  "⬇️ Download Image"
                )}
              </button>
            </div>
          </div>

          {receiptMessage && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              ✓ {receiptMessage}
            </div>
          )}

          {receiptError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {receiptError}
            </div>
          )}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Order Created
            </p>

            <p className="mt-2 text-sm font-semibold text-[#071a3d]">
              {new Date(
                order.created_at
              ).toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Last Updated
            </p>

            <p className="mt-2 text-sm font-semibold text-[#071a3d]">
              {new Date(
                order.updated_at
              ).toLocaleString()}
            </p>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {/* PRINT-ONLY RECEIPT */}
      <div
        id="printable-receipt"
        className="print-only-receipt"
      >
        <div className="receipt-paper">
          <div className="receipt-header">
            <div>
              <img
                src="/rplogo.png"
                alt="Random Picks NG"
                className="receipt-logo"
              />

              <div>
                <h1>RANDOM PICKS NG</h1>
                <p>OFFICIAL ORDER RECEIPT</p>
              </div>
            </div>

            <div className="receipt-order-number">
              <strong>ORDER #{order.id}</strong>
              <span>
                {new Date(
                  order.created_at
                ).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="receipt-divider" />

          <div className="receipt-section">
            <h2>Order Information</h2>

            <div className="receipt-info-grid three">
              <div>
                <span>Status</span>
                <strong>
                  {formatStatus(order.status)}
                </strong>
              </div>

              <div>
                <span>Quantity</span>
                <strong>{order.quantity}</strong>
              </div>

              <div>
                <span>Product ID</span>
                <strong>
                  {order.product_id ?? "N/A"}
                </strong>
              </div>
            </div>
          </div>

          <div className="receipt-section">
            <div className="receipt-info-grid two">
              <div>
                <h2>Customer</h2>

                <strong>
                  {order.customer_name}
                </strong>

                <span>{order.phone}</span>

                {order.email && (
                  <span>{order.email}</span>
                )}
              </div>

              <div>
                <h2>Delivery</h2>

                <strong>
                  {order.city}, {order.state}
                </strong>

                <span>{order.address}</span>
              </div>
            </div>
          </div>

          <div className="receipt-section">
            <h2>Product</h2>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>
                    <strong>
                      {order.product_name}
                    </strong>

                    {order.product_type && (
                      <small>
                        Type: {order.product_type}
                      </small>
                    )}

                    {order.color && (
                      <small>
                        Color: {order.color}
                      </small>
                    )}
                  </td>

                  <td>{order.quantity}</td>

                  <td>
                    {formatCurrency(
                      Number(order.product_price)
                    )}
                  </td>

                  <td>
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {order.additional_note && (
            <div className="receipt-note">
              <strong>Customer Note</strong>

              <p>{order.additional_note}</p>
            </div>
          )}

          <div className="receipt-total">
            <span>ORDER TOTAL</span>

            <strong>
              {formatCurrency(total)}
            </strong>
          </div>

          <div className="receipt-footer">
            <strong>
              Thank you for shopping with Random Picks NG.
            </strong>

            <span>
              Please keep this receipt for your records.
            </span>
          </div>
        </div>
      </div>

      <footer className="mt-12 border-t border-gray-200 bg-white print:hidden">
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

      <style jsx global>{`
        .print-only-receipt {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          #printable-receipt,
          #printable-receipt * {
            visibility: visible !important;
          }

          #printable-receipt {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .receipt-paper {
            width: 100%;
            max-height: 275mm;
            overflow: hidden;
            box-sizing: border-box;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
          }

          .receipt-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            padding-bottom: 18px;
          }

          .receipt-header > div:first-child {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .receipt-logo {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
          }

          .receipt-header h1 {
            margin: 0;
            color: #071a3d;
            font-size: 20px;
            font-weight: 800;
          }

          .receipt-header p {
            margin: 3px 0 0;
            color: #ff7800;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.12em;
          }

          .receipt-order-number {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
          }

          .receipt-order-number strong {
            color: #071a3d;
            font-size: 13px;
          }

          .receipt-order-number span {
            color: #667085;
            font-size: 10px;
          }

          .receipt-divider {
            height: 1px;
            background: #e5e7eb;
            margin-bottom: 18px;
          }

          .receipt-section {
            margin-bottom: 16px;
          }

          .receipt-section h2 {
            margin: 0 0 9px;
            color: #071a3d;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          .receipt-info-grid {
            display: grid;
            gap: 18px;
          }

          .receipt-info-grid.two {
            grid-template-columns: 1fr 1fr;
          }

          .receipt-info-grid.three {
            grid-template-columns: 1fr 1fr 1fr;
          }

          .receipt-info-grid > div {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
          }

          .receipt-info-grid span {
            color: #667085;
            font-size: 10px;
            line-height: 1.35;
          }

          .receipt-info-grid strong {
            color: #111827;
            font-size: 11px;
            line-height: 1.4;
            overflow-wrap: anywhere;
          }

          .receipt-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          .receipt-table th {
            padding: 8px 7px;
            background: #f7f8fb;
            color: #667085;
            font-size: 9px;
            font-weight: 800;
            text-align: left;
            text-transform: uppercase;
          }

          .receipt-table td {
            padding: 10px 7px;
            border-bottom: 1px solid #eaecf0;
            color: #111827;
            font-size: 10px;
            vertical-align: top;
          }

          .receipt-table th:nth-child(1),
          .receipt-table td:nth-child(1) {
            width: 48%;
          }

          .receipt-table th:nth-child(2),
          .receipt-table td:nth-child(2) {
            width: 10%;
          }

          .receipt-table th:nth-child(3),
          .receipt-table td:nth-child(3) {
            width: 21%;
          }

          .receipt-table th:nth-child(4),
          .receipt-table td:nth-child(4) {
            width: 21%;
          }

          .receipt-table td strong {
            display: block;
            font-size: 10px;
          }

          .receipt-table td small {
            display: block;
            margin-top: 2px;
            color: #667085;
            font-size: 8px;
          }

          .receipt-note {
            margin-top: 14px;
            padding: 10px 12px;
            border: 1px solid #f3d48a;
            background: #fffbeb;
            border-radius: 6px;
          }

          .receipt-note strong {
            display: block;
            margin-bottom: 4px;
            color: #92400e;
            font-size: 9px;
            text-transform: uppercase;
          }

          .receipt-note p {
            margin: 0;
            color: #78350f;
            font-size: 9px;
            line-height: 1.4;
          }

          .receipt-total {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 18px;
            padding-top: 13px;
            border-top: 1px solid #d1d5db;
          }

          .receipt-total span {
            color: #071a3d;
            font-size: 12px;
            font-weight: 800;
          }

          .receipt-total strong {
            color: #ff7800;
            font-size: 20px;
            font-weight: 800;
          }

          .receipt-footer {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            margin-top: 28px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
          }

          .receipt-footer strong {
            color: #071a3d;
            font-size: 10px;
          }

          .receipt-footer span {
            color: #667085;
            font-size: 8px;
          }
        }
      `}</style>
    </main>
  );
}