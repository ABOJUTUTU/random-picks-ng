import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      to,
      customerName,
      subject,
      message,
    } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        {
          error:
            "Recipient email, subject and message are required.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL;

    if (!apiKey || !senderEmail) {
      return NextResponse.json(
        {
          error:
            "Brevo email configuration is missing.",
        },
        { status: 500 }
      );
    }

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
              email: to,
              name: customerName || undefined,
            },
          ],
          subject,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
              <h2 style="margin-bottom: 20px;">
                Random Picks NG
              </h2>

              <p>
                ${message.replace(/\n/g, "<br />")}
              </p>

              <hr style="margin: 25px 0; border: none; border-top: 1px solid #ddd;" />

              <p style="font-size: 13px; color: #666;">
                This email was sent from Random Picks NG.
              </p>
            </div>
          `,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            result?.message ||
            "Brevo could not send the email.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Send email error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while sending the email.",
      },
      { status: 500 }
    );
  }
}