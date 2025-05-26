import { ChapterType as CourseOutlineChapterType } from "@/types/types";
import React from "react";
import { LuTimer, LuChevronRight } from "react-icons/lu";
import { FaRegCheckCircle as LuCheckCircle } from "react-icons/fa";

type ChapterListCardProps = {
  chapter: CourseOutlineChapterType;
  index: number;
  isActive?: boolean; // New prop
};

const ChapterListCard = ({
  chapter,
  index,
  isActive,
}: ChapterListCardProps) => {
  return (
    <div
      className={`grid grid-cols-12 p-3 items-center gap-2 ${
        isActive ? "bg-purple-100 dark:bg-purple-800/40" : ""
      }`}
    >
      <div className="col-span-1 flex items-center justify-center">
        {isActive ? (
          <LuCheckCircle
            className={`w-6 h-6 text-primary dark:text-purple-300`}
          />
        ) : (
          <span
            className={`flex items-center justify-center text-xs font-semibold p-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full w-6 h-6`}
          >
            {index + 1}
          </span>
        )}
      </div>
      <div className="col-span-10">
        <h2
          className={`font-medium truncate ${
            isActive
              ? "text-primary dark:text-purple-200"
              : "text-gray-800 dark:text-gray-100"
          }`}
        >
          {chapter.chapter_name}
        </h2>
        <div className="flex items-center text-xs gap-2 text-gray-500 dark:text-gray-400 mt-0.5">
          <LuTimer />
          <span>{chapter.duration}</span>
        </div>
      </div>
      <div className="col-span-1 flex justify-end">
        {isActive && (
          <LuChevronRight className="w-5 h-5 text-primary dark:text-purple-300" />
        )}
      </div>
    </div>
  );
};

export default ChapterListCard;
