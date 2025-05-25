"use client";

import { useState } from "react";
import { UserCourseListContext } from "../_context/UserCourseList.context";
import Header from "./_components/Header";
import Sidebar from "./_components/Sidebar";
import { CourseType } from "@/types/types";
import PageWrapper from "../_components/animations/PageWrapper";
import { ClerkLoaded } from "@clerk/nextjs";

const DashboardLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const [userCourseList, setUserCourseList] = useState<CourseType[]>([]);

  return (
    <UserCourseListContext.Provider
      value={{ userCourseList, setUserCourseList }}
    >
      <ClerkLoaded>
        <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="fixed inset-y-0 left-0 z-30 hidden w-64 md:block bg-white dark:bg-gray-800 shadow-lg">
            <Sidebar />
          </div>
          <div className="flex flex-1 flex-col md:ml-64">
            <Header />
            <main className="flex-1 p-6 md:p-10">
              <PageWrapper>{children}</PageWrapper>
            </main>
          </div>
        </div>
      </ClerkLoaded>
    </UserCourseListContext.Provider>
  );
};

export default DashboardLayout;