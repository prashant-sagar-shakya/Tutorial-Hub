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
import { Input } from "@/components/ui/input"; // Kept for reference if needed, but unused now.
// import { Textarea } from "@/components/ui/textarea"; // Using native textarea for better control over auto-resize
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
          userEmail: user.primaryEmailAddress?.emailAddress,
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
      className="fixed top-0 right-0 h-full w-full md:w-[450px] lg:w-[500px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl z-[60] flex flex-col border-l dark:border-gray-700/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <MessageSquareHeart className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            TutorialHub AI
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => createAndActivateNewSession()}
            title="Start New Chat"
            disabled={isLoadingReply || isLoadingSessions}
            className="hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full"
          >
            {isLoadingSessions && !activeSessionId ? (
              <ReloadIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            title="Close Chat"
            className="hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 rounded-full transition-colors"
          >
            <Cross2Icon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Session Selector */}
      <div className="px-4 py-2 border-b dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <select
          value={activeSessionId || ""}
          onChange={(e) => {
            const newSessionId = Number(e.target.value);
            if (newSessionId && newSessionId !== activeSessionId) {
              setActiveSessionId(newSessionId);
              setMessages([]);
            }
          }}
          className="w-full p-2 text-sm border-none bg-gray-100/50 dark:bg-gray-800/50 rounded-lg focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
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

      {/* Chat Area */}
      <ScrollArea
        className="flex-grow p-4 space-y-6 bg-gray-50/50 dark:bg-gray-900/50"
        id="chat-message-scroll-area"
      >
        <AnimatePresence initial={false}>
          {isLoadingMessages && activeSessionId ? (
            <div className="flex flex-col space-y-4 py-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton
                  key={`skel-msg-${i}`}
                  className={`h-20 rounded-2xl ${
                    i % 2 === 0
                      ? "self-start w-3/4 rounded-tl-none"
                      : "self-end w-3/4 rounded-tr-none"
                  } bg-gray-200 dark:bg-gray-800 animate-pulse`}
                />
              ))}
            </div>
          ) : messages.length === 0 && activeSessionId && !isLoadingMessages ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10 px-4 h-full flex flex-col justify-center items-center gap-4">
              <div className="p-4 bg-primary/5 rounded-full ring-1 ring-primary/10">
                <MessageSquareHeart className="w-12 h-12 text-primary/60" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  How can I help you today?
                </p>
                <p className="text-sm mt-1 text-gray-500 dark:text-gray-400 max-w-[250px] mx-auto">
                  Ask about your courses, credits, or any programming topic.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["My courses?", "Upgrade plan", "Who am I?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setCurrentMessage(q);
                      inputRef.current?.focus();
                    }}
                    className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-full hover:border-primary hover:text-primary transition-colors shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id || `msg-${msg.timestamp}-${msg.role}`}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } mb-6 group`}
              >
                <div
                  className={`flex items-end max-w-[85%] gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-800 shadow-sm flex-shrink-0">
                    <AvatarImage
                      src={msg.role === "user" ? user?.imageUrl : "/ai.png"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {msg.role === "user"
                        ? user?.fullName?.charAt(0).toUpperCase() || "U"
                        : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`p-4 text-sm shadow-sm relative ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-primary to-purple-600 text-white rounded-2xl rounded-tr-sm"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-sm border dark:border-gray-700/50"
                    }`}
                  >
                    <ReactMarkdown
                      components={markdownComponents}
                      className={`prose prose-sm max-w-none leading-relaxed ${
                        msg.role === "user"
                          ? "prose-invert"
                          : "dark:prose-invert"
                      }`}
                    >
                      {msg.content}
                    </ReactMarkdown>
                    <span
                      className={`text-[10px] absolute -bottom-5 ${
                        msg.role === "user" ? "right-1" : "left-1"
                      } text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                      {msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-1" />
        {isLoadingReply && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4 pl-2"
          >
            <Avatar className="w-6 h-6 border dark:border-gray-700">
              <AvatarImage src="/ai.png" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm">
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
            </div>
          </motion.div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <form
          onSubmit={handleSendMessage}
          className="relative flex items-end gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-xl border border-transparent focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
        >
          <textarea
            ref={inputRef as any}
            value={currentMessage}
            onChange={(e) => {
              setCurrentMessage(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(
                e.target.scrollHeight,
                120
              )}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              !clerkIsLoaded || isLoadingSessions
                ? "Initializing..."
                : "Ask anything... (Shift+Enter for new line)"
            }
            className="flex-grow text-sm bg-transparent border-none focus:ring-0 resize-none max-h-[120px] min-h-[24px] py-2 px-2 dark:text-white placeholder:text-gray-400 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
            rows={1}
            disabled={
              isLoadingReply ||
              !activeSessionId ||
              !user?.id ||
              !clerkIsLoaded ||
              isLoadingSessions ||
              isLoadingMessages
            }
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
            className={`rounded-lg w-10 h-10 shrink-0 transition-all ${
              currentMessage.trim()
                ? "bg-primary hover:bg-primary/90 shadow-md"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500"
            }`}
          >
            {isLoadingReply ? (
              <ReloadIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PaperPlaneIcon className="h-4 w-4" />
            )}
          </Button>
        </form>
        {!isLoadingSessions &&
          !activeSessionId &&
          user?.id &&
          !isLoadingMessages && (
            <p className="text-xs text-center text-red-500 mt-2">
              Connection lost. Try refreshing.
            </p>
          )}
      </div>
    </motion.div>
  );
};

export default AIChatPanel;
