"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { LineChart, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { EvaluationResponse } from "@/lib/api";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function EvaluationPage() {
  const [data, setData] = useState<EvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await api.getEvaluation());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load evaluation");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  return (
    <RequireAuth>
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[hsl(222,47%,18%)] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
              <LineChart className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h1 className="font-semibold text-white">Evaluation Dashboard</h1>
              <p className="mt-0.5 text-xs text-[hsl(215,20%,50%)]">
                Retrieval and answer quality at a glance
              </p>
            </div>
          </div>
          <button
            onClick={load}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-xs text-[hsl(215,20%,50%)] transition-all duration-200 hover:border-[hsl(222,47%,20%)] hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="flex-1 space-y-6 p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {data && !isLoading && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Metric label="Queries" value={data.total_queries.toLocaleString()} />
                <Metric label="Avg Response" value={`${data.average_response_time_ms.toFixed(0)}ms`} />
                <Metric label="Avg Retrievals" value={data.average_retrieval_count.toFixed(1)} />
                <Metric label="Citations" value={data.citation_count.toLocaleString()} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Panel title="Top Documents">
                  {data.top_documents.length === 0 ? (
                    <p className="text-sm text-[hsl(215,20%,55%)]">No queries recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.top_documents.map((doc) => (
                        <div key={doc.name}>
                          <div className="mb-1 flex items-center justify-between text-xs text-[hsl(215,20%,55%)]">
                            <span className="truncate pr-3 text-white">{doc.name}</span>
                            <span>{doc.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-400 to-cyan-400"
                              style={{ width: `${Math.min(100, doc.count * 12)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title="Top Questions">
                  {data.top_questions.length === 0 ? (
                    <p className="text-sm text-[hsl(215,20%,55%)]">No queries recorded yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {data.top_questions.map((question) => (
                        <div key={question.question} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                          <p className="text-sm text-white">{question.question}</p>
                          <p className="mt-1 text-xs text-[hsl(215,20%,55%)]">Asked {question.count} times</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <h2 className="text-sm font-semibold text-white">Quality Snapshot</h2>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <InfoTile label="Retrieval quality" value={`${data.average_retrieval_count.toFixed(1)} chunks/query`} />
                  <InfoTile label="Answer time" value={`${data.average_response_time_ms.toFixed(0)} ms`} />
                  <InfoTile label="Citation density" value={data.citation_count > 0 ? "Healthy" : "Needs usage"} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl border border-[hsl(222,47%,18%)] p-4">
      <p className="text-xs uppercase tracking-wider text-[hsl(215,20%,45%)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-[hsl(222,47%,18%)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">{title}</h3>
      {children}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/10 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-[hsl(215,20%,45%)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
