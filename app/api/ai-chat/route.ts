// app/api/ai-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  ChatSession,
} from "@google/generative-ai";
import { BaseEnvironment } from "@/configs/BaseEnvironment";
import { db } from "@/configs/db";
import { AIChatSessions, AIChatMessages } from "@/schema/schema";
import { eq, asc } from "drizzle-orm";
import { AIChatMessageType } from "@/types/types";

const env = new BaseEnvironment();

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
      "[API_AI_CHAT_ROUTE] CRITICAL: Gemini API Key is missing or invalid."
    );
  } else {
    genAIInstance = new GoogleGenerativeAI(apiKey);
    isAIInitialized = true;
  }
} catch (error) {
  console.error(
    "[API_AI_CHAT_ROUTE] Error initializing GoogleGenerativeAI:",
    error
  );
}

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 2048,
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

async function getChatHistoryForSession(
  sessionId: number,
  limit: number = 20
): Promise<Array<{ role: string; parts: Array<{ text: string }> }>> {
  const dbMessages = await db
    .select({
      role: AIChatMessages.role,
      content: AIChatMessages.content,
    })
    .from(AIChatMessages)
    .where(eq(AIChatMessages.sessionId, sessionId))
    .orderBy(asc(AIChatMessages.timestamp))
    .limit(limit);

  return dbMessages.map((msg) => ({
    role: msg.role as "user" | "model",
    parts: [{ text: msg.content }],
  }));
}

export async function POST(request: NextRequest) {
  if (!isAIInitialized || !genAIInstance) {
    return NextResponse.json(
      {
        error:
          "AI service is not initialized. Please check server logs for API Key issues.",
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { message, sessionId, userId } = body;

    if (!message || !sessionId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: message, sessionId, or userId" },
        { status: 400 }
      );
    }

    const userMessageToSave: Omit<
      typeof AIChatMessages.$inferInsert,
      "id" | "timestamp"
    > = {
      sessionId: Number(sessionId),
      role: "user",
      content: String(message),
    };
    await db.insert(AIChatMessages).values(userMessageToSave);
    await db
      .update(AIChatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(AIChatSessions.id, Number(sessionId)));

    const geminiHistory = await getChatHistoryForSession(Number(sessionId));

    const model = genAIInstance.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      safetySettings,
      generationConfig,
    });
    const chat: ChatSession = model.startChat({
      history: geminiHistory.slice(0, -1), // Pass all history except the current user message (which will be the new prompt)
    });

    const result = await chat.sendMessage(String(message)); // Send the current user message as new prompt

    let aiResponseText = "";
    if (result.response) {
      aiResponseText = result.response.text();
    } else {
      console.warn(
        "[API_AI_CHAT_ROUTE] AI response content is unexpectedly empty or undefined. Result:",
        result
      );
      aiResponseText =
        "I'm sorry, I couldn't generate a response at this moment.";
    }

    const aiMessageToSave: Omit<
      typeof AIChatMessages.$inferInsert,
      "id" | "timestamp"
    > = {
      sessionId: Number(sessionId),
      role: "model",
      content: aiResponseText,
    };
    const savedAiMessageResult = await db
      .insert(AIChatMessages)
      .values(aiMessageToSave)
      .returning({ id: AIChatMessages.id });

    return NextResponse.json(
      {
        reply: aiResponseText,
        aiMessageSavedId: savedAiMessageResult[0]?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API_AI_CHAT_ROUTE] Error processing chat request:", error);
    let errorMessage = "Failed to get AI response.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object" && error && "toString" in error) {
      errorMessage = error.toString();
    }

    if (error && typeof error === "object" && "response" in error) {
      const aiError = error as any;
      if (aiError.response && aiError.response.promptFeedback) {
        console.error(
          "[API_AI_CHAT_ROUTE] AI Prompt Feedback:",
          aiError.response.promptFeedback
        );
        errorMessage = `AI processing error: ${
          aiError.response.promptFeedback.blockReason ||
          "Blocked by safety settings."
        }`;
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
