"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { UserRole } from "@/types";

interface SignOutButtonProps {
  role: UserRole;
}

export function SignOutButton({ role }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className="text-sm text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50"
    >
      {loading ? "Signing out…" : `Switch role (${role})`}
    </button>
  );
}
