"use client";

import { useState, useRef, useCallback, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onStop: () => void;
}

export function MessageInput({ onSend, isLoading, onStop }: MessageInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, isLoading, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  };

  return (
    <div className="p-4 border-t border-[hsl(222,47%,18%)] bg-[hsl(222,47%,8%)]">
      <div
        className={cn(
          "flex items-end gap-3 px-4 py-3 rounded-2xl border transition-all duration-200",
          "bg-[hsl(222,47%,11%)] border-[hsl(222,47%,18%)]",
          "focus-within:border-blue-500/40 focus-within:shadow-[0_0_0_3px_hsl(217,91%,60%,0.05)]"
        )}
      >
        {/* Textarea */}
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about authentication, deployments, incidents, runbooks..."
          rows={1}
          className={cn(
            "flex-1 bg-transparent text-sm text-white placeholder-[hsl(215,20%,40%)]",
            "resize-none outline-none border-none",
            "min-h-[24px] max-h-[200px] leading-6"
          )}
          disabled={isLoading && false} // Allow typing during stream
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLoading ? (
            <button
              onClick={onStop}
              className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all duration-200"
              title="Stop generation"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!value.trim()}
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                value.trim()
                  ? "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25"
                  : "bg-[hsl(222,47%,16%)] text-[hsl(215,20%,40%)] cursor-not-allowed"
              )}
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-[10px] text-[hsl(215,20%,35%)] mt-2">
        Press <kbd className="px-1 py-0.5 rounded bg-[hsl(222,47%,14%)] text-[hsl(215,20%,50%)] text-[9px]">Enter</kbd> to send
        {" · "}
        <kbd className="px-1 py-0.5 rounded bg-[hsl(222,47%,14%)] text-[hsl(215,20%,50%)] text-[9px]">Shift+Enter</kbd> for new line
      </p>
    </div>
  );
}
