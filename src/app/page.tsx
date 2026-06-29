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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <div className="mb-10 space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Meeting Intelligence
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Smarter meetings, every time
        </h1>
        <p className="text-base leading-relaxed text-zinc-600">
          Prepare with context, triage deal quality, and learn after every call.
          Pick a workspace to continue.
        </p>
      </div>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-zinc-100" />}>
        <RolePicker />
      </Suspense>

      <p className="mt-8 text-center text-xs text-zinc-400">
        Demo workspace · no signup required
      </p>
    </main>
  );
}
