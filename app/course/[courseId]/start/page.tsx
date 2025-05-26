"use client";

import { db } from "@/configs/db";
import { CourseChapters, CourseList, QuizQuestions } from "@/schema/schema";
import {
  ChapterContentType,
  ChapterType as CourseOutlineChapterType,
  CourseType,
  QuizQuestionType,
} from "@/types/types";
import { and, eq } from "drizzle-orm";
import React, { useEffect, useState, useCallback } from "react";
import ChapterListCard from "./_components/ChapterListCard";
import ChapterContent from "./_components/ChapterContent";
import Image from "next/image";
import UserToolTip from "./_components/UserToolTip";
import ScrollProgress from "@/components/ui/scroll-progress";
import Quiz from "./_components/Quiz";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type CourseStartProps = {
  params: { courseId: string };
};

const CourseStartPage = ({ params }: CourseStartProps) => {
  const [course, setCourse] = useState<CourseType | null>(null);
  const [selectedChapterOutline, setSelectedChapterOutline] =
    useState<CourseOutlineChapterType | null>(null);
  const [selectedChapterSequenceId, setSelectedChapterSequenceId] = useState<
    number | null
  >(null);

  const [chapterGeneratedContent, setChapterGeneratedContent] =
    useState<ChapterContentType | null>(null);
  const [chapterQuizQuestions, setChapterQuizQuestions] = useState<
    QuizQuestionType[]
  >([]);

  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [isLoadingContentAndQuiz, setIsLoadingContentAndQuiz] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const fetchCourseDetails = useCallback(async () => {
    setIsLoadingCourse(true);
    setContentError(null);
    try {
      const result = await db
        .select()
        .from(CourseList)
        .where(eq(CourseList.courseId, params.courseId))
        .limit(1);

      if (result.length > 0) {
        setCourse(result[0] as CourseType);
        // If no chapter is auto-selected, select the first one by default if course is published
        if (
          !selectedChapterOutline &&
          result[0].isPublished &&
          result[0].courseOutput.chapters.length > 0
        ) {
          setSelectedChapterOutline(result[0].courseOutput.chapters[0]);
          setSelectedChapterSequenceId(0); // Auto-select first chapter (index 0)
        }
      } else {
        setContentError(
          "Course not found. It might have been removed or the link is incorrect."
        );
      }
    } catch (e) {
      console.error("Error fetching course details:", e);
      setContentError("Failed to load course details. Please try again later.");
    } finally {
      setIsLoadingCourse(false);
    }
  }, [params.courseId, selectedChapterOutline]); // Added selectedChapterOutline to dependencies

  useEffect(() => {
    if (params.courseId) {
      fetchCourseDetails();
    }
  }, [params.courseId, fetchCourseDetails]);

  const fetchChapterDataAndQuiz = useCallback(
    async (chapterSeqId: number) => {
      if (!course) return;
      setIsLoadingContentAndQuiz(true);
      setChapterGeneratedContent(null);
      setChapterQuizQuestions([]);
      setContentError(null);

      try {
        const contentRes = await db
          .select()
          .from(CourseChapters)
          .where(
            and(
              eq(CourseChapters.chapterId, chapterSeqId),
              eq(CourseChapters.courseId, course.courseId)
            )
          )
          .limit(1);

        if (contentRes.length > 0) {
          setChapterGeneratedContent(contentRes[0] as ChapterContentType);
        } else {
          console.warn(
            `No generated content found for course ${course.courseId}, chapter sequence ${chapterSeqId}`
          );
          // No contentError set here as quiz might still exist or this is intended.
        }

        const quizRes = await db
          .select()
          .from(QuizQuestions)
          .where(
            and(
              eq(QuizQuestions.chapterId, chapterSeqId),
              eq(QuizQuestions.courseId, course.courseId)
            )
          );

        setChapterQuizQuestions(quizRes as QuizQuestionType[]);
        if (quizRes.length === 0 && contentRes.length > 0) {
          // Content exists but no quiz
          console.warn(
            `No quiz questions found for course ${course.courseId}, chapter sequence ${chapterSeqId}`
          );
        }
      } catch (error) {
        console.error("Error fetching chapter content or quiz:", error);
        setContentError(
          "Failed to load chapter materials. Please try refreshing."
        );
      } finally {
        setIsLoadingContentAndQuiz(false);
      }
    },
    [course]
  );

  useEffect(() => {
    if (
      selectedChapterOutline &&
      selectedChapterSequenceId !== null &&
      course
    ) {
      fetchChapterDataAndQuiz(selectedChapterSequenceId);
    }
  }, [
    selectedChapterSequenceId,
    course,
    selectedChapterOutline,
    fetchChapterDataAndQuiz,
  ]);

  if (isLoadingCourse) {
    return (
      <div className="flex h-screen">
        <div className="fixed md:w-72 hidden md:block h-screen border-r shadow-sm bg-gray-100 dark:bg-gray-800 p-4 space-y-3 animate-pulse">
          <Skeleton className="h-8 w-3/4 bg-gray-300 dark:bg-gray-700 rounded" />
          {[...Array(5)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-14 w-full bg-gray-300 dark:bg-gray-700 rounded"
            />
          ))}
        </div>
        <div className="md:ml-72 flex-1 p-10 space-y-8 flex flex-col items-center justify-center">
          <Skeleton className="h-56 w-full max-w-2xl bg-gray-300 dark:bg-gray-700 rounded-xl" />
          <Skeleton className="h-10 w-3/4 max-w-lg bg-gray-300 dark:bg-gray-700 rounded" />
          <Skeleton className="h-8 w-1/2 max-w-md bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (contentError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-semibold text-red-600 dark:text-red-400 mb-2">
          Oops! Something went wrong.
        </h2>
        <p className="text-gray-700 dark:text-gray-300">{contentError}</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-6">
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (!course) {
    // Should be caught by contentError usually, but as a fallback
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Course could not be loaded.</p>
      </div>
    );
  }

  const handleChapterSelect = (
    chapterOutlineItem: CourseOutlineChapterType,
    chapterIndex: number
  ) => {
    setSelectedChapterOutline(chapterOutlineItem);
    setSelectedChapterSequenceId(chapterIndex);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="md:fixed md:w-72 w-full h-auto md:h-screen md:overflow-y-auto border-r dark:border-gray-700 shadow-md bg-white dark:bg-gray-800 z-20">
        <div className="p-4 bg-gradient-to-r from-primary via-purple-600 to-indigo-600 text-white sticky top-0 z-10 shadow-md">
          <h2
            className="font-semibold text-lg truncate"
            title={course.courseOutput.topic}
          >
            {course.courseOutput.topic}
          </h2>
        </div>
        <div className="py-2">
          {course.courseOutput.chapters.map((chapter, index) => (
            <div
              key={index}
              className={`cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-700/20 transition-colors duration-150
                          ${
                            selectedChapterSequenceId === index
                              ? "bg-purple-100 dark:bg-purple-700/40 border-l-4 border-primary dark:border-primary"
                              : "border-l-4 border-transparent"
                          }`}
              onClick={() => handleChapterSelect(chapter, index)}
            >
              <ChapterListCard
                chapter={chapter}
                index={index}
                isActive={selectedChapterSequenceId === index}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 md:ml-72 mt-16 md:mt-0">
        {" "}
        {/* mt-16 on mobile if sidebar becomes fixed/overlay */}
        {isLoadingContentAndQuiz ? (
          <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] md:min-h-screen space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Loading chapter materials...
            </p>
          </div>
        ) : selectedChapterOutline && chapterGeneratedContent ? (
          <div className="p-4 md:p-8 lg:p-12">
            <ScrollProgress />
            <ChapterContent
              chapter={selectedChapterOutline}
              content={chapterGeneratedContent}
            />
            {chapterQuizQuestions.length > 0 ? (
              <Quiz
                courseId={course.courseId}
                chapterIdForQuiz={selectedChapterSequenceId ?? undefined}
                questions={chapterQuizQuestions}
                onQuizComplete={(score, total) => {
                  alert(
                    `Quiz Attempt Saved! You scored ${score} out of ${total}.`
                  );
                }}
              />
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">
                This chapter's knowledge check is being prepared. Please check
                back soon!
              </p>
            )}
          </div>
        ) : !selectedChapterOutline && course.isPublished ? ( // No chapter selected but course is published
          <div className="p-6 md:p-10 flex justify-center flex-col items-center text-center min-h-[calc(100vh-4rem)] md:min-h-screen">
            <Image
              src={course.courseBanner || "/thumbnail.png"}
              alt={course.courseName}
              width={400}
              height={225}
              priority={false}
              className="rounded-xl shadow-2xl hover:shadow-xl transition-shadow duration-500 cursor-pointer mb-8 object-cover"
            />
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-white">
              Welcome to {course.courseOutput.topic}!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-xl mx-auto">
              {!course.isPublished
                ? "This course content is currently being generated. Please wait or try refreshing."
                : "Select a chapter from the sidebar to begin your learning journey. Enjoy the course!"}
            </p>
            <UserToolTip
              username={course.username || "TutorialHub AI"}
              userProfileImage={course.userprofileimage || "/userProfile.png"}
            />
          </div>
        ) : (
          // Fallback / Chapter content might be missing
          <div className="p-6 md:p-10 flex justify-center flex-col items-center text-center min-h-[calc(100vh-4rem)] md:min-h-screen">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
              Content Not Available
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              The content for this chapter might still be under generation or is
              currently unavailable. Please select another chapter or try again
              later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseStartPage;
