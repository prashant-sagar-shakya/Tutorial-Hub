"use client";

import { useState } from "react";
import { UserInputContext } from "../_context/UserInputContext";
import PublicHeaderFromApp from "@/app/_components/Header";
import { CourseType, UserInputType } from "@/types/types";
import { UserCourseListContext } from "../_context/UserCourseList.context";
import PageWrapper from "../_components/animations/PageWrapper";

const CreateCourseLayout = ({ children }: { children: React.ReactNode }) => {
  const [userInput, setUserInput] = useState<UserInputType>({});
  const [userCourseList, setUserCourseList] = useState<CourseType[]>([]);

  return (
    <div className="flex flex-col min-h-screen">
      <UserInputContext.Provider value={{ userInput, setUserInput }}>
        <UserCourseListContext.Provider
          value={{ userCourseList, setUserCourseList }}
        >
          <PublicHeaderFromApp />
          <main className="flex-grow p-6 md:p-10 bg-gray-50 dark:bg-gray-800">
            <PageWrapper>{children}</PageWrapper>
          </main>
          {/* You can add a Footer component here if needed */}
        </UserCourseListContext.Provider>
      </UserInputContext.Provider>
    </div>
  );
};

export default CreateCourseLayout;
