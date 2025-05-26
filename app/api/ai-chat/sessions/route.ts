// app/api/ai-chat/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/configs/db";
import { AIChatSessions } from "@/schema/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const sessions = await db
      .select()
      .from(AIChatSessions)
      .where(eq(AIChatSessions.userId, userId))
      .orderBy(desc(AIChatSessions.updatedAt));
    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error("[API_SESSIONS_ROUTE] Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionName } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required to create a session" },
        { status: 400 }
      );
    }

    const newSessionName =
      sessionName ||
      `Chat - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString(
        [],
        { hour: "2-digit", minute: "2-digit" }
      )}`;

    const newSessionResult = await db
      .insert(AIChatSessions)
      .values({
        userId: userId,
        sessionName: newSessionName,
      })
      .returning();

    if (!newSessionResult || newSessionResult.length === 0) {
      console.error(
        "[API_SESSIONS_ROUTE] Failed to insert new session into DB."
      );
      return NextResponse.json(
        { error: "Failed to create new session in database" },
        { status: 500 }
      );
    }

    return NextResponse.json(newSessionResult[0], { status: 201 });
  } catch (error) {
    console.error(
      "[API_SESSIONS_ROUTE] Error creating new chat session:",
      error
    );
    return NextResponse.json(
      { error: "Failed to create new session" },
      { status: 500 }
    );
  }
}
