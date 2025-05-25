"use client";

import ShinyButton from "@/components/ui/shiny-button";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { user, isLoaded } = useUser();

  return (
    <header className="flex justify-between items-center p-4 md:px-6 shadow-sm bg-white dark:bg-gray-900 sticky top-0 z-50 border-b dark:border-gray-700">
      <Link href="/" aria-label="TutHub Home">
        <Image
          src={"/logo.png"}
          alt="TutHub logo"
          width={130} // Adjusted size
          height={35} // Adjusted size
          priority
          className="object-contain"
        />
      </Link>
      <div className="flex items-center gap-3 md:gap-4">
        <ThemeToggle />
        {/* Clerk loaded check to avoid flicker or errors before Clerk state is known */}
        {isLoaded && !user && (
          <Link href="/sign-up" passHref legacyBehavior>
            <motion.a
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              {/* Using ShinyButton means you might need to style it further or ensure it adapts to themes */}
              <ShinyButton text="Get Started" />
            </motion.a>
          </Link>
        )}
        {isLoaded && user && (
          <Link href="/dashboard" passHref legacyBehavior>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Button
                variant="default"
                size="default"
                className="font-semibold px-5 py-2.5"
              >
                Dashboard
              </Button>
            </motion.a>
          </Link>
        )}
        {!isLoaded && ( // Placeholder while Clerk loads
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
        )}
      </div>
    </header>
  );
};

export default Header;
