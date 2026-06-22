"use client";

import { FileText, Code, AlertTriangle, BookOpen, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Source } from "@/lib/api";

interface SourceCardProps {
  source: Source;
}

const docTypeConfig: Record<string, { icon: typeof FileText; color: string; label: string }> = {
  incident_report: {
    icon: AlertTriangle,
    color: "text-red-400 bg-red-500/10 border-red-500/20",
    label: "Incident",
  },
  runbook: {
    icon: BookOpen,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    label: "Runbook",
  },
  source_code: {
    icon: Code,
    color: "text-green-400 bg-green-500/10 border-green-500/20",
    label: "Code",
  },
  architecture_diagram: {
    icon: Image,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    label: "Diagram",
  },
  architecture: {
    icon: Image,
    color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    label: "Architecture",
  },
  documentation: {
    icon: FileText,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    label: "Docs",
  },
  readme: {
    icon: BookOpen,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    label: "README",
  },
};

const defaultConfig = {
  icon: FileText,
  color: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  label: "Document",
};

export function SourceCard({ source }: SourceCardProps) {
  const config = docTypeConfig[source.doc_type] || defaultConfig;
  const Icon = config.icon;

  const shortName = source.filename.split("/").pop() || source.filename;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs",
        "transition-all duration-200 hover:scale-[1.02] cursor-default group",
        "max-w-[280px]",
        config.color
      )}
      title={`${source.filename}\nConfidence: ${source.confidence}%\n\n${source.content_preview}`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{shortName}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={cn("text-[10px] font-semibold opacity-70")}>
          {config.label}
        </span>
        <span
          className={cn(
            "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
            source.confidence >= 80
              ? "bg-green-500/20 text-green-400"
              : source.confidence >= 60
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-red-500/20 text-red-400"
          )}
        >
          {source.confidence}%
        </span>
      </div>
    </div>
  );
}
