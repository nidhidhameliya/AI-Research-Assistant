"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/useChat";
import { StreamingMessage } from "./StreamingMessage";
import { SourceCard } from "./SourceCard";
import { KnowledgeCard } from "./KnowledgeCard";
import { User, Brain, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageListProps {
  messages: ChatMessage[];
}

export function MessageList({ messages }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-cyan-500/10">
          <Brain className="h-8 w-8 text-blue-400" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-white">AI Research Assistant</h2>
        <p className="mb-6 max-w-md text-sm leading-relaxed text-[hsl(215,20%,55%)]">
          Ask questions about your docs, runbooks, incident reports, and code repositories.
        </p>
        <div className="grid w-full max-w-lg grid-cols-2 gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <ExampleQuestion key={q} question={q} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function ExampleQuestion({ question }: { question: string }) {
  return (
    <button
      className="glass rounded-xl border border-[hsl(222,47%,18%)] px-3 py-2 text-left text-xs text-[hsl(215,20%,65%)] transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-300"
      onClick={() => {
        const input = document.querySelector<HTMLTextAreaElement>("#chat-input");
        if (input) {
          input.value = question;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.focus();
        }
      }}
    >
      {question}
    </button>
  );
}

const EXAMPLE_QUESTIONS = [
  "How does authentication work?",
  "What caused the last production outage?",
  "Where is the payment service deployed?",
  "How do I fix a CrashLoopBackOff?",
  "Which service owns billing?",
  "What is the onboarding process?",
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 animate-slide-in", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl",
          isUser ? "border border-blue-500/30 bg-blue-500/20" : "border border-purple-500/30 bg-purple-500/20"
        )}
      >
        {isUser ? <User className="h-4 w-4 text-blue-400" /> : <Brain className="h-4 w-4 text-purple-400" />}
      </div>

      <div className={cn("min-w-0 flex-1 max-w-3xl", isUser && "flex justify-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "max-w-xl border border-blue-500/20 bg-blue-500/15 text-white"
              : "glass w-full text-[hsl(213,31%,91%)]"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.error ? (
            <div className="flex items-start gap-2 text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Error</p>
                <p className="mt-1 text-xs text-red-400/80">{message.error}</p>
              </div>
            </div>
          ) : message.isStreaming ? (
            <StreamingMessage content={message.content} />
          ) : (
            <div className="prose-dark">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(215,20%,45%)]">
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source, i) => (
                <SourceCard key={i} source={source} />
              ))}
            </div>
          </div>
        )}

        {!isUser && message.knowledge_cards && message.knowledge_cards.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[hsl(215,20%,45%)]">
              Key Concepts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {message.knowledge_cards.map((card, i) => (
                <KnowledgeCard key={i} card={card} />
              ))}
            </div>
          </div>
        )}

        {!isUser && message.response_time_ms && !message.isStreaming && (
          <p className="mt-2 px-1 text-[10px] text-[hsl(215,20%,35%)]">
            ⚡ {message.response_time_ms.toFixed(0)}ms
          </p>
        )}
      </div>
    </div>
  );
}
