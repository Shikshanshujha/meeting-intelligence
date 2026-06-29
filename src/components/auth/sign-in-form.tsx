"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/types";

const DEMO_CREDENTIALS: Record<UserRole, { email: string; password: string; title: string }> = {
  rep: {
    email: "rep@gushwork.demo",
    password: "demo-rep-2026",
    title: "Sales Rep",
  },
  manager: {
    email: "manager@gushwork.demo",
    password: "demo-manager-2026",
    title: "Sales Manager",
  },
};

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") as UserRole | null;
  const role: UserRole = roleParam === "manager" ? "manager" : "rep";
  const creds = DEMO_CREDENTIALS[role];

  const [email] = useState(creds.email);
  const [password] = useState(creds.password);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Sign in failed");
        setLoading(false);
        return;
      }

      router.push(data.redirect);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSignIn} className="w-full max-w-md space-y-5">
      <div>
        <p className="text-sm font-medium text-zinc-500">Sign in as</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          {creds.title}
        </h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="email" className="text-xs font-medium text-zinc-600">
            Email
          </label>
          <input
            id="email"
            type="email"
            readOnly
            value={email}
            className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs font-medium text-zinc-600">
            Password
          </label>
          <input
            id="password"
            type="password"
            readOnly
            value={password}
            className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <button
        type="button"
        onClick={() => router.push("/")}
        className="w-full text-center text-sm text-zinc-500 hover:text-zinc-900"
      >
        ← Back to role selection
      </button>
    </form>
  );
}
