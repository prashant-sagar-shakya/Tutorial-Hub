ALTER TABLE "courseList" RENAME COLUMN "name" TO "courseName";--> statement-breakpoint
ALTER TABLE "aiChatMessages" ALTER COLUMN "timestamp" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "aiChatSessions" ALTER COLUMN "sessionName" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "aiChatSessions" ALTER COLUMN "createdAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "aiChatSessions" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "createdAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "updatedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "quizQuestions" ALTER COLUMN "aiGenerated" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "userQuizAttempts" ALTER COLUMN "attemptedAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "userSubscriptions" ALTER COLUMN "createdAt" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "userSubscriptions" ALTER COLUMN "updatedAt" DROP NOT NULL;