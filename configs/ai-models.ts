// configs/ai-models.ts
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  ChatSession,
  StartChatParams,
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
      "[ai-models.ts] CRITICAL ERROR: Google Gemini API Key is missing, invalid, or default placeholder. " +
        "AI features will not work. Please set NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY in your .env.local file."
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

const generationConfig = {
  temperature: 0.8,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

function getModelInstanceWithRetry(): ReturnType<
  GoogleGenerativeAI["getGenerativeModel"]
> {
  if (!isAIInitialized || !genAIInstance) {
    console.warn(
      "[ai-models.ts] AI Service was not initialized. Attempting re-init for getModelInstanceWithRetry..."
    );
    try {
      const apiKey = env.GOOGLE_GEMENI_API_KEY;
      if (
        !apiKey ||
        apiKey === "default-gemini-key-please-set-in-env" ||
        apiKey.length < 10
      ) {
        throw new Error(
          "Google Gemini API Key is missing or invalid for re-init."
        );
      }
      genAIInstance = new GoogleGenerativeAI(apiKey);
      isAIInitialized = true;
      console.log(
        "[ai-models.ts] GoogleGenerativeAI instance re-initialized successfully in getModelInstanceWithRetry."
      );
    } catch (e) {
      console.error(
        "[ai-models.ts] CRITICAL: Failed to re-initialize GoogleGenerativeAI in getModelInstanceWithRetry:",
        e
      );
      throw new Error("AI Service re-initialization failed.");
    }
  }
  if (!genAIInstance) {
    throw new Error(
      "AI Service genAIInstance is null even after re-init attempt."
    );
  }
  return genAIInstance.getGenerativeModel({
    model: MODEL_NAME,
    safetySettings,
    generationConfig,
  });
}

let _generateCourseLayoutChatInstance: ChatSession | null = null;

function initializeCourseLayoutChat(): ChatSession {
  const model = getModelInstanceWithRetry();
  return model.startChat({
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
}

function getInitializedCourseLayoutChat(): ChatSession {
  if (!_generateCourseLayoutChatInstance) {
    console.warn(
      "[ai-models.ts] _generateCourseLayoutChatInstance was not initialized. Attempting to initialize now."
    );
    try {
      _generateCourseLayoutChatInstance = initializeCourseLayoutChat();
    } catch (e) {
      console.error(
        "[ai-models.ts] CRITICAL: Failed to initialize _generateCourseLayoutChatInstance on demand:",
        e
      );
      throw new Error(
        "Course Layout Chat could not be initialized. Check AI service."
      );
    }
  }
  return _generateCourseLayoutChatInstance;
}

if (isAIInitialized && !_generateCourseLayoutChatInstance) {
  try {
    _generateCourseLayoutChatInstance = initializeCourseLayoutChat();
  } catch (e) {
    console.error(
      "[ai-models.ts] Initial attempt to set _generateCourseLayoutChatInstance failed:",
      e
    );
  }
}

export const generateCourseLayout: ChatSession =
  getInitializedCourseLayoutChat(); // Exporting the ChatSession instance

export function startNewChatSession(
  startParams?: StartChatParams
): ChatSession {
  const model = getModelInstanceWithRetry();
  return model.startChat(
    startParams || {
      history: [
        {
          role: "user",
          parts: [
            {
              text: "You are a helpful AI assistant for TutorialHub, specializing in educational content.",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Okay, I'm ready to assist with course creation or any questions you have about educational topics!",
            },
          ],
        },
      ],
    }
  );
}

export const isAIServiceInitialized = isAIInitialized;
