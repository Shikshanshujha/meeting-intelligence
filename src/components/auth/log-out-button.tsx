"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logOut() {
    setLoading(true);
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logOut}
      disabled={loading}
      className="text-sm text-zinc-500 transition hover:text-zinc-900 disabled:opacity-50"
    >
      {loading ? "Logging out…" : "Log out"}
    </button>
  );
}
