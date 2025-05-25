"use client";

import React, { useContext, useEffect, useState } from "react";
import { stepperOptions } from "./_constants/stepperOptions";
import { Button } from "@/components/ui/button";
import SelectCategory from "./_components/SelectCategory";
import TopicDesc from "./_components/TopicDesc";
import SelectOption from "./_components/SelectOption";
import { UserInputContext } from "../_context/UserInputContext";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { generateCourseLayout } from "@/configs/ai-models";
import LoadingDialog from "./_components/LoadingDialog";
import { useUser } from "@clerk/nextjs";
import { storeDataInDatabase } from "./_utils/saveDataInDb";
import uuid4 from "uuid4";
import { useRouter } from "next/navigation";
import { db } from "@/configs/db";
import { CourseList } from "@/schema/schema";
import { eq } from "drizzle-orm";
import { CourseType } from "@/types/types";
import { UserCourseListContext } from "../_context/UserCourseList.context";
import { getTopicImage } from "@/configs/service";

const CreateCoursePage = () => {
  const [step, setStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { userInput, setUserInput } = useContext(UserInputContext);
  const { userCourseList, setUserCourseList } = useContext(
    UserCourseListContext
  );
  const { user } = useUser();
  const router = useRouter();

  const getUserCourses = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    const res = await db
      .select()
      .from(CourseList)
      .where(eq(CourseList.createdBy, user.primaryEmailAddress.emailAddress));
    setUserCourseList(res as CourseType[]);
  };

  const allowNextStep = () => {
    if (step === 0) {
      return (userInput?.category?.trim().length ?? 0) >= 3;
    } else if (step === 1) {
      return (
        (userInput?.topic?.trim().length ?? 0) >= 3 &&
        (userInput?.description?.trim().length ?? 0) >= 10
      );
    } else if (step === 2) {
      return (
        !!userInput?.difficulty &&
        !!userInput?.duration &&
        !!userInput?.video &&
        (userInput?.totalChapters ?? 0) > 0
      );
    }
    return false;
  };

  const generateCourse = async () => {
    if (!userInput || !user) {
      console.error(
        "User input or user data is missing for course generation."
      );
      setLoading(false);
      return;
    }
    const BASIC_PROMPT = `Generate a course tutorial on following details with field name, description, along with the chapter name about and duration: Category '${userInput?.category}' Topic '${userInput?.topic}' Description '${userInput.description}' Level '${userInput?.difficulty}' Duration '${userInput?.duration}' chapters '${userInput?.totalChapters}' in JSON format.\n`;
    setLoading(true);
    try {
      const course_uuid = uuid4();
      const result = await generateCourseLayout.sendMessage(BASIC_PROMPT);
      const data = JSON.parse(result.response.text());

      await storeDataInDatabase(course_uuid, userInput, data, user);

      let bannerUrl = null;
      if (userInput?.topic) {
        bannerUrl = await getTopicImage(userInput.topic);
      }

      if (bannerUrl) {
        const updateResult = await db
          .update(CourseList)
          .set({ courseBanner: bannerUrl })
          .where(eq(CourseList.courseId, course_uuid))
          .returning({ updatedId: CourseList.id });

        if (updateResult.length === 0) {
          console.warn(
            "Failed to update course banner after creation for courseId:",
            course_uuid
          );
        }
      }

      router.replace(`/create-course/${course_uuid}`);
    } catch (error) {
      console.error("Error during course generation process:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getUserCourses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const freeCourseLimit = 5;
    if (userCourseList.length > 0 && userCourseList.length >= freeCourseLimit) {
      router.replace("/dashboard/upgrade");
    }
  }, [userCourseList, router]);

  return (
    <div>
      <div className="flex flex-col justify-center items-center mt-10">
        <h2 className="text-4xl text-primary font-medium">Create New Course</h2>
        <div className="flex mt-10 overflow-x-auto py-2">
          {stepperOptions.map((option, index) => (
            <div key={option.id} className="flex items-center min-w-max px-1">
              <div className="flex flex-col items-center w-[60px] md:w-[120px] text-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 p-3 rounded-full text-white transition-colors duration-300 text-xl md:text-2xl ${
                    step >= index
                      ? "bg-primary"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <option.icon />
                </div>
                <p className="hidden md:block md:text-sm mt-2 text-gray-700 dark:text-gray-300">
                  {option.name}
                </p>
              </div>
              {index !== stepperOptions.length - 1 && (
                <div
                  className={`h-1 w-[40px] md:w-[80px] rounded-full lg:w-[150px] transition-colors duration-300 ${
                    step > index ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-20 lg:px-44 mt-10">
        {step === 0 && <SelectCategory />}
        {step === 1 && <TopicDesc />}
        {step === 2 && <SelectOption />}

        <div className="flex justify-between items-center mt-10 mb-20 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant={"outline"}
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="px-6 py-3 text-base"
          >
            Previous
          </Button>
          {stepperOptions.length - 1 === step ? (
            <Button
              disabled={!allowNextStep() || loading}
              onClick={generateCourse}
              className="gap-2 px-6 py-3 text-base bg-primary hover:bg-purple-700 text-white"
            >
              <FaWandMagicSparkles className="mr-2" /> Generate Course
            </Button>
          ) : (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!allowNextStep()}
              className="px-6 py-3 text-base bg-primary hover:bg-purple-700 text-white"
            >
              Next
            </Button>
          )}
        </div>
      </div>
      <LoadingDialog loading={loading} />
    </div>
  );
};

export default CreateCoursePage;
