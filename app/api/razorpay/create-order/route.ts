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
    const simpleReceiptId = `tut_${nanoid(12)}`;

    const options = {
      amount: amount_in_paisa,
      currency: currency,
      receipt: simpleReceiptId,
      notes: {
        planId: plan_id,
        userId: user_id,
        originalReceiptInfo: `plan:${plan_id},user:${user_id}`,
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
    let errorMessage = "Internal Server Error";
    let statusCode = 500;

    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      "error" in error
    ) {
      const rzpError = error as any;
      if (
        rzpError.error &&
        typeof rzpError.error === "object" &&
        "description" in rzpError.error
      ) {
        errorMessage = rzpError.error.description;
      } else {
        errorMessage = "Razorpay operation failed";
      }
      statusCode = rzpError.statusCode || 500;
      console.error("Razorpay Error Details:", rzpError.error);
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: "Failed to create order", details: errorMessage },
      { status: statusCode }
    );
  }
}
