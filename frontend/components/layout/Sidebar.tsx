"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  Upload,
  GitFork,
  BarChart3,
  Brain,
  Zap,
  GitCompareArrows,
  LineChart,
  LogOut,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuthSession, getAuthToken } from "@/lib/auth";

const navItems = [
  {
    href: "/chat",
    label: "Chat",
    icon: MessageSquare,
    description: "Ask questions",
  },
  {
    href: "/upload",
    label: "Upload",
    icon: Upload,
    description: "Index documents",
  },
  {
    href: "/github",
    label: "GitHub",
    icon: GitFork,
    description: "Index repositories",
  },
  {
    href: "/admin",
    label: "Dashboard",
    icon: BarChart3,
    description: "System stats",
  },
  {
    href: "/compare",
    label: "Compare",
    icon: GitCompareArrows,
    description: "Multi-doc analysis",
  },
  {
    href: "/evaluation",
    label: "Evaluation",
    icon: LineChart,
    description: "RAG quality",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname.startsWith("/auth");
  const [mounted, setMounted] = useState(false);
  const isSignedIn = mounted && Boolean(getAuthToken());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (isAuthRoute) {
    return null;
  }

  return (
    <aside className="w-64 h-screen flex flex-col border-r border-[hsl(222,47%,18%)] bg-[hsl(222,47%,7%)]">
      {/* Logo */}
      <div className="p-5 border-b border-[hsl(222,47%,18%)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm leading-tight">
              AI Research Assistant
            </h1>
            <p className="text-[10px] text-[hsl(215,20%,55%)] leading-tight mt-0.5">
              RAG Intelligence Platform
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-[hsl(215,20%,40%)] uppercase tracking-widest px-3 pt-2 pb-1">
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-[hsl(215,20%,60%)] hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-blue-400" : "text-[hsl(215,20%,50%)] group-hover:text-white"
                )}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div
                  className={cn(
                    "text-[10px] leading-none mt-0.5",
                    isActive ? "text-blue-400/70" : "text-[hsl(215,20%,40%)]"
                  )}
                >
                  {item.description}
                </div>
              </div>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[hsl(222,47%,18%)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10">
            <Zap className="w-3 h-3 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-medium text-green-400">Groq Powered</p>
              <p className="text-[9px] text-[hsl(215,20%,40%)]">RAG + Hybrid Search</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isSignedIn) {
                clearAuthSession();
                router.push("/auth/login");
              } else {
                router.push("/auth/login");
              }
            }}
            className="flex w-full items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-[hsl(215,20%,65%)] transition hover:bg-white/5 hover:text-white"
          >
            {isSignedIn ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
            <span>{isSignedIn ? "Sign out" : "Sign in"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
