// app/course/[courseId]/start/_components/Quiz.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { QuizQuestionType } from "@/types/types";
import { db } from "@/configs/db";
import { UserQuizAttempts } from "@/schema/schema";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type QuizProps = {
  courseId: string;
  chapterIdForQuiz?: number; // Sequence ID of the chapter
  questions: QuizQuestionType[];
  onQuizComplete?: (score: number, totalQuestions: number) => void;
};

const Quiz = ({
  courseId,
  chapterIdForQuiz,
  questions,
  onQuizComplete,
}: QuizProps) => {
  const { user } = useUser();
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string;
  }>({});
  const [score, setScore] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setScore(null);
    setShowResults(false);
    setIsSubmitting(false);
  }, [questions]);

  if (!questions || questions.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        No quiz questions available for this section at the moment.
      </p>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleOptionSelect = (questionIndex: number, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionId,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    let calculatedScore = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctOptionId) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    setShowResults(true);

    if (user && user.id) {
      try {
        await db.insert(UserQuizAttempts).values({
          userId: user.id,
          courseId: courseId,
          score: calculatedScore,
          totalQuestions: questions.length,
          attemptedAt: new Date(),
        });
      } catch (error) {
        console.error("Error saving quiz attempt:", error);
      }
    }

    if (onQuizComplete) {
      onQuizComplete(calculatedScore, questions.length);
    }
    setIsSubmitting(false);
  };

  const questionVariants = {
    initial: { opacity: 0, x: 50, scale: 0.95 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -50, scale: 0.95 },
  };

  if (showResults && score !== null) {
    const percentage = Math.round((score / questions.length) * 100);
    let feedbackMessage = "Keep practicing to improve!";
    if (percentage >= 80)
      feedbackMessage = "Excellent work! You've mastered this section.";
    else if (percentage >= 60)
      feedbackMessage = "Good effort! You're getting there.";

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="py-10 px-4 md:px-0 text-center"
      >
        <Card className="max-w-lg mx-auto shadow-xl dark:bg-gray-800 rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary to-purple-600 dark:from-primary dark:to-purple-700 p-8">
            <CardTitle className="text-3xl font-bold text-white">
              Quiz Results!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl text-gray-700 dark:text-gray-200 space-y-4 p-8">
            <p className="text-2xl">You scored:</p>
            <p className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 py-2">
              {score}
              <span className="text-3xl text-gray-500 dark:text-gray-400">
                {" "}
                / {questions.length}
              </span>
            </p>
            <p className="text-2xl font-semibold">{percentage}%</p>
            <p className="mt-4 text-lg">{feedbackMessage}</p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center p-6 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700">
            <Button
              onClick={() => {
                setShowResults(false);
                setScore(null);
                setCurrentQuestionIndex(0);
                setSelectedAnswers({});
              }}
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-white dark:border-primary-foreground dark:text-primary-foreground dark:hover:bg-primary-foreground dark:hover:text-primary"
            >
              Retake Quiz
            </Button>
            {/* <Button size="lg" onClick={() => router.push(`/next-course-section`)}>Next Chapter</Button> */}
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="py-10 px-4 md:px-0">
      <Card className="max-w-3xl mx-auto shadow-xl dark:bg-gray-800 rounded-xl overflow-hidden">
        <CardHeader className="p-6 border-b dark:border-gray-700">
          <CardTitle className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white flex justify-between items-center">
            <span>Knowledge Check</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-8 min-h-[250px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              variants={questionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="space-y-6"
            >
              <h3 className="text-lg md:text-xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed">
                {currentQuestion.questionText}
              </h3>
              <RadioGroup
                value={selectedAnswers[currentQuestionIndex] || ""}
                onValueChange={(value) =>
                  handleOptionSelect(currentQuestionIndex, value)
                }
                className="space-y-4"
              >
                {currentQuestion.options.map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={`q${currentQuestionIndex}-opt${option.id}`}
                    className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ease-in-out
                                    hover:border-purple-500 dark:hover:border-purple-400 
                                    ${
                                      selectedAnswers[currentQuestionIndex] ===
                                      option.id
                                        ? "border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/40 ring-2 ring-purple-500 dark:ring-purple-400"
                                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                  >
                    <RadioGroupItem
                      value={option.id}
                      id={`q${currentQuestionIndex}-opt${option.id}`}
                      className="border-gray-400 data-[state=checked]:border-primary data-[state=checked]:text-primary focus:ring-primary"
                    />
                    <span
                      className={`text-base ${
                        selectedAnswers[currentQuestionIndex] === option.id
                          ? "font-semibold text-purple-700 dark:text-purple-200"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {option.text}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between items-center p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-sm text-muted-foreground">
            {selectedAnswers[currentQuestionIndex]
              ? "Selection made"
              : "Please select an option"}
          </p>
          <div>
            {currentQuestionIndex < questions.length - 1 ? (
              <Button
                onClick={handleNextQuestion}
                disabled={!selectedAnswers[currentQuestionIndex]}
                size="lg"
                className="font-semibold"
              >
                Next Question
              </Button>
            ) : (
              <Button
                onClick={handleSubmitQuiz}
                disabled={
                  Object.keys(selectedAnswers).length !== questions.length ||
                  isSubmitting
                }
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Quiz;
