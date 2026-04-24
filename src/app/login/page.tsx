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
      <div className="w-full max-w-md space-y-8 border-4 border-black bg-white p-10">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-black">
            Authorization Required
          </h2>
          <div className="mx-auto h-1 w-12 bg-brand-primary" />
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-slate-400">
            SECURE ACCESS GATEWAY
          </p>
        </div>

        <div className="space-y-4 text-xs font-bold leading-relaxed text-black">
          <p>
            This portal is restricted to authorized administrative personnel only. Use your internal Google account to verify superadmin status.
          </p>

        </div>

        {error === "auth" && (
          <div className="border-4 border-brand-primary bg-brand-primary p-3 text-white">
            <p className="text-[0.6rem] font-black uppercase tracking-widest">ERROR: AUTH_FAILURE</p>
            <p className="text-xs opacity-90 mt-1">Please try again or contact system support.</p>
          </div>
        )}
        {error === "unauthorized" && (
          <div className="border-4 border-brand-primary bg-brand-primary p-3 text-white">
            <p className="text-[0.6rem] font-black uppercase tracking-widest">ERROR: ACCESS_DENIED</p>
            <p className="text-xs opacity-90 mt-1">Your profile lacks the required superadmin privileges.</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="btn-primary w-full py-4 text-sm font-black uppercase tracking-[0.2em]"
        >
          {loading ? "ESTABLISHING SESSION..." : "INITIATE GOOGLE AUTH"}
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
