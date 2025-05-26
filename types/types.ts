export type UserInputType = {
  category?: string;
  difficulty?: string;
  duration?: string;
  video?: string;
  totalChapters?: number;
  topic?: string;
  description?: string;
};

export type ChapterType = {
  chapter_name: string;
  description: string;
  duration: string;
};

export type courseOutputType = {
  category: string;
  topic: string;
  description: string;
  level: string;
  duration: string;
  chapters: ChapterType[];
};

export type CourseType = {
  id: number;
  courseId: string;
  courseName: string;
  category: string;
  level: string;
  courseOutput: courseOutputType;
  isVideo: string;
  username: string | null;
  userprofileimage: string | null;
  createdBy: string | null;
  courseBanner: string | null;
  isPublished: boolean;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type CodeExampleType = {
  code: string | string[];
};

export type ChapterSectionType = {
  title: string;
  explanation: string;
  code_examples?: CodeExampleType[];
};

export type ChapterContentType = {
  id: number;
  chapterId: number;
  courseId: string;
  content: ChapterSectionType[];
  videoId: string;
};

export type QuizQuestionOptionType = {
  id: string;
  text: string;
};

export type QuizQuestionType = {
  id?: number;
  courseId?: string;
  chapterId?: number;
  questionText: string;
  options: QuizQuestionOptionType[];
  correctOptionId: string;
  aiGenerated?: boolean;
  explanation_for_correct_answer?: string;
};

export type UserQuizAttemptType = {
  id?: number;
  userId: string;
  courseId: string;
  score: number;
  totalQuestions: number;
  attemptedAt?: Date | string;
};

export type AIChatSessionType = {
  id?: number;
  userId: string;
  sessionName: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type AIChatMessageType = {
  id?: number;
  sessionId: number;
  role: "user" | "model";
  content: string;
  timestamp?: Date | string;
};

export type PlanDetailsType = {
  courses: number;
  name: string;
};
