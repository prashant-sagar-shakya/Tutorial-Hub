import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { BaseEnvironment } from "@/configs/BaseEnvironment";
import { db } from "@/configs/db";
import { UserSubscriptions } from "@/schema/schema";
import { eq } from "drizzle-orm";

const env = new BaseEnvironment();
function getNextBillingDate(): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
}

async function updateUserSubscriptionInDb(
  clerkUserId: string,
  planIdToUpdate: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  planDetails: { courses: number; name: string }
) {
  try {
    const nextBilling = getNextBillingDate();
    const existingSubscription = await db
      .select()
      .from(UserSubscriptions)
      .where(eq(UserSubscriptions.userId, clerkUserId))
      .limit(1);

    if (existingSubscription.length > 0) {
      const result = await db
        .update(UserSubscriptions)
        .set({
          currentPlanId: planIdToUpdate,
          courseCreationLimit: planDetails.courses,
          razorpayPaymentId: razorpayPaymentId,
          razorpayOrderId: razorpayOrderId,
          status: "active",
          subscriptionEndDate: nextBilling,
          updatedAt: new Date(),
        })
        .where(eq(UserSubscriptions.userId, clerkUserId))
        .returning();
      console.log(
        `Subscription updated for user ${clerkUserId} to plan ${planIdToUpdate}:`,
        result
      );
      return { success: true, data: result[0] };
    } else {
      const result = await db
        .insert(UserSubscriptions)
        .values({
          userId: clerkUserId,
          currentPlanId: planIdToUpdate,
          courseCreationLimit: planDetails.courses,
          razorpayPaymentId: razorpayPaymentId,
          razorpayOrderId: razorpayOrderId,
          status: "active",
          subscriptionStartDate: new Date(),
          subscriptionEndDate: nextBilling,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      console.log(
        `New subscription created for user ${clerkUserId} to plan ${planIdToUpdate}:`,
        result
      );
      return { success: true, data: result[0] };
    }
  } catch (error) {
    console.error(
      `Failed to update subscription for user ${clerkUserId} in DB:`,
      error
    );
    return { success: false, error: "Database update failed" };
  }
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
      !plan_details ||
      !plan_details.courses
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required payment verification details or plan details",
        },
        { status: 400 }
      );
    }

    const bodyToSign = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(bodyToSign.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const dbUpdateResult = await updateUserSubscriptionInDb(
        user_id,
        plan_id,
        razorpay_payment_id,
        razorpay_order_id,
        plan_details
      );

      if (dbUpdateResult.success) {
        return NextResponse.json(
          {
            status: "success",
            message: "Payment verified and plan updated",
            orderId: razorpay_order_id,
            data: dbUpdateResult.data,
          },
          { status: 200 }
        );
      } else {
        console.error(
          "CRITICAL: Payment signature verified but database update failed for user:",
          user_id,
          "order:",
          razorpay_order_id
        );
        return NextResponse.json(
          {
            status: "failure",
            message:
              "Payment verified, but failed to update plan. Please contact support.",
            details: dbUpdateResult.error,
          },
          { status: 500 }
        );
      }
    } else {
      console.warn(
        "Invalid Razorpay signature attempt for order:",
        razorpay_order_id
      );
      return NextResponse.json(
        { status: "failure", message: "Invalid signature" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in Razorpay payment verification endpoint:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: "Payment verification process failed", details: errorMessage },
      { status: 500 }
    );
  }
}
