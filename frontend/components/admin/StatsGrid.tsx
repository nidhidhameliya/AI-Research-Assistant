"use client";

import type { StatsResponse } from "@/lib/api";
import {
  FileText,
  GitFork,
  Database,
  MessageSquare,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsGridProps {
  stats: StatsResponse;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: typeof FileText;
  description: string;
  color: string;
  glow: string;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const cards: StatCard[] = [
    {
      label: "Documents Indexed",
      value: stats.documents_indexed.toLocaleString(),
      icon: FileText,
      description: "Files ingested into knowledge base",
      color: "text-blue-400",
      glow: "shadow-blue-500/10",
    },
    {
      label: "Repositories",
      value: stats.repositories_indexed.toLocaleString(),
      icon: GitFork,
      description: "GitHub repos indexed",
      color: "text-purple-400",
      glow: "shadow-purple-500/10",
    },
    {
      label: "Chunks Stored",
      value: stats.chunks_stored.toLocaleString(),
      icon: Database,
      description: "Vector embeddings in ChromaDB",
      color: "text-cyan-400",
      glow: "shadow-cyan-500/10",
    },
    {
      label: "Total Queries",
      value: stats.total_queries.toLocaleString(),
      icon: MessageSquare,
      description: "Questions answered",
      color: "text-green-400",
      glow: "shadow-green-500/10",
    },
    {
      label: "Avg Response Time",
      value: stats.avg_response_time_ms > 0 ? `${stats.avg_response_time_ms.toFixed(0)}ms` : "—",
      icon: Zap,
      description: "Average end-to-end latency",
      color: "text-yellow-400",
      glow: "shadow-yellow-500/10",
    },
    {
      label: "Embedding Model",
      value: "3-small",
      icon: TrendingUp,
      description: "text-embedding-3-small",
      color: "text-orange-400",
      glow: "shadow-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={cn(
              "glass rounded-2xl p-5 border border-[hsl(222,47%,18%)] shadow-lg",
              "hover:border-[hsl(222,47%,24%)] transition-all duration-200 hover:scale-[1.01]",
              card.glow
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className={cn("w-5 h-5", card.color)} />
              <span className={cn("text-2xl font-bold", card.color)}>
                {card.value}
              </span>
            </div>
            <p className="text-white text-sm font-medium">{card.label}</p>
            <p className="text-[hsl(215,20%,45%)] text-xs mt-0.5">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
