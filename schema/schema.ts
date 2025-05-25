import {
  pgTable,
  serial,
  varchar,
  json,
  boolean,
  integer,
  timestamp,
  text,
  primaryKey,
} from "drizzle-orm/pg-core";
export const CourseList = pgTable("courseList", {
  id: serial("id").primaryKey(),
  courseId: varchar("courseId", { length: 255 }).notNull().unique(),
  courseName: varchar("courseName", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  level: varchar("level", { length: 50 }).notNull(),
  courseOutput: json("courseOutput").notNull(),
  isVideo: varchar("isVideo", { length: 10 }).notNull().default("Yes"),
  username: varchar("username", { length: 255 }),
  userprofileimage: varchar("userprofileimage", { length: 1024 }),
  createdBy: varchar("createdBy", { length: 255 }),
  courseBanner: varchar("courseBanner", { length: 1024 }),
  isPublished: boolean("isPublished").notNull().default(false),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const CourseChapters = pgTable("courseChapters", {
  id: serial("id").primaryKey(),
  courseId: varchar("courseId", { length: 255 })
    .notNull()
    .references(() => CourseList.courseId, { onDelete: "cascade" }),
  chapterId: integer("chapterId").notNull(),
  content: json("content").notNull(), 
  videoId: varchar("videoId", { length: 50 }).notNull(),
});
export const UserSubscriptions = pgTable("userSubscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull().unique(),
  currentPlanId: varchar("currentPlanId", { length: 50 })
    .notNull()
    .default("free"),
  courseCreationLimit: integer("courseCreationLimit").notNull().default(5),
  razorpayOrderId: varchar("razorpayOrderId", { length: 255 }),
  razorpayPaymentId: varchar("razorpayPaymentId", { length: 255 }),
  razorpaySubscriptionId: varchar("razorpaySubscriptionId", { length: 255 }),
  subscriptionStartDate: timestamp("subscriptionStartDate", { mode: "date" }),
  subscriptionEndDate: timestamp("subscriptionEndDate", { mode: "date" }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

// New table for Quiz Questions (AI Generated)
export const QuizQuestions = pgTable("quizQuestions", {
  id: serial("id").primaryKey(),
  courseId: varchar("courseId", { length: 255 })
    .notNull()
    .references(() => CourseList.courseId, { onDelete: "cascade" }),
  chapterId: integer("chapterId"),
  questionText: text("questionText").notNull(),
  options: json("options").notNull(),
  correctOptionId: varchar("correctOptionId", { length: 10 }).notNull(),
  aiGenerated: boolean("aiGenerated").default(true),
});
export const UserQuizAttempts = pgTable("userQuizAttempts", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  courseId: varchar("courseId", { length: 255 })
    .notNull()
    .references(() => CourseList.courseId, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalQuestions: integer("totalQuestions").notNull(),
  attemptedAt: timestamp("attemptedAt", { mode: "date" }).defaultNow(),
});
export const AIChatSessions = pgTable("aiChatSessions", {
  id: serial("id").primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
  sessionName: varchar("sessionName", { length: 255 }).default("New Chat"),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow(),
});

export const AIChatMessages = pgTable("aiChatMessages", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId")
    .notNull()
    .references(() => AIChatSessions.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 10 }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp", { mode: "date" }).defaultNow(),
});
