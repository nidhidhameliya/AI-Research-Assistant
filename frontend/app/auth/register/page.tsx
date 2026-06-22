"use client";

import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[hsl(215,20%,45%)]">
            AI Research Assistant
          </p>
          <h1 className="text-3xl font-semibold text-white">Create account</h1>
          <p className="mt-2 text-sm text-[hsl(215,20%,55%)]">
            Start a private workspace for your documents and research threads.
          </p>
        </div>
        <AuthForm mode="register" />
        <p className="text-center text-sm text-[hsl(215,20%,55%)]">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-300 underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
