import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { UserRole } from "@/types";

function isPublicPath(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/signin") || pathname.startsWith("/api/auth");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const { supabase, user, supabaseResponse } = await updateSession(request);

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.searchParams.set("error", "sign_in_required");
    return NextResponse.redirect(redirectUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as UserRole | undefined;

  if (pathname.startsWith("/rep") && role !== "rep") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === "manager" ? "/manager" : "/";
    redirectUrl.searchParams.set("error", "wrong_role");
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/manager") && role !== "manager") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = role === "rep" ? "/rep" : "/";
    redirectUrl.searchParams.set("error", "wrong_role");
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
