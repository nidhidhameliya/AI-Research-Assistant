"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { streamChat } from "@/lib/streaming";
import type { KnowledgeCard, Source, ChatMessageItem } from "@/lib/api";

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources?: Source[];
  knowledge_cards?: KnowledgeCard[];
  response_time_ms?: number;
  isStreaming?: boolean;
  error?: string;
}

const ACTIVE_CHAT_KEY = "ara_active_chat";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const abortRef = useRef<AbortController | null>(null);
  const bootstrappedRef = useRef(false);

  const loadChat = useCallback(async (chatId: string) => {
    setIsLoading(true);
    try {
      const chat = await api.getChat(chatId);
      setActiveChatId(chat.id);
      setChatTitle(chat.title);
      setMessages(
        chat.messages.map((message: ChatMessageItem, index) => ({
          id: `${chat.id}-${index}`,
          role: message.role,
          content: message.content,
        }))
      );
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ACTIVE_CHAT_KEY, chat.id);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createFreshChat = useCallback(async (firstQuestion?: string) => {
    const chat = await api.createChat(undefined, firstQuestion);
    setActiveChatId(chat.id);
    setChatTitle(chat.title);
    setMessages([]);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_CHAT_KEY, chat.id);
    }
    return chat.id;
  }, []);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const storedChatId =
      typeof window !== "undefined" ? window.localStorage.getItem(ACTIVE_CHAT_KEY) : null;
    if (storedChatId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadChat(storedChatId);
    }
  }, [loadChat]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      let chatId = activeChatId;
      if (!chatId) {
        chatId = await createFreshChat(question);
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: question,
      };

      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      abortRef.current = new AbortController();

      try {
        await streamChat(
          question,
          {
            onChat: (returnedChatId) => {
              setActiveChatId(returnedChatId);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(ACTIVE_CHAT_KEY, returnedChatId);
              }
            },
            onSources: (sources) => {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantMsgId ? { ...m, sources } : m))
              );
            },
            onToken: (token) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: m.content + token } : m
                )
              );
            },
            onDone: (knowledge_cards, response_time_ms) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, isStreaming: false, knowledge_cards, response_time_ms }
                    : m
                )
              );
              setIsLoading(false);
            },
            onError: (error) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        error,
                        content: m.content || "An error occurred. Please check the backend connection.",
                      }
                    : m
                )
              );
              setIsLoading(false);
            },
          },
          abortRef.current.signal,
          undefined,
          chatId
        );
      } catch {
        setIsLoading(false);
      }
    },
    [activeChatId, createFreshChat, isLoading]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
    setMessages((prev) =>
      prev.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
  }, [stopStreaming]);

  const newChat = useCallback(async () => {
    stopStreaming();
    const chatId = await createFreshChat();
    setMessages([]);
    return chatId;
  }, [createFreshChat, stopStreaming]);

  return {
    activeChatId,
    chatTitle,
    messages,
    isLoading,
    loadChat,
    newChat,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}
