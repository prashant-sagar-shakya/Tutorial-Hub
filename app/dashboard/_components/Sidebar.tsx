"use client";

import React, { useContext } from "react";
import { navList } from "../_constants/navList";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { UserCourseListContext } from "@/app/_context/UserCourseList.context";
import WordRotate from "@/components/ui/word-rotate";
import { Button } from "@/components/ui/button";
import { MessageSquareHeart } from "lucide-react";

interface SidebarProps {
  // Add props interface
  onToggleChatPanel: () => void;
}

const DashboardSidebar = ({ onToggleChatPanel }: SidebarProps) => {
  // Use props
  const path = usePathname();
  const { userCourseList } = useContext(UserCourseListContext);
  const courseLimit = 5;

  return (
    <div className="flex flex-col h-full p-4 md:p-5 border-r dark:border-gray-700">
      <div className="mb-8 text-center">
        <WordRotate
          className="text-3xl font-bold text-gray-800 dark:text-white"
          words={["Tutorial", "Hub"]}
          duration={2500}
        />
      </div>

      <Button
        variant="outline"
        className="w-full mb-6 py-3 border-primary text-primary hover:bg-primary hover:text-white dark:border-primary-foreground dark:hover:bg-primary-foreground dark:text-primary transition-all duration-200 font-semibold text-md"
        onClick={onToggleChatPanel}
      >
        <MessageSquareHeart className="mr-2 h-5 w-5" />
        Ask TutorialHub AI
      </Button>

      <nav className="flex-grow">
        <ul className="space-y-1.5">
          {navList.map((item) => (
            <li key={item.id}>
              <Link href={item.route}>
                <Button
                  variant={item.route === path ? "secondary" : "ghost"}
                  className="w-full justify-start py-3 h-auto text-md"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-6 border-t dark:border-gray-700">
        <Progress
          value={(userCourseList.length / courseLimit) * 100}
          className="h-2.5 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
        />
        <p className="text-sm my-2 text-gray-600 dark:text-gray-300">
          {userCourseList.length} of {courseLimit} Courses Created
        </p>
        <Link
          href="/dashboard/upgrade"
          className="text-xs text-primary dark:text-purple-400 hover:underline"
        >
          Upgrade for More
        </Link>
      </div>
    </div>
  );
};

export default DashboardSidebar;
