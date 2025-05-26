"use client";

import { useState } from "react";
import { UserCourseListContext } from "../_context/UserCourseList.context";
import DashboardHeader from "./_components/Header";
import DashboardSidebar from "./_components/Sidebar";
import { CourseType } from "@/types/types";
import PageWrapper from "../_components/animations/PageWrapper";
import { ClerkLoaded, useAuth } from "@clerk/nextjs";
import AIChatPanel from "./_components/AIChatPanel";

const DashboardLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const [userCourseList, setUserCourseList] = useState<CourseType[]>([]);
  const { isLoaded } = useAuth();
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false); // State for chat panel

  const toggleChatPanel = () => setIsChatPanelOpen(!isChatPanelOpen);

  return (
    <UserCourseListContext.Provider
      value={{ userCourseList, setUserCourseList }}
    >
      <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="fixed inset-y-0 left-0 z-30 hidden w-64 md:block bg-white dark:bg-gray-800 shadow-lg">
          <ClerkLoaded>
            {/* Pass toggleChatPanel to Sidebar */}
            <DashboardSidebar onToggleChatPanel={toggleChatPanel} />
          </ClerkLoaded>
        </div>
        <div className="flex flex-1 flex-col md:ml-64">
          <ClerkLoaded>
            <DashboardHeader />
          </ClerkLoaded>
          <main className="flex-1 p-6 md:p-10">
            {isLoaded ? (
              <PageWrapper>{children}</PageWrapper>
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}
          </main>
        </div>
        {/* Render AIChatPanel conditionally */}
        {isLoaded && (
          <AIChatPanel isOpen={isChatPanelOpen} onClose={toggleChatPanel} />
        )}
      </div>
    </UserCourseListContext.Provider>
  );
};

export default DashboardLayout;
