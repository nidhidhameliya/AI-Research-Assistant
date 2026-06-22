"use client";

import { Workflow, Server, Lightbulb, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KnowledgeCard as KnowledgeCardType } from "@/lib/api";

interface KnowledgeCardProps {
  card: KnowledgeCardType;
}

const typeConfig: Record<string, { icon: typeof Workflow; gradient: string; border: string }> = {
  service: {
    icon: Server,
    gradient: "from-blue-500/10 to-cyan-500/10",
    border: "border-blue-500/15",
  },
  flow: {
    icon: Workflow,
    gradient: "from-purple-500/10 to-pink-500/10",
    border: "border-purple-500/15",
  },
  concept: {
    icon: Lightbulb,
    gradient: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-500/15",
  },
  alert: {
    icon: AlertTriangle,
    gradient: "from-red-500/10 to-orange-500/10",
    border: "border-red-500/15",
  },
};

const defaultType = {
  icon: Lightbulb,
  gradient: "from-green-500/10 to-teal-500/10",
  border: "border-green-500/15",
};

export function KnowledgeCard({ card }: KnowledgeCardProps) {
  const config = typeConfig[card.type] || defaultType;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-xs",
        "bg-gradient-to-br transition-all duration-200 hover:scale-[1.01]",
        config.gradient,
        config.border
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className="w-3.5 h-3.5 text-white/50 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h4 className="font-semibold text-white/90 leading-tight mb-1">
            {card.title}
          </h4>
          <p className="text-white/50 leading-relaxed text-[11px]">
            {card.content}
          </p>
        </div>
      </div>
    </div>
  );
}
