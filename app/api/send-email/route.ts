import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "#2563eb";

    case "processing":
      return "#7c3aed";

    case "shipped":
      return "#0891b2";

    case "delivered":
      return "#16a34a";

    case "cancelled":
      return "#dc2626";

    case "pending":
    default:
      return "#ff7800";
  }
}

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function createBrandedEmail({
  customerName,
  message,
  order,
  productImage,
}: {
  customerName: string;
  message: string;
  order: Order;
  productImage: string;
}) {
  const total =
    Number(order.product_price) * Number(order.quantity);

  const statusColor = getStatusColor(order.status);

  const messageHtml = escapeHtml(message).replace(
    /\n/g,
    "<br />"
  );

  const productImageHtml = productImage
    ? `
      <div style="margin:0 0 24px;text-align:center;">
        <img
          src="${escapeHtml(productImage)}"
          alt="${escapeHtml(order.product_name)}"
          style="
            width:100%;
            max-width:320px;
            height:auto;
            max-height:320px;
            object-fit:contain;
            border-radius:16px;
            display:block;
            margin:0 auto;
          "
        />
      </div>
    `
    : "";

  const optionsHtml = `
    ${
      order.product_type
        ? `
          <tr>
            <td style="padding:7px 0;color:#6b7280;">
              Type
            </td>
            <td style="padding:7px 0;text-align:right;font-weight:600;color:#071a3d;">
              ${escapeHtml(order.product_type)}
            </td>
          </tr>
        `
        : ""
    }

    ${
      order.color
        ? `
          <tr>
            <td style="padding:7px 0;color:#6b7280;">
              Color
            </td>
            <td style="padding:7px 0;text-align:right;font-weight:600;color:#071a3d;">
              ${escapeHtml(order.color)}
            </td>
          </tr>
        `
        : ""
    }
  `;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Random Picks NG</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f4f6f9;
    font-family:Arial,Helvetica,sans-serif;
    color:#111827;
  "
>
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background:#f4f6f9;padding:30px 12px;"
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:620px;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
          "
        >

          <!-- HEADER -->
          <tr>
            <td
              style="
                background:#071a3d;
                padding:26px 24px;
                text-align:center;
              "
            >
              <img
                src="https://randompicksng.com/rplogo.png"
                alt="Random Picks NG"
                width="70"
                height="70"
                style="
                  width:70px;
                  height:70px;
                  border-radius:50%;
                  display:block;
                  margin:0 auto 12px;
                "
              />

              <div
                style="
                  color:#ffffff;
                  font-size:22px;
                  font-weight:700;
                "
              >
                Random Picks NG
              </div>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding:32px 26px;">

              <h1
                style="
                  margin:0 0 10px;
                  color:#071a3d;
                  font-size:26px;
                "
              >
                Hello ${escapeHtml(customerName)} 👋
              </h1>

              <p
                style="
                  margin:0 0 24px;
                  color:#4b5563;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                Here is an update regarding your order
                with Random Picks NG.
              </p>

              <!-- STATUS -->
              <div
                style="
                  margin-bottom:24px;
                  padding:14px 18px;
                  border-radius:12px;
                  background:#f8fafc;
                  border-left:5px solid ${statusColor};
                "
              >
                <div
                  style="
                    font-size:12px;
                    color:#6b7280;
                    text-transform:uppercase;
                    letter-spacing:1px;
                    font-weight:700;
                  "
                >
                  Order Status
                </div>

                <div
                  style="
                    margin-top:5px;
                    color:${statusColor};
                    font-size:18px;
                    font-weight:700;
                  "
                >
                  ${escapeHtml(formatStatus(order.status))}
                </div>
              </div>

              <!-- MESSAGE -->
              <div
                style="
                  margin-bottom:26px;
                  color:#374151;
                  font-size:15px;
                  line-height:1.8;
                "
              >
                ${messageHtml}
              </div>

              <!-- ORDER CARD -->
              <div
                style="
                  border:1px solid #e5e7eb;
                  border-radius:16px;
                  overflow:hidden;
                  margin-bottom:24px;
                "
              >

                <div
                  style="
                    background:#071a3d;
                    color:#ffffff;
                    padding:16px 18px;
                  "
                >
                  <div
                    style="
                      font-size:12px;
                      color:#ff7800;
                      text-transform:uppercase;
                      letter-spacing:1px;
                      font-weight:700;
                    "
                  >
                    Order Details
                  </div>

                  <div
                    style="
                      margin-top:4px;
                      font-size:20px;
                      font-weight:700;
                    "
                  >
                    Order #${escapeHtml(order.id)}
                  </div>
                </div>

                <div style="padding:20px;">

                  ${productImageHtml}

                  <h2
                    style="
                      margin:0 0 14px;
                      color:#071a3d;
                      font-size:19px;
                    "
                  >
                    ${escapeHtml(order.product_name)}
                  </h2>

                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                      font-size:14px;
                      line-height:1.5;
                    "
                  >

                    <tr>
                      <td
                        style="
                          padding:7px 0;
                          color:#6b7280;
                        "
                      >
                        Quantity
                      </td>

                      <td
                        style="
                          padding:7px 0;
                          text-align:right;
                          font-weight:600;
                          color:#071a3d;
                        "
                      >
                        ${escapeHtml(order.quantity)}
                      </td>
                    </tr>

                    <tr>
                      <td
                        style="
                          padding:7px 0;
                          color:#6b7280;
                        "
                      >
                        Price
                      </td>

                      <td
                        style="
                          padding:7px 0;
                          text-align:right;
                          font-weight:600;
                          color:#071a3d;
                        "
                      >
                        ₦${Number(
                          order.product_price
                        ).toLocaleString()}
                      </td>
                    </tr>

                    ${optionsHtml}

                    <tr>
                      <td
                        style="
                          border-top:1px solid #e5e7eb;
                          padding:14px 0 7px;
                          color:#071a3d;
                          font-weight:700;
                        "
                      >
                        Total
                      </td>

                      <td
                        style="
                          border-top:1px solid #e5e7eb;
                          padding:14px 0 7px;
                          text-align:right;
                          color:#ff7800;
                          font-size:18px;
                          font-weight:800;
                        "
                      >
                        ₦${total.toLocaleString()}
                      </td>
                    </tr>

                  </table>
                </div>
              </div>

              <!-- DELIVERY -->
              <div
                style="
                  border:1px solid #e5e7eb;
                  border-radius:16px;
                  padding:20px;
                  margin-bottom:26px;
                "
              >
                <div
                  style="
                    color:#ff7800;
                    font-size:12px;
                    text-transform:uppercase;
                    letter-spacing:1px;
                    font-weight:700;
                    margin-bottom:10px;
                  "
                >
                  Delivery Information
                </div>

                <p
                  style="
                    margin:6px 0;
                    font-size:14px;
                    color:#4b5563;
                  "
                >
                  <strong>State:</strong>
                  ${escapeHtml(order.state)}
                </p>

                <p
                  style="
                    margin:6px 0;
                    font-size:14px;
                    color:#4b5563;
                  "
                >
                  <strong>City:</strong>
                  ${escapeHtml(order.city)}
                </p>

                <p
                  style="
                    margin:6px 0;
                    font-size:14px;
                    color:#4b5563;
                  "
                >
                  <strong>Address:</strong>
                  ${escapeHtml(order.address)}
                </p>
              </div>

              <!-- TRACK BUTTON -->
              <div style="text-align:center;margin:30px 0;">

                <a
                  href="https://randompicksng.com/track-order"
                  style="
                    display:inline-block;
                    background:#ff7800;
                    color:#ffffff;
                    text-decoration:none;
                    font-weight:700;
                    font-size:15px;
                    padding:15px 28px;
                    border-radius:12px;
                  "
                >
                  Track Your Order
                </a>

              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              style="
                background:#071a3d;
                padding:24px;
                text-align:center;
              "
            >

              <img
                src="https://randompicksng.com/rplogo.png"
                alt="Random Picks NG"
                width="45"
                height="45"
                style="
                  width:45px;
                  height:45px;
                  border-radius:50%;
                  display:block;
                  margin:0 auto 10px;
                "
              />

              <p
                style="
                  margin:0;
                  color:#ffffff;
                  font-size:14px;
                  font-weight:700;
                "
              >
                Random Picks NG
              </p>

              <p
                style="
                  margin:6px 0 0;
                  color:#bfdbfe;
                  font-size:12px;
                "
              >
                Thank you for shopping with us.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      to,
      customerName,
      subject,
      message,
      html,
      order,
    }: {
      to?: string;
      customerName?: string;
      subject?: string;
      message?: string;
      html?: string;
      order?: Order;
    } = body;

    if (!to || !subject) {
      return NextResponse.json(
        {
          error:
            "Recipient email and subject are required.",
        },
        { status: 400 }
      );
    }

    /*
     * The new Email Center sends the complete order.
     * We require it for branded order emails.
     */
    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order information is required to send this branded email.",
        },
        { status: 400 }
      );
    }

    let productImage = "";

    /*
     * Get the product image using the product_id
     * from the selected order.
     */
    if (order.product_id) {
      const { data: product, error: productError } =
        await supabaseAdmin
          .from("products")
          .select("images")
          .eq("id", order.product_id)
          .maybeSingle();

      if (productError) {
        console.error(
          "Product lookup error:",
          productError
        );
      }

      if (product?.images) {
        if (Array.isArray(product.images)) {
          productImage = product.images[0] || "";
        } else if (
          typeof product.images === "string"
        ) {
          try {
            const parsed = JSON.parse(product.images);

            if (Array.isArray(parsed)) {
              productImage = parsed[0] || "";
            } else {
              productImage = product.images;
            }
          } catch {
            productImage = product.images;
          }
        }
      }
    }

    /*
     * If message exists, use the new branded template.
     * If an old caller sends html only, preserve that.
     */
    let finalHtml = html || "";

    if (message) {
      finalHtml = createBrandedEmail({
        customerName:
          customerName || order.customer_name,
        message,
        order,
        productImage,
      });
    }

    if (!finalHtml) {
      return NextResponse.json(
        {
          error: "Email content is required.",
        },
        { status: 400 }
      );
    }

    const brevoApiKey =
      process.env.BREVO_API_KEY;

    const senderEmail =
      process.env.BREVO_SENDER_EMAIL;

    if (!brevoApiKey || !senderEmail) {
      return NextResponse.json(
        {
          error:
            "Email service is not configured.",
        },
        { status: 500 }
      );
    }

    const brevoResponse = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "Random Picks NG",
            email: senderEmail,
          },
          to: [
            {
              email: to,
              name:
                customerName ||
                order.customer_name,
            },
          ],
          subject,
          htmlContent: finalHtml,
        }),
      }
    );

    const brevoData =
      await brevoResponse.json();

    if (!brevoResponse.ok) {
      console.error(
        "Brevo error:",
        brevoData
      );

      return NextResponse.json(
        {
          error:
            brevoData?.message ||
            "Brevo could not send the email.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: brevoData?.messageId || null,
    });
  } catch (error) {
    console.error(
      "Send email error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while sending the email.",
      },
      { status: 500 }
    );
  }
}