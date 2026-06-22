"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(email, password);
      setAuthSession(response.access_token, response.user);
      router.push("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass w-full max-w-md space-y-4 rounded-3xl border border-white/10 p-6 shadow-2xl">
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[hsl(215,20%,60%)]">
          Email
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <Mail className="h-4 w-4 text-[hsl(215,20%,45%)]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[hsl(215,20%,40%)]"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[hsl(215,20%,60%)]">
          Password
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <Lock className="h-4 w-4 text-[hsl(215,20%,45%)]" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[hsl(215,20%,40%)]"
            placeholder="At least 8 characters"
            required
            minLength={8}
          />
        </div>
      </div>

      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isLoading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </form>
  );
}
