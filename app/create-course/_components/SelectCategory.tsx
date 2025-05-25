"use client";

import React, { useContext } from "react";
import { UserInputContext } from "@/app/_context/UserInputContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SelectCategory = () => {
  const { userInput, setUserInput } = useContext(UserInputContext);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput((prev) => ({ ...prev, category: e.target.value }));
  };

  return (
    <div className="px-6 md:px-20 lg:px-32 py-8">
      {" "}
      <Label
        htmlFor="courseCategory"
        className="text-lg font-semibold mb-3 block text-gray-800 dark:text-gray-200"
      >
        Enter the Course Category or Domain
      </Label>
      <Input
        id="courseCategory"
        placeholder="e.g., Web Development, Data Science, Ancient History"
        value={userInput?.category || ""}
        onChange={handleCategoryChange}
        className="w-full max-w-lg text-base p-3 border-gray-300 dark:border-gray-600 focus:border-primary dark:focus:border-primary focus:ring-primary dark:focus:ring-primary rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-100"
      />
      <p className="text-sm text-muted-foreground mt-3">
        Be specific! This helps our AI generate a more relevant and focused
        course outline for you.
      </p>
    </div>
  );
};

export default SelectCategory;
