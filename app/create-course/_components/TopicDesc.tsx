// app/create-course/_components/TopicDesc.tsx
"use client";

import { UserInputContext } from "@/app/_context/UserInputContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserInputType } from "@/types/types";
import React, { useContext } from "react";

const TopicDesc = () => {
  const { userInput, setUserInput } = useContext(UserInputContext);

  const handleInputChange = (fieldName: keyof UserInputType, value: string) => {
    setUserInput((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <Label
          htmlFor="courseTopic"
          className="block text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200"
        >
          Course Topic
        </Label>
        <Input
          id="courseTopic"
          placeholder="e.g., Introduction to Quantum Physics"
          value={userInput?.topic || ""}
          onChange={(e) => handleInputChange("topic", e.target.value)}
          className="w-full text-base p-3 border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary focus:ring-primary dark:focus:ring-primary rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100"
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          What subject will your course primarily focus on? (Min. 3 characters)
        </p>
      </div>
      <div>
        <Label
          htmlFor="courseDescription"
          className="block text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200"
        >
          Course Description
        </Label>
        <Textarea
          id="courseDescription"
          placeholder="Briefly describe what the course is about, its objectives, and target audience..."
          value={userInput?.description || ""}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className="w-full text-base p-3 min-h-[120px] border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary focus:ring-primary dark:focus:ring-primary rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100"
          rows={5}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          Provide more details about your course. (Min. 10 characters)
        </p>
      </div>
    </div>
  );
};

export default TopicDesc;
