"use client";

import { CourseType } from "@/types/types";
import Image from "next/image";
import { MdMenuBook } from "react-icons/md";
import { HiOutlineDotsVertical } from "react-icons/hi";
import DropDownOptions from "./DropDownOptions";
import { db } from "@/configs/db";
import { CourseList } from "@/schema/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

type CourseCardProps = {
  course: CourseType;
  onRefresh: () => void;
  displayUser?: boolean;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  hover: {
    scale: 1.03,
    boxShadow:
      "0px 10px 20px rgba(0, 0, 0, 0.12), 0px 6px 6px rgba(0, 0, 0, 0.08)",
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
};

const CourseCard = ({
  course,
  onRefresh,
  displayUser = false,
}: CourseCardProps) => {
  const handleOnDelete = async () => {
    const res = await db
      .delete(CourseList)
      .where(eq(CourseList.id, course.id))
      .returning({
        id: CourseList.id,
        courseName: CourseList.courseName,
      });

    if (res) {
      onRefresh();
    }
  };

  return (
    <motion.div
      className="shadow-lg rounded-xl border p-3 bg-white dark:bg-gray-800 overflow-hidden flex flex-col h-full"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Link href={`/course/${course.courseId}`} className="block">
        <div className="relative w-full h-48 md:h-52">
          {" "}
          <Image
            src={course?.courseBanner ?? "/thumbnail.png"}
            alt={course?.courseName ?? "TutorialHub Course"}
            fill
            style={{ objectFit: "cover" }}
            priority={false}
            className="rounded-t-lg transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="p-4 flex-grow flex flex-col">
        {" "}
        {/* Padding and flex-grow */}
        <h2 className="font-semibold text-lg text-gray-800 dark:text-white mb-1 flex items-center justify-between truncate">
          <span className="truncate" title={course.courseOutput.topic}>
            {course.courseOutput.topic}
          </span>
          {!displayUser && (
            <DropDownOptions handleDeleteCourse={() => handleOnDelete()}>
              <HiOutlineDotsVertical
                size={24}
                className="cursor-pointer p-1 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-foreground rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              />
            </DropDownOptions>
          )}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 truncate">
          {course.category}
        </p>
        <div className="flex items-center justify-between text-xs mt-auto mb-3">
          {" "}
          {/* mt-auto pushes to bottom */}
          <span className="flex items-center gap-1.5 p-1.5 bg-purple-50 dark:bg-purple-900/30 text-primary dark:text-purple-300 rounded-md">
            <MdMenuBook size={16} /> {course.courseOutput.chapters.length}{" "}
            Chapters
          </span>
          <span className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-md">
            {course.level}
          </span>
        </div>
        {displayUser && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Image
              src={course?.userprofileimage || "/userProfile.png"}
              alt={course?.username || "TutorialHub User"}
              width={28}
              height={28}
              className="rounded-full"
            />
            <Badge variant={"outline"} className="text-xs">
              {course.username}
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CourseCard;
