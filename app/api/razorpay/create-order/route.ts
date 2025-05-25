import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { BaseEnvironment } from "@/configs/BaseEnvironment";
import { nanoid } from "nanoid";

const env = new BaseEnvironment();

const razorpayInstance = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const { amount_in_paisa, currency, plan_id, user_id } =
      await request.json();

    if (!amount_in_paisa || !currency || !plan_id || !user_id) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: amount_in_paisa, currency, plan_id, user_id",
        },
        { status: 400 }
      );
    }

    const options = {
      amount: amount_in_paisa,
      currency: currency,
      receipt: `receipt_tut_${plan_id}_${user_id}_${nanoid(8)}`,
      notes: {
        planId: plan_id,
        userId: user_id,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    if (!order) {
      return NextResponse.json(
        { error: "Razorpay order creation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Failed to create order", details: errorMessage },
      { status: 500 }
    );
  }
}
