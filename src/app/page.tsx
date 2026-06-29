import { Suspense } from "react";
import { redirect } from "next/navigation";
import { RolePicker } from "@/components/auth/role-picker";
import { getSessionProfile, roleHomePath } from "@/lib/auth/session";

export default async function HomePage() {
  const profile = await getSessionProfile();

  if (profile) {
    redirect(roleHomePath(profile.role));
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <header className="border-b border-[var(--border)] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-4 sm:px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm">
            MI
          </span>
          <span className="font-semibold tracking-tight text-zinc-900">
            Meeting Intelligence
          </span>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col justify-center px-6 py-16">
        <div className="mb-10 space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
            Sales enablement
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Smarter meetings, every time
          </h1>
          <p className="text-base leading-relaxed text-zinc-600">
            Prepare with AI briefs, triage deal quality, capture notes that build
            prospect memory, and give managers real pipeline visibility.
          </p>
        </div>

        <Suspense
          fallback={<div className="h-40 animate-pulse rounded-2xl bg-zinc-200/60" />}
        >
          <RolePicker />
        </Suspense>

        <p className="mt-10 text-center text-xs text-zinc-400">
          Demo workspace · no signup required
        </p>
      </main>
    </div>
  );
}
