// app/api/ai-chat/sessions/[sessionId]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/configs/db";
import { AIChatMessages } from "@/schema/schema";
import { eq, asc } from "drizzle-orm";

type RouteParams = {
  params: {
    sessionId: string;
  };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  const sessionId = parseInt(params.sessionId, 10);

  if (isNaN(sessionId)) {
    return NextResponse.json(
      { error: "Invalid session ID format" },
      { status: 400 }
    );
  }

  try {
    const messages = await db
      .select()
      .from(AIChatMessages)
      .where(eq(AIChatMessages.sessionId, sessionId))
      .orderBy(asc(AIChatMessages.timestamp));

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error(
      `[API_MESSAGES_ROUTE] Error fetching messages for session ${sessionId}:`,
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
