import { NextResponse } from "next/server";
import { getDemoUser } from "@/lib/auth/demo-users";
import { roleHomePath } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const role = body.role as UserRole;

    if (role !== "rep" && role !== "manager") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const demoUser = getDemoUser(role);
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: demoUser.email,
      password: demoUser.password,
    });

    if (error) {
      return NextResponse.json(
        {
          error: "Demo sign-in failed. Run npm run seed:users after configuring Supabase.",
          detail: error.message,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ redirect: roleHomePath(role) });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
