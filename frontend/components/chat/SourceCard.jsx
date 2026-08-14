"use client";

import { cn } from "../../lib/utils";

export function SourceCard({ source }) {
  const isOKF = source.is_okf === true || source.doc_type?.startsWith?.("okf_");
  const shortName = source.filename?.split("/").pop() || source.filename || "Unknown";
  
  let label = "Document";
  if (isOKF) {
    label = source.okf_type || source.doc_type?.replace("okf_", "").replace(/^\w/, (c) => c.toUpperCase()) || "Runbook";
  } else if (source.doc_type) {
    label = source.doc_type.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-[0.75rem] font-medium transition-all duration-200 cursor-default px-2.5 py-1 rounded-md w-fit max-w-full",
        "bg-[hsl(var(--secondary)/0.5)] text-muted-foreground hover:bg-[hsl(var(--secondary))] hover:text-foreground",
        isOKF ? "border border-[hsl(var(--border))]" : "border border-transparent"
      )}
      title={`${source.filename}\n\n${source.content_preview || ""}`}
    >
<<<<<<< HEAD
      <span className="truncate">
        {shortName} <span className="opacity-50 font-normal ml-1">· {label}</span>
      </span>
      {!isOKF && source.confidence && (
        <span className="flex-shrink-0 opacity-40 font-mono ml-1 text-[0.6875rem]">
=======
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{shortName}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={cn("text-xs font-semibold opacity-70")}>
          {config.label}
        </span>
        <span
          className={cn(
            "text-xs font-bold px-1.5 py-0.5 rounded-md",
            source.confidence >= 80
              ? "bg-success/20 text-success"
              : source.confidence >= 60
              ? "bg-warning/20 text-warning"
              : "bg-destructive/20 text-destructive"
          )}
        >
>>>>>>> 9ef3b2057a678c678dfdd46a2744ae1ed3780ccc
          {source.confidence}%
        </span>
      )}
    </div>
  );
}
