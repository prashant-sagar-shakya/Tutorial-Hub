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
import { CheckCircle2, BadgePercent, Zap, ShieldCheck } from "lucide-react"; // Added more icons
import { useRouter } from "next/navigation";
import { BaseEnvironment } from "@/configs/BaseEnvironment";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const env = new BaseEnvironment();

type PlanFeature = {
  text: string;
  icon?: React.ElementType;
};

type Plan = {
  id: string;
  name: string;
  tagline?: string;
  price: number; // Price in INR
  courses: number;
  features: PlanFeature[];
  razorpayPlanId_actual?: string; // Actual Razorpay Plan ID for subscription based model
  borderColor?: string;
  buttonText?: string;
  gradient?: string;
  icon?: React.ElementType;
  highlight?: boolean;
};

const tutorPlans: Plan[] = [
  {
    id: "free",
    name: "Basic Explorer",
    tagline: "Kickstart your journey",
    price: 0,
    courses: 5,
    icon: BadgePercent,
    features: [
      { text: "Up to 5 AI Courses" },
      { text: "Standard AI Content Generation" },
      { text: "Community Forum Access" },
    ],
    buttonText: "Current Plan", // Will be dynamic based on user's actual plan
    gradient:
      "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800",
  },
  {
    id: "pro_20",
    name: "Creator Pro",
    tagline: "For serious course creators",
    price: 200,
    courses: 20,
    icon: Zap,
    features: [
      { text: "Up to 20 AI Courses" },
      { text: "Advanced AI Generation" },
      { text: "YouTube Video Integration" },
      { text: "Priority Email Support" },
      { text: "Early Access to Betas" },
    ],
    borderColor: "border-purple-500 dark:border-purple-400",
    buttonText: "Upgrade to Pro",
    gradient:
      "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-800/30 dark:to-purple-900/30",
    highlight: true,
  },
  {
    id: "pro_50",
    name: "Power User",
    tagline: "Unleash unlimited potential",
    price: 500,
    courses: 50, // Or "Unlimited" if that's the offering
    icon: ShieldCheck,
    features: [
      { text: "Up to 50 AI Courses" }, // Or "Unlimited AI Courses"
      { text: "All Creator Pro Features" },
      { text: "Dedicated Account Support" },
      { text: "Custom Branding Options (soon)" },
      { text: "API Access (soon)" },
    ],
    borderColor: "border-green-500 dark:border-green-400",
    buttonText: "Go Power User",
    gradient:
      "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-800/30 dark:to-green-900/30",
  },
];

const UpgradePage = () => {
  const { user, isSignedIn, isLoaded: clerkIsLoaded } = useUser();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [currentUserActualPlanId, setCurrentUserActualPlanId] =
    useState<string>("free"); // Default, should be fetched
  const router = useRouter();

  useEffect(() => {
    const loadRazorpay = async () => {
      const loaded = await loadScript(
        "https://checkout.razorpay.com/v1/checkout.js"
      );
      if (!loaded) {
        console.error("Razorpay SDK failed to load.");
      }
    };
    loadRazorpay();
  }, [isSignedIn, user]);

  const handlePayment = async (plan: Plan) => {
    if (plan.price === 0 || !isSignedIn || !user) {
      router.push("/sign-in"); // Redirect to sign-in if not signed in
      return;
    }
    if (currentUserActualPlanId === plan.id) {
      return; // Do nothing if trying to "upgrade" to current plan
    }

    setLoadingPlanId(plan.id);

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
        alert(
          `Error: ${
            orderData.error?.description ||
            orderData.details ||
            "Could not create payment order."
          }`
        );
        setLoadingPlanId(null);
        return;
      }

      const options = {
        key: env.RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TutorialHub Plan Upgrade",
        description: `Payment for TutorialHub ${plan.name}`,
        image: "/logo.png",
        order_id: orderData.id,
        handler: async function (response: any) {
          setLoadingPlanId(plan.id);
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
              setCurrentUserActualPlanId(plan.id); // Update UI optimistic or re-fetch
              router.push("/dashboard?plan_updated=true");
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
            setLoadingPlanId(null);
          }
        },
        prefill: {
          name: user.fullName || undefined,
          email: user.primaryEmailAddress?.emailAddress || undefined,
        },
        notes: {
          userId: user.id,
          upgradingToPlan: plan.name,
        },
        theme: {
          color: "#8B5CF6", // Tailwind purple-500
        },
        modal: {
          ondismiss: function () {
            console.log("Razorpay checkout form closed by user.");
            setLoadingPlanId(null);
          },
        },
      };

      if (!window.Razorpay) {
        alert(
          "Razorpay SDK is not available. Please check your internet connection and try again."
        );
        setLoadingPlanId(null);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        console.error("Razorpay payment.failed event:", response.error);
        alert(
          `Payment Failed: ${response.error.description} (Reason: ${response.error.reason})`
        );
        setLoadingPlanId(null);
      });
      rzp.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert("An error occurred while initiating payment. Please try again.");
      setLoadingPlanId(null);
    }
  };

  if (!clerkIsLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 mb-6 pb-2">
            Unlock TutorialHub Pro
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose a plan that supercharges your AI course creation. More
            courses, advanced features, and priority support await!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tutorPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.02]
                ${
                  plan.highlight
                    ? "ring-2 ring-purple-500 dark:ring-purple-400 relative overflow-hidden"
                    : "dark:bg-gray-800/70 bg-white/70 backdrop-blur-md"
                }
                ${
                  plan.borderColor
                    ? plan.borderColor + " border-t-4"
                    : "dark:border-gray-700 border-t-4 border-gray-300"
                }
                ${
                  plan.id === currentUserActualPlanId
                    ? "opacity-70 pointer-events-none"
                    : ""
                }
                `}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 text-xs bg-purple-500 text-white py-1 px-3 rounded-bl-lg font-semibold">
                  MOST POPULAR
                </div>
              )}
              <CardHeader
                className={`p-8 text-center ${plan.gradient} rounded-t-2xl`}
              >
                {plan.icon && (
                  <plan.icon
                    className={`w-14 h-14 mx-auto mb-4 ${
                      plan.highlight
                        ? "text-purple-600 dark:text-purple-300"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  />
                )}
                <CardTitle className="text-3xl font-bold text-gray-800 dark:text-white">
                  {plan.name}
                </CardTitle>
                {plan.tagline && (
                  <p className="text-md text-gray-500 dark:text-gray-400 mt-1">
                    {plan.tagline}
                  </p>
                )}
                <CardDescription
                  className={`text-5xl font-extrabold my-6 ${
                    plan.highlight
                      ? "text-purple-600 dark:text-purple-300"
                      : "text-primary dark:text-secondary"
                  }`}
                >
                  ₹{plan.price}
                  {plan.price > 0 && (
                    <span className="text-xl font-medium text-gray-500 dark:text-gray-400">
                      /mo
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex-grow">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">
                  Includes up to {plan.courses} AI-generated courses and:
                </p>
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-6 w-6 text-green-500 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-8 mt-auto bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
                <Button
                  className={`w-full py-3.5 text-lg font-semibold rounded-lg transition-transform transform hover:scale-105
                    ${
                      plan.highlight
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-gray-700 hover:bg-gray-800 text-white dark:bg-gray-600 dark:hover:bg-gray-500"
                    }
                    ${
                      loadingPlanId === plan.id ||
                      currentUserActualPlanId === plan.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }
                  `}
                  onClick={() => handlePayment(plan)}
                  disabled={
                    loadingPlanId === plan.id ||
                    currentUserActualPlanId === plan.id ||
                    !clerkIsLoaded
                  }
                  size="lg"
                >
                  {loadingPlanId === plan.id
                    ? "Processing..."
                    : currentUserActualPlanId === plan.id
                    ? "Your Current Plan"
                    : plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-12">
          Payments are securely processed by Razorpay. You can cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default UpgradePage;
