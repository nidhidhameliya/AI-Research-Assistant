"use client";

import { useEffect, useMemo, useState } from "react";
import { GitCompareArrows, Loader2, RefreshCw, Check } from "lucide-react";
import { api } from "@/lib/api";
import type { SourceItem } from "@/lib/api";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { cn } from "@/lib/utils";

export default function ComparePage() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [question, setQuestion] = useState("Compare authentication systems");
  const [result, setResult] = useState<Record<string, string> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getSources();
        setSources(data.sources);
        const defaults = data.sources.slice(0, 2).map((s) => s.filename || s.source);
        setSelected(defaults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load sources");
      } finally {
        setIsBooting(false);
      }
    };
    void load();
  }, []);

  const selectedLabels = useMemo(() => {
    return selected.map((name) => sources.find((s) => s.filename === name || s.source === name)?.filename || name);
  }, [selected, sources]);

  const toggle = (name: string) => {
    setResult(null);
    setSelected((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name]
    );
  };

  const runComparison = async () => {
    if (selected.length < 2) {
      setError("Pick at least two documents to compare.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.compareDocuments(selected, question);
      setResult(response.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RequireAuth>
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[hsl(222,47%,18%)] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
              <GitCompareArrows className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h1 className="font-semibold text-white">Multi-document Comparison</h1>
              <p className="mt-0.5 text-xs text-[hsl(215,20%,50%)]">
                Compare two or more documents side by side
              </p>
            </div>
          </div>
          <button
            onClick={runComparison}
            disabled={isLoading || selected.length < 2}
            className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Compare
          </button>
        </div>

        <div className="grid flex-1 gap-6 p-6 xl:grid-cols-[320px_1fr]">
          <div className="space-y-4">
            <div className="glass rounded-2xl border border-[hsl(222,47%,18%)] p-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[hsl(215,20%,45%)]">
                Question
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-[hsl(215,20%,40%)]"
                placeholder="What do you want to compare?"
              />
            </div>

            <div className="glass rounded-2xl border border-[hsl(222,47%,18%)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Documents</h2>
                <span className="text-xs text-[hsl(215,20%,55%)]">{selected.length} selected</span>
              </div>
              {isBooting ? (
                <div className="flex items-center gap-2 py-8 text-sm text-[hsl(215,20%,55%)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading sources
                </div>
              ) : (
                <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
                  {sources.length === 0 ? (
                    <p className="text-sm text-[hsl(215,20%,55%)]">Upload or index documents first.</p>
                  ) : (
                    sources.map((source) => {
                      const name = source.filename || source.source;
                      const isSelected = selected.includes(name);
                      return (
                        <button
                          key={name}
                          onClick={() => toggle(name)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition",
                            isSelected
                              ? "border-violet-400/40 bg-violet-500/10 text-white"
                              : "border-white/10 bg-white/[0.03] text-[hsl(215,20%,65%)] hover:bg-white/[0.06] hover:text-white"
                          )}
                        >
                          <span className="truncate pr-2">{name}</span>
                          {isSelected && <Check className="h-4 w-4 text-violet-300" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {selectedLabels.slice(0, 2).map((label) => (
                <div key={label} className="glass rounded-2xl border border-[hsl(222,47%,18%)] p-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-[hsl(215,20%,45%)]">{label}</p>
                  <p className="text-sm text-[hsl(215,20%,65%)]">
                    The comparison output will appear here after you run the request.
                  </p>
                </div>
              ))}
            </div>

            {result && (
              <div className="grid gap-4 lg:grid-cols-2">
                {Object.entries(result).map(([doc, summary]) => (
                  <div key={doc} className="glass rounded-2xl border border-[hsl(222,47%,18%)] p-5">
                    <h3 className="mb-3 text-sm font-semibold text-white">{doc}</h3>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-[hsl(215,20%,65%)]">{summary}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
