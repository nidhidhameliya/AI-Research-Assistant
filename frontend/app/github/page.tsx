"use client";

import { useState } from "react";
import { GitFork, Loader2, CheckCircle, AlertCircle, Info, GitBranch } from "lucide-react";
import { api } from "@/lib/api";
import type { GitHubIndexResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function GitHubPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GitHubIndexResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIndex = async () => {
    if (!repoUrl.trim()) return;
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await api.indexGitHub(repoUrl.trim(), branch.trim() || undefined);
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Indexing failed");
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = repoUrl.trim().startsWith("https://github.com/");

  return (
    <RequireAuth>
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex-shrink-0 border-b border-[hsl(222,47%,18%)] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10">
              <GitFork className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h1 className="font-semibold text-white">GitHub Repository Indexing</h1>
              <p className="text-[hsl(215,20%,50%)] text-xs mt-0.5">
                Clone and index an entire GitHub repository
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl flex-1 space-y-6 p-6">
          <div className="flex items-start gap-3 rounded-xl border border-purple-500/15 bg-purple-500/5 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
            <div className="text-xs leading-relaxed text-[hsl(215,20%,60%)]">
              <p className="mb-0.5 font-medium text-purple-300">What gets indexed</p>
              <p>
                Source code (.py, .ts, .go, .java...), documentation (.md, .txt), configuration
                (.yaml, .json), READMEs, Dockerfiles and Makefiles. Ignores node_modules, build
                artifacts, and binary files.
              </p>
            </div>
          </div>

          <div className="glass space-y-4 rounded-2xl border border-[hsl(222,47%,18%)] p-6">
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[hsl(215,20%,60%)]">
                Repository URL *
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[hsl(222,47%,18%)] bg-[hsl(222,47%,11%)] px-3 py-2.5 transition-colors focus-within:border-purple-500/40">
                <GitFork className="w-4 h-4 text-[hsl(215,20%,45%)] flex-shrink-0" />
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repository"
                  className="flex-1 bg-transparent text-sm text-white placeholder-[hsl(215,20%,40%)] outline-none"
                />
              </div>
              {repoUrl && !isValidUrl && (
                <p className="mt-1 text-xs text-red-400">
                  Must be a valid GitHub URL (https://github.com/...)
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[hsl(215,20%,60%)]">
                Branch (optional)
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-[hsl(222,47%,18%)] bg-[hsl(222,47%,11%)] px-3 py-2.5 transition-colors focus-within:border-purple-500/40">
                <GitBranch className="w-4 h-4 text-[hsl(215,20%,45%)] flex-shrink-0" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main (default)"
                  className="flex-1 bg-transparent text-sm text-white placeholder-[hsl(215,20%,40%)] outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleIndex}
              disabled={isLoading || !isValidUrl}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all duration-200",
                isLoading || !isValidUrl
                  ? "cursor-not-allowed bg-[hsl(222,47%,16%)] text-[hsl(215,20%,40%)]"
                  : "bg-purple-500 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-400"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cloning & indexing...
                </>
              ) : (
                <>
                  <GitFork className="w-4 h-4" />
                  Index Repository
                </>
              )}
            </button>

            {isLoading && (
              <p className="text-center text-[10px] text-[hsl(215,20%,45%)]">
                This may take a few minutes for large repositories...
              </p>
            )}
          </div>

          {result && (
            <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-4">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-400">Repository indexed successfully</p>
                <p className="mt-1 text-xs text-[hsl(215,20%,55%)]">{result.message}</p>
                <div className="mt-2 flex gap-4">
                  <div className="text-xs">
                    <span className="text-[hsl(215,20%,45%)]">Files: </span>
                    <span className="font-medium text-white">{result.files_indexed}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-[hsl(215,20%,45%)]">Chunks: </span>
                    <span className="font-medium text-white">{result.chunks_created}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="animate-fade-in flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-4">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-400">Indexing failed</p>
                <p className="mt-1 text-xs text-red-400/70">{error}</p>
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(215,20%,45%)]">
              Tips
            </p>
            <ul className="space-y-1.5 text-xs text-[hsl(215,20%,55%)]">
              <li className="flex items-start gap-2">
                <span className="text-[hsl(215,20%,35%)] flex-shrink-0">•</span>
                Public repos are indexed without authentication
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(215,20%,35%)] flex-shrink-0">•</span>
                For private repos, set <code className="rounded bg-[hsl(222,47%,14%)] px-1 text-[hsl(215,20%,65%)]">GITHUB_TOKEN</code> in the backend environment
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(215,20%,35%)] flex-shrink-0">•</span>
                Large repos may take 2-5 minutes depending on file count
              </li>
            </ul>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
