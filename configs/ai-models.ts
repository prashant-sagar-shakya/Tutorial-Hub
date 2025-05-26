import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { BaseEnvironment } from "./BaseEnvironment";

const env = new BaseEnvironment();
export const MODEL_NAME = "gemini-1.5-flash";

let genAIInstance: GoogleGenerativeAI | null = null;
let isAIInitialized = false;

try {
  const apiKey = env.GOOGLE_GEMENI_API_KEY;
  if (
    !apiKey ||
    apiKey === "default-gemini-key-please-set-in-env" ||
    apiKey.length < 10
  ) {
    console.error(
      "[ai-models.ts] CRITICAL ERROR: Google Gemini API Key is missing, invalid, or default placeholder. AI features will not work. Please set NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY in your .env.local file."
    );
  } else {
    genAIInstance = new GoogleGenerativeAI(apiKey);
    isAIInitialized = true;
    console.log(
      "[ai-models.ts] GoogleGenerativeAI instance initialized successfully."
    );
  }
} catch (error) {
  console.error("[ai-models.ts] Error initializing GoogleGenerativeAI:", error);
}

function getGenModel() {
  if (!isAIInitialized || !genAIInstance) {
    console.error(
      "[ai-models.ts] AI Service not initialized due to missing/invalid API key. Returning null model."
    );
    throw new Error("AI Service not initialized. Cannot get model.");
  }
  return genAIInstance.getGenerativeModel({ model: MODEL_NAME });
}

const generationConfig = {
  temperature: 0.8,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

let _generateCourseLayoutChat:
  | ReturnType<typeof getGenModel>["startChat"]
  | null = null;
if (isAIInitialized) {
  try {
    _generateCourseLayoutChat = getGenModel().startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              text: "Generate a course tutorial on following details with field name, description, along with the chapter name about and duration: Category 'programming' Topic 'python' Level 'basic' Duration '1 hour' chapters '5' in JSON format.\n",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: '```json\n{\n  "category": "programming",\n  "topic": "python",\n   "description": "Python is a high-level, general-purpose programming language known for its simplicity, readability, and versatility. Its widely used for web development, data analysis, machine learning, and automation tasks.",\n "level": "basic",\n  "duration": "1 hour",\n  "chapters": [\n    {\n      "chapter_name": "Introduction to Python",\n      "description": "This chapter covers the basics of Python programming, including data types, variables, operators, and control flow.",\n      "duration": "15 minutes"\n    },\n    {\n      "chapter_name": "Working with Data Structures",\n      "description": "This chapter explores fundamental data structures like lists, tuples, dictionaries, and sets.",\n      "duration": "20 minutes"\n    },\n    {\n      "chapter_name": "Functions and Modules",\n      "description": "This chapter teaches how to define and use functions, as well as import and utilize modules.",\n      "duration": "15 minutes"\n    },\n    {\n      "chapter_name": "Loops and Iteration",\n      "description": "This chapter focuses on different looping mechanisms like \'for\' and \'while\' loops to iterate over data.",\n      "duration": "10 minutes"\n    },\n    {\n      "chapter_name": "Basic Input and Output",\n      "description": "This chapter covers how to take user input and display output using Python.",\n      "duration": "10 minutes"\n    }\n  ]\n}\n```\n',
            },
          ],
        },
      ],
    });
  } catch (e) {
    console.error(
      "[ai-models.ts] Failed to initialize _generateCourseLayoutChat:",
      e
    );
  }
}
export const generateCourseLayout = _generateCourseLayoutChat!;

let _generateChapterContentAndQuizChat:
  | ReturnType<typeof getGenModel>["startChat"]
  | null = null;
if (isAIInitialized) {
  try {
    _generateChapterContentAndQuizChat = getGenModel().startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              text: "You are an AI assistant designed to generate educational content and quizzes.",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Understood. I will provide chapter content and a related quiz in the specified JSON format.",
            },
          ],
        },
      ],
    });
  } catch (e) {
    console.error(
      "[ai-models.ts] Failed to initialize _generateChapterContentAndQuizChat:",
      e
    );
  }
}
export const generateChapterContentAndQuiz =
  _generateChapterContentAndQuizChat!;

export const isAIServiceInitialized = isAIInitialized;
