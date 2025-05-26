// app/create-course/page.tsx
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
import { CourseType, UserInputType } from "@/types/types";
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
  const [progressMessage, setProgressMessage] = useState<string>(
    "Processing your request..."
  );

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
    if (!user) {
      setLoading(false);
      setProgressMessage("User not signed in. Please sign in and try again.");
      alert("User not signed in. Please sign in and try again.");
      return;
    }
    if (!userInput) {
      setLoading(false);
      setProgressMessage(
        "Essential course information context is missing. Please try starting over."
      );
      alert(
        "Essential course information context is missing. Please try starting over."
      );
      return;
    }

    if (
      !userInput.topic ||
      userInput.topic.trim() === "" ||
      !userInput.category ||
      userInput.category.trim() === "" ||
      !userInput.difficulty ||
      userInput.difficulty.trim() === "" ||
      !userInput.description ||
      userInput.description.trim() === "" ||
      !userInput.duration ||
      userInput.duration.trim() === "" ||
      !(userInput.totalChapters && userInput.totalChapters > 0) ||
      !userInput.video ||
      userInput.video.trim() === ""
    ) {
      setLoading(false);
      setProgressMessage(
        "Error: Missing essential course information. Please fill all fields from all steps and try again."
      );
      alert(
        "Error: Missing essential course information. Please ensure all fields in all steps are correctly filled and try again."
      );
      return;
    }

    const BASIC_PROMPT = `Generate a course tutorial on following details with field name, description, along with the chapter name about and duration: Category '${userInput.category}' Topic '${userInput.topic}' Description '${userInput.description}' Level '${userInput.difficulty}' Duration '${userInput.duration}' chapters '${userInput.totalChapters}' in JSON format.\n`;
    setLoading(true);
    setProgressMessage("Generating course outline with AI...");

    try {
      const course_uuid = uuid4();
      const aiResult = await generateCourseLayout.sendMessage(BASIC_PROMPT);
      const aiResponseText = aiResult.response.text();
      const aiLayoutJson = JSON.parse(aiResponseText);

      setProgressMessage("Saving course outline...");
      await storeDataInDatabase(course_uuid, userInput, aiLayoutJson, user);

      setProgressMessage("Fetching course banner...");
      let bannerUrl = null;
      if (userInput.topic) {
        bannerUrl = await getTopicImage(userInput.topic);
      }

      if (bannerUrl) {
        setProgressMessage("Updating course banner...");
        await db
          .update(CourseList)
          .set({ courseBanner: bannerUrl })
          .where(eq(CourseList.courseId, course_uuid));
      }

      setProgressMessage("Course outline created successfully!");
      setUserInput({});
      router.replace(`/create-course/${course_uuid}`);
    } catch (error) {
      let userFriendlyError =
        "An unknown error occurred during course generation.";
      if (error instanceof Error) {
        if (
          error.message.toLowerCase().includes("violates not-null constraint")
        ) {
          userFriendlyError = `Error: Could not save course. A required data field was missing. Please review your inputs. Details: ${error.message}`;
        } else if (error.message.toLowerCase().includes("cannot be empty")) {
          userFriendlyError = `Error: ${error.message}. Please ensure all required fields are correctly filled.`;
        } else {
          userFriendlyError = `Error: ${error.message}. Please try again or contact support if it persists.`;
        }
      }
      console.error("Error in generateCourse:", error); // Keep this specific error log for server/dev console
      setProgressMessage(userFriendlyError);
      alert(userFriendlyError);
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
    // TODO: This limit should ideally be fetched from the user's current subscription plan
    if (userCourseList.length > 0 && userCourseList.length >= freeCourseLimit) {
      router.replace("/dashboard/upgrade");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              <FaWandMagicSparkles className="mr-2" /> Create Course Outline
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
      <LoadingDialog loading={loading} message={progressMessage} />
    </div>
  );
};

export default CreateCoursePage;
