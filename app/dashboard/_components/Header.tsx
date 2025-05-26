"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/app/_components/ThemeToggle";

const Header = () => {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header className="flex justify-between items-center p-4 md:px-6 shadow-sm bg-white dark:bg-gray-800 sticky top-0 z-40 border-b dark:border-gray-700">
      <span className="flex text-3xl font-extrabold items-center text-gray-800 dark:text-gray-100 px-2 py-1"><Link href="/dashboard" aria-label="Dashboard">
        <Image
          src={"/logo.png"}
          alt="TutorialHub logo"
          width={70}
          height={10}
          priority
          className="object-contain"
        />
      </Link>
          TutorialHub
        </span>
      <div className="flex items-center gap-3 md:gap-4">
        <ThemeToggle />
        {isLoaded && isSignedIn ? (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <UserButton afterSignOutUrl="/" />
          </motion.div>
        ) : (
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        )}
      </div>
    </header>
  );
};

export default Header;
