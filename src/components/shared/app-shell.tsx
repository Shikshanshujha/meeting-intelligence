import Link from "next/link";
import type { ReactNode } from "react";
import type { UserRole } from "@/types";

interface AppShellProps {
  role: UserRole;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  role,
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  actions,
  children,
}: AppShellProps) {
  const homeHref = role === "manager" ? "/manager" : "/rep";

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href={homeHref} className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm">
              MI
            </span>
            <span className="hidden font-semibold tracking-tight text-zinc-900 sm:inline">
              Meeting Intelligence
            </span>
          </Link>
          {actions && (
            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
              {actions}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {backHref && (
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-brand-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </Link>
        )}

        <header className="mb-8">
          <p className="text-sm font-medium text-zinc-500">
            {role === "manager" ? "Manager workspace" : "Rep workspace"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>
          )}
        </header>

        {children}
      </main>
    </div>
  );
}
