// app/create-course/[courseId]/_utils/generateCourseContent.ts
import {
  startNewChatSession,
  isAIServiceInitialized,
} from "@/configs/ai-models";
import { getYoutubeVideos } from "@/configs/service";
import { db } from "@/configs/db";
import { CourseChapters, QuizQuestions } from "@/schema/schema";
import {
  CourseType,
  ChapterType as CourseOutlineChapterType,
} from "@/types/types";
import { GoogleGenerativeAIError } from "@google/generative-ai";
import { eq } from "drizzle-orm";

type AIQuestionOption = { id: string; text: string };
type AIQuizQuestion = {
  questionText: string;
  options: AIQuestionOption[];
  correctOptionId: string;
  explanation_for_correct_answer?: string;
};
type AIChapterSection = {
  title: string;
  explanation: string;
  code_examples?: Array<{ code: string | string[] }>;
};
type AIChapterResponse = {
  chapterDetails: AIChapterSection[];
  quiz: AIQuizQuestion[];
};

export const generateCourseContentAndQuizForChapters = async (
  course: CourseType,
  setLoading: (loading: boolean) => void,
  setProgressMessage?: (message: string) => void
) => {
  setLoading(true);
  if (!isAIServiceInitialized) {
    const errorMsg =
      "AI Service is not initialized. Please check API Key and server logs.";
    console.error(`[ContentGen] ${errorMsg}`);
    if (setProgressMessage) setProgressMessage(errorMsg);
    setLoading(false);
    return;
  }

  if (setProgressMessage)
    setProgressMessage(
      `Preparing to generate content for "${course.courseName}"...`
    );

  try {
    const courseOutlineChapters = course.courseOutput.chapters;
    if (!courseOutlineChapters || courseOutlineChapters.length === 0) {
      if (setProgressMessage)
        setProgressMessage("Error: No chapters found in the course outline.");
      setLoading(false);
      return;
    }

    if (setProgressMessage)
      setProgressMessage(
        `Deleting existing content & quizzes for "${course.courseName}"...`
      );
    await db
      .delete(CourseChapters)
      .where(eq(CourseChapters.courseId, course.courseId));
    await db
      .delete(QuizQuestions)
      .where(eq(QuizQuestions.courseId, course.courseId));
    if (setProgressMessage)
      setProgressMessage("Existing data cleared. Starting generation...");

    for (let index = 0; index < courseOutlineChapters.length; index++) {
      const chapterOutline: CourseOutlineChapterType =
        courseOutlineChapters[index];
      const currentProgress = `(${index + 1}/${courseOutlineChapters.length})`;

      const PROMPT = `
        Based on the course titled "${course.courseName}" (category: ${course.category}, level: ${course.level}),
        generate detailed content AND a short quiz (3-5 questions) for the chapter: "${chapterOutline.chapter_name}".
        The chapter's brief description is: "${chapterOutline.description}".

        Return the response strictly in the following JSON format:
        {
          "chapterDetails": [
            {
              "title": "Section Title 1 (e.g., Key Concepts)",
              "explanation": "In-depth explanation for section 1. Use markdown for formatting if necessary, ensure valid JSON string escaping (e.g., newlines as \\n).",
              "code_examples": [ { "code": "<precode>Your code here (properly escaped for JSON strings)</precode>" } ]
            }
          ],
          "quiz": [
            {
              "questionText": "Clear question about chapter content.",
              "options": [
                { "id": "A", "text": "Option A" },
                { "id": "B", "text": "Option B" },
                { "id": "C", "text": "Option C" },
                { "id": "D", "text": "Option D (optional)" }
              ],
              "correctOptionId": "B",
              "explanation_for_correct_answer": "Brief reasoning (optional)."
            }
          ]
        }
        Ensure all text within explanations and code examples is properly escaped for JSON strings.
        The 'code_examples' field should contain an array of objects, where each object has a 'code' key. The value of 'code' should be a single string, potentially with <precode> tags as shown.
        The quiz should have between 3 to 5 relevant multiple-choice questions. Ensure option IDs are single uppercase letters like A, B, C, D.
      `;

      let videoId = "NOT_FOUND";

      try {
        if (setProgressMessage)
          setProgressMessage(
            `Fetching video for ${chapterOutline.chapter_name} ${currentProgress}...`
          );
        const youtubeQuery = `${course.courseName}: ${chapterOutline.chapter_name}`;
        const videoResp = await getYoutubeVideos(youtubeQuery);
        if (videoResp && videoResp.length > 0 && videoResp[0].id?.videoId) {
          videoId = videoResp[0].id.videoId;
        } else {
          console.warn(
            `[ContentGen] No YouTube video found for query: ${youtubeQuery}`
          );
        }

        if (setProgressMessage)
          setProgressMessage(
            `AI processing for ${chapterOutline.chapter_name} ${currentProgress}...`
          );

        const chatSessionForChapter = startNewChatSession();
        const aiResult = await chatSessionForChapter.sendMessage(PROMPT);

        if (!aiResult.response) {
          console.error(
            `[ContentGen] No response text from AI for chapter: ${chapterOutline.chapter_name} ${currentProgress}`
          );
          if (setProgressMessage)
            setProgressMessage(
              `Error (No AI response text) for: ${chapterOutline.chapter_name} ${currentProgress}`
            );
          continue;
        }

        const rawResponseText = aiResult.response.text();
        let parsedResponse: AIChapterResponse;

        try {
          const cleanedJsonString = rawResponseText
            .replace(/^```json\s*|\s*```$/g, "")
            .trim();
          if (!cleanedJsonString) {
            console.error(
              `[ContentGen] AI response was empty after cleaning for chapter: ${chapterOutline.chapter_name} ${currentProgress}`
            );
            throw new Error("AI response was empty after cleaning.");
          }
          parsedResponse = JSON.parse(cleanedJsonString) as AIChapterResponse;
        } catch (parseError) {
          console.error(
            `[ContentGen] Failed to parse AI JSON response for chapter "${chapterOutline.chapter_name}" ${currentProgress}:`,
            parseError
          );
          console.error(
            "[ContentGen] Raw AI Response (first 500 chars):",
            rawResponseText.substring(0, 500)
          );
          if (setProgressMessage)
            setProgressMessage(
              `Error (JSON parse) for: ${chapterOutline.chapter_name} ${currentProgress}. Check server logs.`
            );
          continue;
        }

        if (
          !parsedResponse.chapterDetails ||
          !Array.isArray(parsedResponse.chapterDetails) ||
          !parsedResponse.quiz ||
          !Array.isArray(parsedResponse.quiz)
        ) {
          console.error(
            `[ContentGen] Malformed AI response structure (missing/invalid chapterDetails or quiz array) for chapter: ${chapterOutline.chapter_name} ${currentProgress}. Parsed:`,
            parsedResponse
          );
          if (setProgressMessage)
            setProgressMessage(
              `Error (Malformed AI response) for: ${chapterOutline.chapter_name} ${currentProgress}`
            );
          continue;
        }

        if (setProgressMessage)
          setProgressMessage(
            `Saving content for ${chapterOutline.chapter_name} ${currentProgress}...`
          );

        const chapterContentToInsert = {
          chapterId: index,
          courseId: course.courseId,
          content: parsedResponse.chapterDetails,
          videoId: videoId,
        };
        await db.insert(CourseChapters).values(chapterContentToInsert);
        console.log(
          `[ContentGen] Successfully inserted CourseChapter for course ${course.courseId}, chapter sequence ${index}`
        );

        if (parsedResponse.quiz.length > 0) {
          if (setProgressMessage)
            setProgressMessage(
              `Saving quiz for ${chapterOutline.chapter_name} ${currentProgress}...`
            );
          const quizInserts = parsedResponse.quiz.map((q: AIQuizQuestion) => ({
            courseId: course.courseId,
            chapterId: index,
            questionText: q.questionText,
            options: q.options,
            correctOptionId: q.correctOptionId,
          }));
          await db.insert(QuizQuestions).values(quizInserts);
          console.log(
            `[ContentGen] Successfully inserted ${quizInserts.length} quiz questions for course ${course.courseId}, chapter sequence ${index}`
          );
        } else {
          console.warn(
            `[ContentGen] No quiz questions generated by AI for chapter: ${chapterOutline.chapter_name} ${currentProgress}`
          );
        }

        if (setProgressMessage)
          setProgressMessage(
            `Successfully processed: ${chapterOutline.chapter_name} ${currentProgress}`
          );
      } catch (chapterSpecificError) {
        console.error(
          `[ContentGen] Error processing chapter ${index} ("${chapterOutline.chapter_name}") ${currentProgress}:`,
          chapterSpecificError
        );
        if (chapterSpecificError instanceof GoogleGenerativeAIError) {
          console.error(
            "[ContentGen] Google AI Error Details:",
            chapterSpecificError.message,
            (chapterSpecificError as any).errorDetails ||
              (chapterSpecificError as any).data
          );
        }
        if (setProgressMessage)
          setProgressMessage(
            `Error occurred during: ${chapterOutline.chapter_name} ${currentProgress}. Check server logs.`
          );
      }
    }
    if (setProgressMessage)
      setProgressMessage(
        "All content and quizzes generation process completed!"
      );
  } catch (overallError) {
    console.error(
      "[ContentGen] Overall error in generateCourseContentAndQuizForChapters:",
      overallError
    );
    if (setProgressMessage)
      setProgressMessage(
        "An unexpected error occurred during the generation process."
      );
  } finally {
    setLoading(false);
  }
};
