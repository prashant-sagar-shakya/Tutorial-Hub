// app/dashboard/_components/AIChatPanel.tsx
"use client";

import React, {
  useState,
  useRef,
  useEffect,
  FormEvent,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  PaperPlaneIcon,
  Cross2Icon,
  PlusIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { AIChatMessageType, AIChatSessionType } from "@/types/types";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown"; // Import Components type
import { useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquareHeart } from "lucide-react";

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define a type for the props that our custom 'code' component will receive
// This explicitly includes 'inline' which react-markdown passes.
interface CustomCodeProps {
  node?: any; // node can be complex, using any for simplicity or more specific types from 'unist'
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any; // Allow other props that might be passed
}

const AIChatPanel = ({ isOpen, onClose }: AIChatPanelProps) => {
  const { user, isLoaded: clerkIsLoaded } = useUser();
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState<AIChatMessageType[]>([]);
  const [isLoadingReply, setIsLoadingReply] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sessions, setSessions] = useState<AIChatSessionType[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [initialSessionLoadAttempted, setInitialSessionLoadAttempted] =
    useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  const createAndActivateNewSession = useCallback(async (): Promise<
    number | null
  > => {
    if (!user?.id) return null;

    const tempSessionName = `Chat ${new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    setMessages([]);
    setCurrentMessage("");
    setActiveSessionId(null);
    setIsLoadingMessages(true);

    try {
      const response = await fetch("/api/ai-chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, sessionName: tempSessionName }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create new session on server"
        );
      }
      const newSession: AIChatSessionType = await response.json();
      setSessions((prev) => [
        newSession,
        ...prev.filter((s) => s.id && s.id !== newSession.id),
      ]);
      setActiveSessionId(newSession.id!);
      inputRef.current?.focus();
      return newSession.id!;
    } catch (error) {
      console.error("Error creating and activating new chat session:", error);
      if (sessions.length > 0 && sessions[0].id) {
        setActiveSessionId(sessions[0].id);
      } else {
        setActiveSessionId(null);
      }
      return null;
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user?.id, sessions]);

  useEffect(() => {
    if (isOpen && clerkIsLoaded && user?.id && !initialSessionLoadAttempted) {
      setIsLoadingSessions(true);
      setInitialSessionLoadAttempted(true);
      fetch(`/api/ai-chat/sessions?userId=${user.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch sessions");
          return res.json();
        })
        .then((data: AIChatSessionType[]) => {
          setSessions(data);
          if (data.length > 0) {
            if (
              !activeSessionId ||
              !data.some((s) => s.id === activeSessionId)
            ) {
              setActiveSessionId(data[0].id!);
            }
          } else {
            createAndActivateNewSession();
          }
        })
        .catch((error) => {
          console.error("Error fetching initial sessions:", error);
          createAndActivateNewSession();
        })
        .finally(() => {
          setIsLoadingSessions(false);
        });
    } else if (!isOpen) {
      setInitialSessionLoadAttempted(false);
    }
  }, [
    isOpen,
    clerkIsLoaded,
    user?.id,
    activeSessionId,
    createAndActivateNewSession,
    initialSessionLoadAttempted,
  ]);

  useEffect(() => {
    if (activeSessionId && isOpen) {
      setIsLoadingMessages(true);
      setMessages([]);
      fetch(`/api/ai-chat/sessions/${activeSessionId}/messages`)
        .then((res) => {
          if (!res.ok)
            throw new Error(
              "Failed to fetch messages for session " + activeSessionId
            );
          return res.json();
        })
        .then((data: AIChatMessageType[]) => {
          setMessages(data);
        })
        .catch((error) => {
          console.error(
            `Error fetching messages for session ${activeSessionId}:`,
            error
          );
          setMessages([]);
        })
        .finally(() => {
          setIsLoadingMessages(false);
        });
    } else if (!activeSessionId && isOpen) {
      setMessages([]);
    }
  }, [activeSessionId, isOpen]);

  const handleSendMessage = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (
      currentMessage.trim() === "" ||
      !activeSessionId ||
      !user?.id ||
      isLoadingReply
    )
      return;

    const userMessageContent = currentMessage.trim();

    const newUserMessageForUI: AIChatMessageType = {
      id: `user-${Date.now()}` as any,
      sessionId: activeSessionId,
      role: "user",
      content: userMessageContent,
      timestamp: new Date().toISOString(),
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessageForUI]);
    setCurrentMessage("");
    setIsLoadingReply(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessageContent,
          sessionId: activeSessionId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AI chat API request failed");
      }

      const data = await response.json();
      const aiReplyMessage: AIChatMessageType = {
        id: data.aiMessageSavedId || (`model-${Date.now()}` as any),
        sessionId: activeSessionId,
        role: "model",
        content: data.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, aiReplyMessage]);
    } catch (error) {
      console.error("Error sending message or getting AI response:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      const errorResponseForUI: AIChatMessageType = {
        id: `error-${Date.now()}` as any,
        sessionId: activeSessionId,
        role: "model",
        content: `Sorry, I faced an issue: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, errorResponseForUI]);
    } finally {
      setIsLoadingReply(false);
      inputRef.current?.focus();
    }
  };

  const markdownComponents: Components = {
    p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
    pre: ({ node, ...props }) => (
      <div className="my-1.5">
        <pre
          className="bg-gray-800 dark:bg-black/60 p-2.5 rounded-md overflow-x-auto text-xs text-gray-100 whitespace-pre-wrap break-all"
          {...props}
        />
      </div>
    ),
    code: ({ node, className, children, ...props }: CustomCodeProps) => {
      const isInline = props.inline;
      const match = /language-(\w+)/.exec(className || "");
      return !isInline && match ? (
        <code
          className={`language-${match[1]} text-xs font-mono block`}
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </code>
      ) : (
        <code
          className={`text-xs font-mono ${
            isInline
              ? "px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-purple-700 dark:text-purple-300"
              : "whitespace-pre-wrap break-all"
          }`}
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </code>
      );
    },
    ul: ({ node, ...props }) => (
      <ul className="list-disc list-inside my-1 space-y-0.5 pl-2" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol
        className="list-decimal list-inside my-1 space-y-0.5 pl-2"
        {...props}
      />
    ),
    li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
    a: ({ node, ...props }) => (
      <a
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
  };

  if (!isOpen) {
    return null;
  }

  if (!clerkIsLoaded) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 h-full w-full md:w-[400px] lg:w-[480px] bg-white dark:bg-gray-800 shadow-2xl z-[60] flex flex-col border-l dark:border-gray-700 items-center justify-center"
      >
        <ReloadIcon className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Initializing Chat...</p>
      </motion.div>
    );
  }
  if (clerkIsLoaded && !user) {
    return (
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 h-full w-full md:w-[400px] lg:w-[480px] bg-white dark:bg-gray-800 shadow-2xl z-[60] flex flex-col border-l dark:border-gray-700 items-center justify-center p-4 text-center"
      >
        <p className="text-red-500">
          Please sign in to use the AI Chat feature.
        </p>
        <Button onClick={onClose} className="mt-4" variant="outline">
          Close Panel
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{
        type: "spring",
        stiffness: 320,
        damping: 30,
        duration: 0.4,
      }}
      className="fixed top-0 right-0 h-full w-full md:w-[400px] lg:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-[60] flex flex-col border-l dark:border-gray-700"
    >
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Ask TutorialHub AI
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => createAndActivateNewSession()}
            title="Start New Chat"
            disabled={isLoadingReply || isLoadingSessions}
          >
            {isLoadingSessions && !activeSessionId ? (
              <ReloadIcon className="h-5 w-5 animate-spin" />
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Close Chat"
          >
            <Cross2Icon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-2 border-b dark:border-gray-700">
        <select
          value={activeSessionId || ""}
          onChange={(e) => {
            const newSessionId = Number(e.target.value);
            if (newSessionId && newSessionId !== activeSessionId) {
              setActiveSessionId(newSessionId);
              setMessages([]);
            }
          }}
          className="w-full p-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary focus:border-primary disabled:opacity-50"
          disabled={isLoadingSessions || sessions.length === 0}
          aria-label="Select chat session"
        >
          {isLoadingSessions && <option value="">Loading sessions...</option>}
          {!isLoadingSessions && sessions.length === 0 && (
            <option value="">No chats yet. Start one!</option>
          )}
          {sessions.map((session) => (
            <option key={session.id} value={session.id!}>
              {session.sessionName} (
              {new Date(session.updatedAt!).toLocaleDateString([], {
                month: "short",
                day: "numeric",
              })}
              )
            </option>
          ))}
        </select>
      </div>

      <ScrollArea
        className="flex-grow p-4 space-y-4 bg-gray-100 dark:bg-gray-800/60"
        id="chat-message-scroll-area"
      >
        <AnimatePresence initial={false}>
          {isLoadingMessages && activeSessionId ? (
            <div className="flex flex-col space-y-3 py-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={`skel-msg-${i}`}
                  className={`h-16 rounded-xl ${
                    i % 2 === 0 ? "self-start w-3/4" : "self-end w-2/3"
                  } bg-gray-300 dark:bg-gray-700`}
                />
              ))}
            </div>
          ) : messages.length === 0 && activeSessionId && !isLoadingMessages ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10 px-2 h-full flex flex-col justify-center items-center">
              <MessageSquareHeart className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-lg font-medium">Chat with TutorialHub AI</p>
              <p className="text-sm mt-1">
                Ask anything about your courses, get help with topics, or
                explore new ideas!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id || `msg-${msg.timestamp}-${msg.role}`}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } mb-3`}
              >
                <div
                  className={`flex items-start max-w-[85%] gap-2.5 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="w-7 h-7 border dark:border-gray-600 text-xs flex-shrink-0">
                    <AvatarImage
                      src={msg.role === "user" ? user?.imageUrl : "/ai.png"}
                    />
                    <AvatarFallback>
                      {msg.role === "user"
                        ? user?.fullName?.charAt(0).toUpperCase() || "U"
                        : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`p-3 text-sm shadow-md ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-l-xl rounded-tr-xl"
                        : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-r-xl rounded-tl-xl"
                    }`}
                  >
                    <ReactMarkdown
                      components={markdownComponents}
                      className="prose prose-sm dark:prose-invert max-w-none leading-normal"
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-1" />
        {isLoadingReply && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start mb-3"
          >
            <Avatar className="w-7 h-7 border dark:border-gray-600 text-xs flex-shrink-0">
              <AvatarImage src="/ai.png" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="ml-2.5 p-3 rounded-r-xl rounded-tl-xl shadow-md bg-white dark:bg-gray-700">
              <div className="flex items-center space-x-1.5">
                <span
                  className="h-1.5 w-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0s" }}
                ></span>
                <span
                  className="h-1.5 w-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.15s" }}
                ></span>
                <span
                  className="h-1.5 w-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.3s" }}
                ></span>
              </div>
            </div>
          </motion.div>
        )}
      </ScrollArea>

      <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={
              !clerkIsLoaded ||
              isLoadingSessions ||
              (!activeSessionId && sessions.length === 0)
                ? "Initializing chat..."
                : isLoadingReply
                ? "TutorialHub AI is typing..."
                : "Ask anything..."
            }
            className="flex-grow text-sm p-3 h-11 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-primary dark:focus:border-primary"
            disabled={
              isLoadingReply ||
              !activeSessionId ||
              !user?.id ||
              !clerkIsLoaded ||
              isLoadingSessions ||
              isLoadingMessages
            }
            autoFocus={isOpen}
          />
          <Button
            type="submit"
            size="icon"
            disabled={
              isLoadingReply ||
              currentMessage.trim() === "" ||
              !activeSessionId ||
              !user?.id ||
              !clerkIsLoaded ||
              isLoadingSessions ||
              isLoadingMessages
            }
            className="rounded-lg w-11 h-11 bg-primary hover:bg-purple-700 shrink-0"
          >
            {isLoadingReply ? (
              <ReloadIcon className="h-5 w-5 animate-spin" />
            ) : (
              <PaperPlaneIcon className="h-5 w-5" />
            )}
          </Button>
        </form>
        {!isLoadingSessions &&
          !activeSessionId &&
          user?.id &&
          !isLoadingMessages && (
            <p className="text-xs text-center text-red-500 mt-2">
              Could not load or create a chat session. Try "New Chat" or
              refresh.
            </p>
          )}
      </div>
    </motion.div>
  );
};

export default AIChatPanel;
