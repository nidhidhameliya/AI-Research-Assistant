"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, MessageSquare, Clock3, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ChatSummary } from "@/lib/api";

interface RecentChatsProps {
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  onNewChat: () => Promise<string>;
}

export function RecentChats({ activeChatId, onSelect, onNewChat }: RecentChatsProps) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    try {
      setChats(await api.getChats());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);

  const handleNewChat = async () => {
    const chatId = await onNewChat();
    await refresh();
    onSelect(chatId);
  };

  const handleDelete = async (chatId: string) => {
    await api.deleteChat(chatId);
    if (chatId === activeChatId) {
      const nextId = await onNewChat();
      await refresh();
      onSelect(nextId);
      return;
    }
    await refresh();
  };

  return (
    <aside className="w-72 shrink-0 border-r border-[hsl(222,47%,18%)] bg-[hsl(222,47%,6%)] flex flex-col h-full">
      <div className="p-4 border-b border-[hsl(222,47%,18%)]">
        <button
          onClick={handleNewChat}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-[hsl(215,20%,55%)]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading chats
          </div>
        ) : chats.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-[hsl(215,20%,55%)]">
            Your recent chats will appear here after your first question.
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                className={cn(
                  "group rounded-2xl border px-3 py-3 transition",
                  isActive
                    ? "border-blue-500/40 bg-blue-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                )}
              >
                <button
                  onClick={() => onSelect(chat.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare className={cn("mt-0.5 h-4 w-4 shrink-0", isActive ? "text-blue-300" : "text-[hsl(215,20%,50%)]")} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{chat.title}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[hsl(215,20%,50%)]">
                        <Clock3 className="h-3 w-3" />
                        <span>{new Date(chat.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </button>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleDelete(chat.id)}
                    className="rounded-lg p-1.5 text-[hsl(215,20%,50%)] opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-300"
                    title="Delete chat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
