"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useTheme } from "next-themes";
import {
  MessageSquare,
  Upload,
  GitFork,
  BarChart3,
  BookOpen,
  Plus,
  Loader2,
  Trash2,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  {
    href: "/knowledge",
    label: "Knowledge",
    icon: BookOpen,
  },
  {
    href: "/upload",
    label: "Uploads",
    icon: Upload,
  },
  {
    href: "/admin",
    label: "Settings",
    icon: BarChart3,
  },
];

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentSessionId = searchParams.get("id");

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId, pathname]);

  const fetchSessions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/chat/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    setDeletingId(sessionId);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      await fetch(`${apiUrl}/chat/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (currentSessionId === sessionId) {
        router.push("/chat");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
<<<<<<< HEAD
    <aside className="w-64 h-screen flex flex-col z-20 flex-shrink-0 bg-background border-r border-[hsl(var(--border))]">
      {/* ── Logo ────────────────────────────────────────────── */}
      <div className="px-4 py-5 pb-4">
        <h1 className="font-semibold text-[0.9375rem] text-foreground tracking-tight">
          AI-Research-Assistant
        </h1>
=======
    <aside className="w-64 h-screen flex flex-col border-r border-border bg-card/50 backdrop-blur-sm z-20 shadow-xl shadow-black/5">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm leading-tight">
              Engineer Hub
            </h1>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5 font-medium">
              Intelligence Platform
            </p>
          </div>
        </div>
>>>>>>> 9ef3b2057a678c678dfdd46a2744ae1ed3780ccc
      </div>

      {/* ── New Chat Button ──────────────────────────────────── */}
      <div className="px-3 pb-4">
        <Link
          href="/chat"
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[0.8125rem] font-medium transition-colors text-foreground hover:bg-[hsl(var(--secondary))]"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 opacity-70" />
            New conversation
          </span>
        </Link>
      </div>

<<<<<<< HEAD
      {/* ── Search Placeholder ───────────────────────────────── */}
      <div className="px-4 pb-4">
        <div className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[0.75rem] text-muted-foreground bg-[hsl(var(--secondary)/0.5)] border border-[hsl(var(--border))]">
          <Search className="w-3.5 h-3.5 opacity-50" />
          <span className="opacity-70">Search</span>
        </div>
      </div>

      {/* ── Recent Chats ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 scrollbar-none">
        <div className="px-1 pb-1 pt-2">
          <p className="text-[0.6875rem] font-medium text-muted-foreground/60">
            Conversations
          </p>
        </div>
=======
      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest px-3 pt-2 pb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group mb-1",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold">{item.label}</div>
                <div
                  className={cn(
                    "text-xs leading-none mt-1",
                    isActive ? "text-primary/70" : "text-muted-foreground/70"
                  )}
                >
                  {item.description}
                </div>
              </div>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              )}
            </Link>
          );
        })}

        <div className="my-4 border-t border-border/50" />

        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest px-3 pt-2 pb-2">
          Recent Chats
        </p>
>>>>>>> 9ef3b2057a678c678dfdd46a2744ae1ed3780ccc

        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground/50" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-[0.75rem] px-1 text-muted-foreground/50 mt-2">
            No past chats
          </p>
        ) : (
          <div className="space-y-0.5 mt-1">
            {sessions.map((s) => {
              const isActive = currentSessionId === s.id;
              return (
                <Link
                  key={s.id}
                  href={`/chat?id=${s.id}`}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[0.8125rem] transition-colors group truncate",
                    isActive 
                      ? "bg-[hsl(var(--secondary))] text-foreground font-medium" 
                      : "text-muted-foreground hover:bg-[hsl(var(--secondary)/0.5)] hover:text-foreground"
                  )}
                >
                  <span className="truncate flex-1 pr-2">{s.title || "New Chat"}</span>
                  
                  {/* Delete button — only shows on hover */}
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className={cn(
                      "opacity-0 flex-shrink-0 p-1 transition-all duration-150 rounded-md hover:bg-background/80 hover:text-foreground",
                      isActive ? "group-hover:opacity-100" : "group-hover:opacity-100"
                    )}
                    title="Delete chat"
                  >
                    {deletingId === s.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    ) : (
                      <Trash2 className="w-3 h-3 text-muted-foreground/70 hover:text-red-500 transition-colors" />
                    )}
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Secondary Links (Footer) ────────────────────────── */}
      <nav className="px-3 pt-3 pb-4 border-t border-[hsl(var(--border))] mt-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors group text-[0.8125rem]",
                  isActive 
                    ? "bg-[hsl(var(--secondary))] text-foreground font-medium" 
                    : "text-muted-foreground hover:bg-[hsl(var(--secondary)/0.5)] hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0 transition-opacity",
                    isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <div className="mt-2 pt-2 border-t border-[hsl(var(--border))]">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-[0.8125rem] text-muted-foreground hover:bg-[hsl(var(--secondary)/0.5)] hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 opacity-60" /> : <Moon className="w-4 h-4 opacity-60" />}
              <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>
        )}
      </nav>
<<<<<<< HEAD
=======

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-success/10 border border-success/20 shadow-sm">
          <Zap className="w-3.5 h-3.5 text-success flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-success">GPT-4o Powered</p>
            <p className="text-[9px] text-success/70 font-medium">RAG + Hybrid Search</p>
          </div>
        </div>
      </div>
>>>>>>> 9ef3b2057a678c678dfdd46a2744ae1ed3780ccc
    </aside>
  );
}

export function Sidebar() {
  return (
    <Suspense
      fallback={
        <aside className="w-64 h-screen flex-shrink-0 bg-background border-r border-[hsl(var(--border))]" />
      }
    >
      <SidebarContent />
    </Suspense>
  );
}
