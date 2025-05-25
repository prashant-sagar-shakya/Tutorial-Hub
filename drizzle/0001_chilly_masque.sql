CREATE TABLE IF NOT EXISTS "courseChapters" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"chapterId" integer NOT NULL,
	"content" json NOT NULL,
	"videoId" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "level" varchar NOT NULL;--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "isVideo" varchar DEFAULT 'Yes' NOT NULL;--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "createdBy" varchar;--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "courseBanner" varchar;--> statement-breakpoint
ALTER TABLE "courseList" ADD COLUMN "isPublished" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "courseList" DROP COLUMN IF EXISTS "created_at";--> statement-breakpoint
ALTER TABLE "courseList" DROP COLUMN IF EXISTS "updated_at";