"use client";

import { useChat } from "@/hooks/useChat";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { Trash2 } from "lucide-react";
import { RecentChats } from "@/components/RecentChats";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function ChatPage() {
  const {
    activeChatId,
    chatTitle,
    messages,
    isLoading,
    loadChat,
    newChat,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useChat();

  return (
    <RequireAuth>
      <div className="flex h-full min-h-0">
        <RecentChats activeChatId={activeChatId} onSelect={loadChat} onNewChat={newChat} />

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[hsl(222,47%,18%)] px-6 py-4">
            <div>
              <h1 className="font-semibold text-white">{chatTitle}</h1>
              <p className="text-[hsl(215,20%,50%)] text-xs mt-0.5">
                Multi-turn RAG with persistent chat history
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-xs text-[hsl(215,20%,50%)] transition-all duration-200 hover:border-[hsl(222,47%,20%)] hover:bg-white/5 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          <MessageList messages={messages} />

          <MessageInput onSend={sendMessage} isLoading={isLoading} onStop={stopStreaming} />
        </div>
      </div>
    </RequireAuth>
  );
}
