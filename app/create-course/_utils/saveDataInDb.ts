// app/create-course/_utils/saveDataInDb.ts
import { db } from "@/configs/db";
import { CourseList } from "@/schema/schema";
import { UserInputType } from "@/types/types";

type ClerkClientUser = Partial<
  ReturnType<typeof import("@clerk/nextjs").useUser>["user"]
>;

export async function storeDataInDatabase(
  courseUUID: string,
  userInput: UserInputType,
  aiGeneratedLayoutData: any,
  clerkUser: ClerkClientUser | null
) {
  if (!userInput.topic || userInput.topic.trim() === "") {
    throw new Error("Validation Failed: Course topic cannot be empty.");
  }
  if (!userInput.category || userInput.category.trim() === "") {
    throw new Error("Validation Failed: Course category cannot be empty.");
  }
  if (!userInput.difficulty || userInput.difficulty.trim() === "") {
    throw new Error("Validation Failed: Course difficulty cannot be empty.");
  }
  if (!aiGeneratedLayoutData) {
    throw new Error(
      "Validation Failed: AI generated course content (layout) cannot be empty."
    );
  }

  const topicToInsert = userInput.topic.trim();
  const categoryToInsert = userInput.category.trim();
  const difficultyToInsert = userInput.difficulty.trim();
  const videoPreference = userInput.video ? userInput.video.trim() : "Yes";

  if (topicToInsert === "") {
    throw new Error(
      "Validation Failed Post-Trim: Course topic (for courseName) cannot be an empty string."
    );
  }

  try {
    const valuesToInsert = {
      courseId: courseUUID,
      courseName: topicToInsert, // Assuming DB column is 'courseName' and Drizzle schema also uses 'courseName'
      category: categoryToInsert,
      level: difficultyToInsert,
      courseOutput: aiGeneratedLayoutData,
      isVideo: videoPreference,
      createdBy: clerkUser?.primaryEmailAddress?.emailAddress || undefined,
      username: clerkUser?.fullName || undefined,
      userprofileimage: clerkUser?.imageUrl || undefined,
    };

    const result = await db
      .insert(CourseList)
      .values(valuesToInsert)
      .returning({
        insertedId: CourseList.id,
        insertedCourseUUID: CourseList.courseId,
        returnedCourseName: CourseList.courseName,
      });
    return result;
  } catch (dbError) {
    console.error(
      "Database operation error during insert in storeDataInDatabase:",
      dbError
    );
    throw dbError;
  }
}
