"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { setAuthSession, getAuthToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";
const DEMO_EMAIL = "demo@engineer-hub.local";
const DEMO_PASSWORD = "DemoPassword123!";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Always start with null on first render (SSR-safe — localStorage is client-only)
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  // After mount, read the real token from localStorage
  useEffect(() => {
    setMounted(true);
    setToken(getAuthToken());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (token) return;

    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (!isLocalhost) {
      router.replace("/auth/login");
      return;
    }

    let cancelled = false;

    const bootstrapDemoSession = async () => {
      setIsBootstrapping(true);
      setBootstrapError(null);

      const authRequest = async (path: string) => {
        const response = await fetch(`${API_BASE}${path}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.detail || response.statusText);
        }

        return response.json() as Promise<{ access_token: string; user: unknown }>;
      };

      try {
        let response;
        try {
          response = await authRequest("/auth/login");
        } catch {
          response = await authRequest("/auth/register");
        }

        if (cancelled) return;

        setAuthSession(response.access_token, response.user);
        setToken(response.access_token);
      } catch (error) {
        if (cancelled) return;
        setBootstrapError(
          error instanceof Error ? error.message : "Unable to start a local session"
        );
        router.replace("/auth/login");
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrapDemoSession();

    return () => {
      cancelled = true;
    };
  }, [router, token, mounted]);

  // Show loading until client-side mount resolves
  if (!mounted || !token) {
    if (bootstrapError) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-[hsl(215,20%,55%)]">
          Redirecting to sign in...
        </div>
      );
    }

    return (
      <div className="flex h-full items-center justify-center text-sm text-[hsl(215,20%,55%)]">
        {isBootstrapping ? "Starting local demo session..." : "Starting up..."}
      </div>
    );
  }

  return <>{children}</>;
}
