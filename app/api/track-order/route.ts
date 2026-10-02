import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizePhone(value: string) {
  let phone = value.trim().replace(/[\s()-]/g, "");

  if (phone.startsWith("+234")) {
    phone = "0" + phone.slice(4);
  } else if (phone.startsWith("234")) {
    phone = "0" + phone.slice(3);
  }

  return phone;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const orderId = Number(body.orderId);
    const phone = String(body.phone || "").trim();

    if (!Number.isInteger(orderId) || !phone) {
      return NextResponse.json(
        { error: "Invalid order number or phone number." },
        { status: 400 }
      );
    }

    const originalPhone = phone;
    const normalizedPhone = normalizePhone(phone);

    const phoneVariants = [
      ...new Set([originalPhone, normalizedPhone]),
    ];

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        `
        id,
        product_name,
        product_price,
        customer_name,
        phone,
        state,
        city,
        address,
        product_type,
        color,
        quantity,
        additional_note,
        status,
        created_at,
        updated_at
        `
      )
      .eq("id", orderId)
      .in("phone", phoneVariants)
      .maybeSingle();

    if (error) {
      console.error("Track order error:", error);

      return NextResponse.json(
        { error: "Unable to check order." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No order was found with those details." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    console.error("Track order request error:", error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}