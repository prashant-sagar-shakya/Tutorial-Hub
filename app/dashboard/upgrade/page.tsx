"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { loadScript } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BaseEnvironment } from "@/configs/BaseEnvironment";
declare global {
  interface Window {
    Razorpay: any;
  }
}
const env = new BaseEnvironment();

type Plan = {
  id: string;
  name: string;
  price: number;
  courses: number;
  features: string[];
  razorpayPlanId?: string;
  borderColor?: string;
  buttonText?: string;
};

const Plans: Plan[] = [
  {
    id: "free",
    name: "Basic Explorer",
    price: 0,
    courses: 5,
    features: [
      "Up to 5 AI Courses",
      "Basic AI Content Generation",
      "Community Support",
    ],
    buttonText: "Current Plan",
  },
  {
    id: "pro_20",
    name: "Creator Pro",
    price: 200,
    courses: 20,
    features: [
      "Up to 20 AI Courses",
      "Advanced AI Content Generation",
      "YouTube Video Integration",
      "Priority Support",
    ],
    borderColor: "border-purple-500",
    buttonText: "Upgrade to Pro",
  },
  {
    id: "pro_50",
    name: "Power User",
    price: 500,
    courses: 50,
    features: [
      "Up to 50 AI Courses",
      "All Pro Features",
      "Early Access to New Features",
      "Dedicated Account Manager",
    ],
    borderColor: "border-green-500",
    buttonText: "Go Power User",
  },
];

const UpgradePage = () => {
  const { user, isSignedIn } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadRazorpay = async () => {
      const loaded = await loadScript(
        "https://checkout.razorpay.com/v1/checkout.js"
      );
      if (!loaded) {
        alert("Razorpay SDK failed to load. Are you online?");
      }
    };
    loadRazorpay();
  }, []);

  const handlePayment = async (plan: Plan) => {
    if (plan.price === 0 || !isSignedIn || !user) {
      alert("Please sign in to upgrade your plan.");
      return;
    }
    setLoadingPlan(plan.id);

    try {
      const orderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_in_paisa: plan.price * 100,
          currency: "INR",
          plan_id: plan.id,
          user_id: user.id,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.id) {
        console.error("Razorpay order creation failed:", orderData);
        alert(`Error: ${orderData.error || "Could not create order."}`);
        setLoadingPlan(null);
        return;
      }

      const options = {
        key: env.RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TutHub Plan Upgrade",
        description: `Payment for ${plan.name}`,
        image: "/logo.png",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const verificationResponse = await fetch(
              "/api/razorpay/verify-payment",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  user_id: user.id,
                  plan_id: plan.id,
                  plan_details: { courses: plan.courses, name: plan.name },
                }),
              }
            );

            const verificationData = await verificationResponse.json();

            if (
              verificationResponse.ok &&
              verificationData.status === "success"
            ) {
              alert("Payment Successful! Your plan has been upgraded.");
              router.push("/dashboard");
            } else {
              alert(
                `Payment verification failed: ${
                  verificationData.message || "Unknown error"
                }`
              );
            }
          } catch (verifyError) {
            console.error("Verification API call error:", verifyError);
            alert(
              "An error occurred while verifying your payment. Please contact support."
            );
          } finally {
            setLoadingPlan(null);
          }
        },
        prefill: {
          name: user.fullName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
        },
        notes: {
          address: "TutHub User Address (Optional)",
          plan: plan.name,
          userId: user.id,
        },
        theme: {
          color: "#6A0DAD",
        },
        modal: {
          ondismiss: function () {
            console.log("Checkout form closed");
            setLoadingPlan(null);
          },
        },
      };

      if (!window.Razorpay) {
        alert("Razorpay SDK is not available. Please try again.");
        setLoadingPlan(null);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Razorpay payment failed:", response.error);
        alert(
          `Payment Failed: ${response.error.description} (Code: ${response.error.code})`
        );
        setLoadingPlan(null);
      });
      rzp.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert("An error occurred. Please try again.");
      setLoadingPlan(null);
    }
  };
  const currentUserPlanId = "free";

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
          Unlock Your Full Potential
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Choose a plan that fits your creative ambitions and start generating
          unlimited high-quality courses with AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {Plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-xl ${
              plan.borderColor
                ? plan.borderColor + " border-2"
                : "dark:border-gray-700"
            }`}
          >
            <CardHeader className="p-6 bg-gray-50 dark:bg-gray-800 rounded-t-xl">
              <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
                {plan.name}
              </CardTitle>
              <CardDescription className="text-4xl font-bold text-primary my-3">
                ₹{plan.price}
                {plan.price > 0 && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                    /month
                  </span>
                )}
              </CardDescription>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Includes up to {plan.courses} courses.
              </p>
            </CardHeader>
            <CardContent className="p-6 flex-grow">
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-6 border-t dark:border-gray-700 mt-auto">
              <Button
                className="w-full py-3 text-lg font-semibold"
                onClick={() => handlePayment(plan)}
                disabled={
                  loadingPlan === plan.id ||
                  (currentUserPlanId === plan.id && plan.id === "free")
                }
                variant={plan.price > 0 ? "default" : "outline"}
                size="lg"
              >
                {loadingPlan === plan.id
                  ? "Processing..."
                  : plan.id === currentUserPlanId
                  ? "Current Plan"
                  : plan.buttonText || "Choose Plan"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UpgradePage;
