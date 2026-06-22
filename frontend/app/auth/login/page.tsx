"use client";

import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(215,20%,45%)]">
            AI Research Assistant
          </p>
          <h1 className="text-3xl font-semibold text-white">Sign in</h1>
          <p className="mt-2 text-sm text-[hsl(215,20%,55%)]">
            Continue to your private chats, uploads, and dashboards.
          </p>
        </div>
        <AuthForm mode="login" />
        <p className="text-center text-sm text-[hsl(215,20%,55%)]">
          New here?{" "}
          <Link href="/auth/register" className="text-blue-300 underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
