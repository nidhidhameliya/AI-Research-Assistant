"use client";

import { useEffect, useState } from "react";
import { BarChart3, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { StatsResponse, SourcesResponse, MetricsResponse } from "@/lib/api";
import { StatsGrid } from "@/components/admin/StatsGrid";
import { SourcesTable } from "@/components/admin/SourcesTable";
import { MetricsGrid } from "@/components/admin/MetricsGrid";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function AdminPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [sources, setSources] = useState<SourcesResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [s, src, m] = await Promise.all([api.getStats(), api.getSources(), api.getMetrics()]);
      setStats(s);
      setSources(src);
      setMetrics(m);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, []);

  return (
    <RequireAuth>
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[hsl(222,47%,18%)] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10">
              <BarChart3 className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-semibold text-white">Admin Dashboard</h1>
              <p className="mt-0.5 text-xs text-[hsl(215,20%,50%)]">
                Knowledge base, observability, and retrieval quality
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-xs text-[hsl(215,20%,50%)] transition-all duration-200 hover:border-[hsl(222,47%,20%)] hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="flex-1 space-y-8 p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <p className="text-sm text-[hsl(215,20%,50%)]">Loading dashboard...</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-400">Failed to load data</p>
                <p className="mt-0.5 text-xs text-red-400/70">{error}</p>
                <p className="mt-1 text-xs text-[hsl(215,20%,45%)]">
                  Make sure the backend proxy is available at /api
                </p>
              </div>
            </div>
          )}

          {stats && !isLoading && (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,20%,45%)]">
                System Metrics
              </h2>
              <StatsGrid stats={stats} />
            </section>
          )}

          {metrics && !isLoading && (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,20%,45%)]">
                Observability
              </h2>
              <MetricsGrid metrics={metrics} />
            </section>
          )}

          {metrics && !isLoading && (
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="glass rounded-2xl border border-[hsl(222,47%,18%)] p-5">
                <h3 className="mb-4 text-sm font-semibold text-white">Top Documents</h3>
                <div className="space-y-3">
                  {metrics.top_documents.length === 0 ? (
                    <p className="text-sm text-[hsl(215,20%,55%)]">No metrics yet.</p>
                  ) : (
                    metrics.top_documents.map((doc) => (
                      <div key={doc.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-[hsl(215,20%,55%)]">
                          <span className="truncate pr-3 text-white">{doc.name}</span>
                          <span>{doc.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                            style={{ width: `${Math.min(100, doc.count * 12)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="glass rounded-2xl border border-[hsl(222,47%,18%)] p-5">
                <h3 className="mb-4 text-sm font-semibold text-white">Top Questions</h3>
                <div className="space-y-3">
                  {metrics.top_questions.length === 0 ? (
                    <p className="text-sm text-[hsl(215,20%,55%)]">No metrics yet.</p>
                  ) : (
                    metrics.top_questions.map((question) => (
                      <div key={question.question} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                        <p className="text-sm text-white">{question.question}</p>
                        <p className="mt-1 text-xs text-[hsl(215,20%,55%)]">Asked {question.count} times</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          {sources && !isLoading && (
            <section className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,20%,45%)]">
                Indexed Sources
              </h2>
              <SourcesTable sources={sources.sources} totalChunks={sources.total_chunks} />
            </section>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
