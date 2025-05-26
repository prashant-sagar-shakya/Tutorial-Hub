CREATE TABLE IF NOT EXISTS "aiChatMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" integer NOT NULL,
	"role" varchar(10) NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aiChatSessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"sessionName" varchar(255) DEFAULT 'New Chat',
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quizQuestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar(255) NOT NULL,
	"chapterId" integer,
	"questionText" text NOT NULL,
	"options" json NOT NULL,
	"correctOptionId" varchar(10) NOT NULL,
	"aiGenerated" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userQuizAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"courseId" varchar(255) NOT NULL,
	"score" integer NOT NULL,
	"totalQuestions" integer NOT NULL,
	"attemptedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "userSubscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"currentPlanId" varchar(50) DEFAULT 'free' NOT NULL,
	"courseCreationLimit" integer DEFAULT 5 NOT NULL,
	"razorpayOrderId" varchar(255),
	"razorpayPaymentId" varchar(255),
	"razorpaySubscriptionId" varchar(255),
	"subscriptionStartDate" timestamp,
	"subscriptionEndDate" timestamp,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "userSubscriptions_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "courseChapters" ALTER COLUMN "courseId" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "courseChapters" ALTER COLUMN "videoId" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "courseId" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "category" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "level" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "isVideo" SET DATA TYPE varchar(10);--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "username" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "userprofileimage" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "createdBy" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "courseList" ALTER COLUMN "courseBanner" SET DATA TYPE varchar(1024);--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "courseName" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "createdAt" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "updatedAt" timestamp DEFAULT now();--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aiChatMessages" ADD CONSTRAINT "aiChatMessages_sessionId_aiChatSessions_id_fk" FOREIGN KEY ("sessionId") REFERENCES "public"."aiChatSessions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "quizQuestions" ADD CONSTRAINT "quizQuestions_courseId_courseList_courseId_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courseList"("courseId") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "userQuizAttempts" ADD CONSTRAINT "userQuizAttempts_courseId_courseList_courseId_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courseList"("courseId") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courseChapters" ADD CONSTRAINT "courseChapters_courseId_courseList_courseId_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courseList"("courseId") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "courseList" DROP COLUMN IF EXISTS "name";--> statement-breakpoint
ALTER TABLE "courseList" ADD CONSTRAINT "courseList_courseId_unique" UNIQUE("courseId");