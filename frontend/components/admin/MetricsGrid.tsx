"use client";

import type { MetricsResponse } from "@/lib/api";
import { Activity, AlertTriangle, Brain, Clock3, MessageSquareText, Search, Workflow } from "lucide-react";

interface MetricsGridProps {
  metrics: MetricsResponse;
}

const cards = (metrics: MetricsResponse) => [
  {
    label: "Total Queries",
    value: metrics.total_queries.toLocaleString(),
    icon: MessageSquareText,
    description: "RAG questions answered",
  },
  {
    label: "Avg Response Time",
    value: `${metrics.average_response_time_ms.toFixed(0)}ms`,
    icon: Clock3,
    description: "End-to-end latency",
  },
  {
    label: "Avg Retrieval Count",
    value: metrics.average_retrieval_count.toFixed(1),
    icon: Search,
    description: "Chunks retrieved per query",
  },
  {
    label: "Avg Retrieval Latency",
    value: `${metrics.average_retrieval_latency_ms.toFixed(0)}ms`,
    icon: Workflow,
    description: "Search latency",
  },
  {
    label: "Avg LLM Latency",
    value: `${metrics.average_llm_latency_ms.toFixed(0)}ms`,
    icon: Brain,
    description: "Generation latency",
  },
  {
    label: "Citation Count",
    value: metrics.citation_count.toLocaleString(),
    icon: Activity,
    description: "Inline source references",
  },
  {
    label: "Token Usage",
    value: metrics.average_token_usage.toFixed(0),
    icon: Brain,
    description: "Approx. output tokens",
  },
  {
    label: "Errors",
    value: metrics.error_count.toLocaleString(),
    icon: AlertTriangle,
    description: "Failed requests recorded",
  },
];

export function MetricsGrid({ metrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards(metrics).map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="glass rounded-2xl border border-[hsl(222,47%,18%)] p-5 shadow-lg transition-all duration-200 hover:border-[hsl(222,47%,24%)]"
          >
            <div className="mb-3 flex items-start justify-between">
              <Icon className="h-5 w-5 text-cyan-300" />
              <span className="text-2xl font-bold text-white">{card.value}</span>
            </div>
            <p className="text-sm font-medium text-white">{card.label}</p>
            <p className="mt-0.5 text-xs text-[hsl(215,20%,45%)]">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}
