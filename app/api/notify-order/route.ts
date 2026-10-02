import { NextResponse } from "next/server";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      orderId,
      customerName,
      phone,
      email,
      state,
      city,
      address,
      productName,
      productPrice,
      quantity,
      productType,
      color,
      note,
    } = body;

    if (
      !orderId ||
      !customerName ||
      !phone ||
      !state ||
      !city ||
      !address ||
      !productName ||
      productPrice === undefined ||
      !quantity
    ) {
      return NextResponse.json(
        {
          error: "Missing order information.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
      console.error(
        "Brevo email configuration is missing."
      );

      return NextResponse.json(
        {
          error: "Brevo email configuration is missing.",
        },
        { status: 500 }
      );
    }

    const total =
      Number(productPrice) * Number(quantity);

    const safeCustomerName =
      escapeHtml(String(customerName));

    const safePhone = escapeHtml(String(phone));
    const safeEmail = email
      ? escapeHtml(String(email))
      : "Not provided";

    const safeState = escapeHtml(String(state));
    const safeCity = escapeHtml(String(city));
    const safeAddress = escapeHtml(String(address));
    const safeProductName =
      escapeHtml(String(productName));

    const safeType = productType
      ? escapeHtml(String(productType))
      : null;

    const safeColor = color
      ? escapeHtml(String(color))
      : null;

    const safeNote = note
      ? escapeHtml(String(note))
      : null;

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: "Random Picks NG",
            email: senderEmail,
          },
          to: [
            {
              email: "randompicksng@gmail.com",
              name: "Random Picks NG",
            },
          ],
          subject: `🔔 New Order #${orderId} - ${customerName}`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222; max-width: 700px; margin: 0 auto;">

              <h2 style="margin-bottom: 5px;">
                🔔 New Order Received
              </h2>

              <p style="color: #666; margin-top: 0;">
                Random Picks NG
              </p>

              <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin-top: 25px;">
                <h3 style="margin-top: 0;">
                  Order #${orderId}
                </h3>

                <p>
                  <strong>Status:</strong> Pending
                </p>
              </div>

              <h3 style="margin-top: 30px;">
                Customer Information
              </h3>

              <p>
                <strong>Name:</strong> ${safeCustomerName}<br />
                <strong>Phone:</strong> ${safePhone}<br />
                <strong>Email:</strong> ${safeEmail}
              </p>

              <h3 style="margin-top: 30px;">
                Product
              </h3>

              <p>
                <strong>Product:</strong> ${safeProductName}<br />
                <strong>Quantity:</strong> ${quantity}<br />
                <strong>Unit Price:</strong> ₦${Number(productPrice).toLocaleString()}<br />
                ${
                  safeType
                    ? `<strong>Type:</strong> ${safeType}<br />`
                    : ""
                }
                ${
                  safeColor
                    ? `<strong>Color:</strong> ${safeColor}<br />`
                    : ""
                }
                <strong>Total:</strong> ₦${total.toLocaleString()}
              </p>

              <h3 style="margin-top: 30px;">
                Delivery Information
              </h3>

              <p>
                <strong>State:</strong> ${safeState}<br />
                <strong>City:</strong> ${safeCity}<br />
                <strong>Address:</strong> ${safeAddress}
              </p>

              ${
                safeNote
                  ? `
                    <h3 style="margin-top: 30px;">
                      Customer Note
                    </h3>

                    <p>
                      ${safeNote}
                    </p>
                  `
                  : ""
              }

              <div style="margin-top: 30px; padding: 15px; background: #fff8e1; border-radius: 8px;">
                <strong>Action Required:</strong>
                Please review this order from the Random Picks NG admin dashboard.
              </div>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />

              <p style="font-size: 13px; color: #666;">
                This notification was automatically sent by Random Picks NG.
              </p>

            </div>
          `,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Brevo notification error:",
        result
      );

      return NextResponse.json(
        {
          error:
            result?.message ||
            "Could not send order notification.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error(
      "Order notification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while sending the order notification.",
      },
      { status: 500 }
    );
  }
}