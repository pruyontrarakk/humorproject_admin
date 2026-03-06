import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  const userId = data.user?.id;
  if (!userId) {
    return NextResponse.redirect(new URL("/login?error=auth", request.url));
  }

  // Use the signed-in user's session to read their profile (RLS must allow read own row)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.is_superadmin) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
