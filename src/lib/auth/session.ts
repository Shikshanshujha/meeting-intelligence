import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export interface SessionProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return profile as SessionProfile;
}

export function roleHomePath(role: UserRole): string {
  return role === "manager" ? "/manager" : "/rep";
}
