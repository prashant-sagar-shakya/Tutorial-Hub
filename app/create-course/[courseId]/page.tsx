"use client";

import { db } from "@/configs/db";
import { CourseList } from "@/schema/schema";
import { useUser } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import React, { useEffect, useState } from "react"; // Added React
import CourseBasicInfo from "./_components/CourseBasicInfo";
import CourseDetail from "./_components/CourseDetail";
import ChapterList from "./_components/ChapterList";
import { Button } from "@/components/ui/button";
import { generateCourseContentAndQuizForChapters } from "./_utils/generateCourseContent"; // Updated import
import LoadingDialog from "../_components/LoadingDialog"; // Check path for LoadingDialog
import { useRouter } from "next/navigation";
import { CourseType } from "@/types/types";
import { ArrowRightIcon } from "lucide-react"; // For Finish button

export type ParamsType = {
  courseId: string; // This should be the UUID
};

const CourseCreationPageLayout = ({ params }: { params: ParamsType }) => {
  const { user } = useUser();
  const [course, setCourse] = useState<CourseType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<string>(
    "Generating course content, please wait..."
  ); // For detailed loading messages
  const [isContentGenerated, setIsContentGenerated] = useState<boolean>(false);

  const router = useRouter();

  const fetchCourse = async () => {
    if (!user || !params.courseId) return;
    try {
      const res = await db
        .select()
        .from(CourseList)
        .where(
          and(
            eq(CourseList.courseId, params.courseId), // Query by UUID
            eq(
              CourseList.createdBy,
              user.primaryEmailAddress?.emailAddress ?? ""
            )
          )
        )
        .limit(1);

      if (res.length > 0) {
        setCourse(res[0] as CourseType);
        setIsContentGenerated(res[0].isPublished); // isPublished indicates content generation
      } else {
        console.warn("Course not found or not owned by user:", params.courseId);
        router.replace("/dashboard"); // Or a 404 page
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      router.replace("/dashboard");
    }
  };

  useEffect(() => {
    if (user && params.courseId) {
      fetchCourse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.courseId, user]);

  const handleGenerateCourseContent = async () => {
    if (!course) return;
    try {
      await generateCourseContentAndQuizForChapters(
        course,
        setLoading,
        setProgressMessage
      );
      // Update isPublished status in DB
      await db
        .update(CourseList)
        .set({ isPublished: true, updatedAt: new Date() })
        .where(eq(CourseList.courseId, params.courseId));

      setIsContentGenerated(true);
      setProgressMessage(
        "Content and quizzes generated successfully! Proceed to finish."
      );
    } catch (error) {
      console.error("Error during course content generation process:", error);
      setProgressMessage(
        "An error occurred during generation. Please try again."
      );
    }
  };

  if (!user) {
    // Or use useAuth().isLoaded for a loading state
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading user information...</p>
      </div>
    );
  }
  if (!course) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mt-8 md:mt-12 px-4 sm:px-6 md:px-10 lg:px-20 xl:px-44 pb-20">
      <h2 className="font-bold text-center text-3xl md:text-4xl mb-8 text-gray-800 dark:text-white">
        Finalize Your Course:{" "}
        <span className="text-primary">{course.courseOutput.topic}</span>
      </h2>

      <LoadingDialog loading={loading} message={progressMessage} />

      <div className="space-y-8">
        <CourseBasicInfo
          courseInfo={course}
          onRefresh={fetchCourse}
          edit={true}
        />
        <CourseDetail courseDetail={course} />
        <ChapterList course={course} onRefresh={fetchCourse} edit={true} />
      </div>

      <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
        {!isContentGenerated ? (
          <Button
            size="lg"
            className="w-full sm:w-auto px-8 py-3 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
            onClick={handleGenerateCourseContent}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Chapter Content & Quizzes"}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="default"
            className="w-full sm:w-auto px-8 py-3 text-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
            onClick={() =>
              router.push(`/create-course/${params.courseId}/finish`)
            }
          >
            Finish & View Course <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
      {isContentGenerated && !loading && (
        <p className="text-center mt-4 text-green-600 dark:text-green-400 font-medium">
          Chapter content and quizzes have been generated. You can now proceed
          to finish.
        </p>
      )}
    </div>
  );
};

export default CourseCreationPageLayout;
