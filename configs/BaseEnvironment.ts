// configs/BaseEnvironment.ts
import { config } from "dotenv";

config({ path: ".env.local" });

export type Environment = "development" | "production" | "test";

export class BaseEnvironment {
  defaultEnvironmentValues = {
    HOST_URL: "http://localhost:3000",
    GOOGLE_GEMENI_API_KEY: "default-gemini-key-please-set-in-env",
    DRIZZLE_DATABASE_URL:
      "postgresql://myuser:mypassword@mydbhost.com/mydatabase",
    FIREBASE_API_KEY: "default-firebase-api-key",
    FIREBASE_AUTH_DOMAIN: "default-firebase-auth-domain",
    FIREBASE_PROJECT_ID: "default-firebase-project-id",
    FIREBASE_STORAGE_BUCKET: "default-firebase-storage-bucket",
    FIREBASE_MESSAGING_SENDER_ID: "default-firebase-messaging-sender-id",
    FIREBASE_APP_ID: "default-firebase-app-id",
    FIREBASE_MEASUREMENT_ID: "default-firebase-measurement-id",
    YOUTUBE_API_KEY: "default-youtube-key",
    PEXELS_API_KEY: "default-pexels-key",
    RAZORPAY_KEY_ID: "default-razorpay-key-id",
    RAZORPAY_KEY_SECRET: "default-razorpay-key-secret",
  };

  constructor() {
    console.log("[BaseEnvironment] Initializing...");
    // Log all keys being accessed on init for broader debugging (optional)
    // this.GOOGLE_GEMENI_API_KEY; // Access to trigger its log
  }

  get environment(): Environment {
    return process.env.NODE_ENV as Environment;
  }

  get HOST_URL(): string {
    const value = process.env.NEXT_PUBLIC_HOST_URL;
    return value || this.defaultEnvironmentValues.HOST_URL;
  }

  get GOOGLE_GEMENI_API_KEY(): string {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
    // This log will appear in the server terminal when the module is loaded and this getter is accessed.
    console.log(
      "[BaseEnvironment] Accessing GOOGLE_GEMENI_API_KEY. From env:",
      apiKey ? `Exists (length: ${apiKey.length})` : "NOT FOUND / undefined",
      apiKey
        ? ""
        : `| Using default: ${
            this.defaultEnvironmentValues.GOOGLE_GEMENI_API_KEY !==
            "default-gemini-key-please-set-in-env"
              ? "Custom Default"
              : "Hardcoded Default"
          }`
    );
    if (!apiKey) {
      console.warn(
        "[BaseEnvironment] WARNING: NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY is not set in .env.local. Falling back to default. AI features might not work correctly if default is placeholder."
      );
    }
    return apiKey || this.defaultEnvironmentValues.GOOGLE_GEMENI_API_KEY;
  }

  get DRIZZLE_DATABASE_URL(): string {
    const value = process.env.NEXT_PUBLIC_DRIZZLE_DATABASE_URL;
    return value || this.defaultEnvironmentValues.DRIZZLE_DATABASE_URL;
  }

  get FIREBASE_API_KEY(): string {
    const value = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    return value || this.defaultEnvironmentValues.FIREBASE_API_KEY;
  }

  get FIREBASE_AUTH_DOMAIN(): string {
    const value = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    return value || this.defaultEnvironmentValues.FIREBASE_AUTH_DOMAIN;
  }

  get FIREBASE_PROJECT_ID(): string {
    const value = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    return value || this.defaultEnvironmentValues.FIREBASE_PROJECT_ID;
  }

  get FIREBASE_STORAGE_BUCKET(): string {
    const value = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    return value || this.defaultEnvironmentValues.FIREBASE_STORAGE_BUCKET;
  }

  get FIREBASE_MESSAGING_SENDER_ID(): string {
    const value = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    return value || this.defaultEnvironmentValues.FIREBASE_MESSAGING_SENDER_ID;
  }

  get FIREBASE_APP_ID(): string {
    const value = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
    return value || this.defaultEnvironmentValues.FIREBASE_APP_ID;
  }

  get FIREBASE_MEASUREMENT_ID(): string {
    const value = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
    return value || this.defaultEnvironmentValues.FIREBASE_MEASUREMENT_ID;
  }

  get YOUTUBE_API_KEY(): string {
    const value = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    return value || this.defaultEnvironmentValues.YOUTUBE_API_KEY;
  }

  get PEXELS_API_KEY(): string {
    const value = process.env.NEXT_PUBLIC_PEXELS_API_KEY;
    return value || this.defaultEnvironmentValues.PEXELS_API_KEY;
  }

  get RAZORPAY_KEY_ID(): string {
    const value = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    return value || this.defaultEnvironmentValues.RAZORPAY_KEY_ID;
  }

  get RAZORPAY_KEY_SECRET(): string {
    const value = process.env.RAZORPAY_KEY_SECRET;
    return value || this.defaultEnvironmentValues.RAZORPAY_KEY_SECRET;
  }
}
