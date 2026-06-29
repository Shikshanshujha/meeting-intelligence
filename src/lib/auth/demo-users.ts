import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types";

export interface DemoUserConfig {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export function getDemoUser(role: UserRole): DemoUserConfig {
  if (role === "manager") {
    return {
      email: process.env.DEMO_MANAGER_EMAIL ?? "manager@gushwork.demo",
      password: process.env.DEMO_MANAGER_PASSWORD ?? "demo-manager-2026",
      fullName: "Alex Morgan",
      role: "manager",
    };
  }

  return {
    email: process.env.DEMO_REP_EMAIL ?? "rep@gushwork.demo",
    password: process.env.DEMO_REP_PASSWORD ?? "demo-rep-2026",
    fullName: "Jordan Lee",
    role: "rep",
  };
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
