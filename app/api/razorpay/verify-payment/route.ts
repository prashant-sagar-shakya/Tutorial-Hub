import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { BaseEnvironment } from "@/configs/BaseEnvironment";
import { db } from "@/configs/db";

const env = new BaseEnvironment();
async function updateUserSubscription(
  userId: string,
  planId: string,
  paymentId: string,
  orderId: string,
  planDetails: { courses: number }
) {
  console.log(
    `User ${userId} subscribed to plan ${planId} (courses: ${planDetails.courses}). Payment ID: ${paymentId}`
  );
  return { success: true };
}

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      plan_id,
      plan_details,
    } = await request.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !user_id ||
      !plan_id ||
      !plan_details
    ) {
      return NextResponse.json(
        { error: "Missing required payment verification details" },
        { status: 400 }
      );
    }

    const bodyToSign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(bodyToSign.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      await updateUserSubscription(
        user_id,
        plan_id,
        razorpay_payment_id,
        razorpay_order_id,
        plan_details
      );
      return NextResponse.json(
        {
          status: "success",
          message: "Payment verified successfully",
          orderId: razorpay_order_id,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { status: "failure", message: "Invalid signature" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in Razorpay payment verification:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Payment verification failed", details: errorMessage },
      { status: 500 }
    );
  }
}
