"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const error = searchParams.get("error");

  useEffect(() => {
    if (error === "unauthorized") {
      // Optional: clear any stale query so message doesn’t persist on refresh
    }
  }, [error]);

  async function handleSignIn() {
    setLoading(true);
    const supabase = createClient();
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const redirectTo = `${base}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setLoading(false);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
      return;
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-brand-800">
            Admin sign in
          </h2>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            Superadmin access only
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Use your work Google account to access the Humor Project admin dashboard.
            Only profiles marked as superadmins in the system are allowed to sign in.
          </p>
        </div>

        {error === "auth" && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Sign-in failed. Please try again.
          </p>
        )}
        {error === "unauthorized" && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            You don’t have permission to access the admin area. Only superadmins can sign in.
          </p>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
        >
          {loading ? "Redirecting…" : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
