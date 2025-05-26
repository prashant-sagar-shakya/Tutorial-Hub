ALTER TABLE "courseList" RENAME COLUMN "courseName" TO "name";--> statement-breakpoint
ALTER TABLE "aiChatMessages" ALTER COLUMN "timestamp" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "aiChatSessions" ALTER COLUMN "sessionName" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "aiChatSessions" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "aiChatSessions" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "quizQuestions" ALTER COLUMN "aiGenerated" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "userQuizAttempts" ALTER COLUMN "attemptedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "userSubscriptions" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "userSubscriptions" ALTER COLUMN "updatedAt" SET NOT NULL;