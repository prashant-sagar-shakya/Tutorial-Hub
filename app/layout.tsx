// app/layout.tsx
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ClerkProvider, GoogleOneTap } from "@clerk/nextjs";
import { ThemeProvider } from "./_components/providers/ThemeProvider";

const outfitFont = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TutorialHub - TutorialHub",
  description:
    "TutorialHub is an AI-powered platform that allows users to easily create and generate educational courses. By simply entering course details, AI generates the entire course structure along with relevant YouTube videos and images for each chapter.",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      {" "}
      <ClerkProvider>
        <GoogleOneTap />
        <body
          className={`${outfitFont.className} flex flex-col min-h-screen bg-background text-foreground`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </ClerkProvider>
    </html>
  );
}
