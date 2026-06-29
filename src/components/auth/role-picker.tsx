"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "rep" | "manager";

export function RolePicker() {
  const router = useRouter();
  const [loading, setLoading] = useState<Role | null>(null);

  function continueAs(role: Role) {
    setLoading(role);
    router.push(`/signin?role=${role}`);
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <button
        type="button"
        onClick={() => continueAs("rep")}
        disabled={loading !== null}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-zinc-300 hover:shadow disabled:opacity-60"
      >
        <div>
          <p className="font-medium text-zinc-900">Sales Rep</p>
          <p className="mt-1 text-sm text-zinc-500">
            Prepare for meetings and capture notes
          </p>
        </div>
        <span className="text-sm text-zinc-400">
          {loading === "rep" ? "…" : "→"}
        </span>
      </button>

      <button
        type="button"
        onClick={() => continueAs("manager")}
        disabled={loading !== null}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-zinc-300 hover:shadow disabled:opacity-60"
      >
        <div>
          <p className="font-medium text-zinc-900">Sales Manager</p>
          <p className="mt-1 text-sm text-zinc-500">
            Pipeline health, rep coaching, and deal signals
          </p>
        </div>
        <span className="text-sm text-zinc-400">
          {loading === "manager" ? "…" : "→"}
        </span>
      </button>
    </div>
  );
}
