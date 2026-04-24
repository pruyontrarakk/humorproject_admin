"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tabs, TabId } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export function GlobalNav() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "stats";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsMenuOpen(true)}
        className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white transition hover:bg-black hover:text-white"
        aria-label="Open menu"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth={3}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white p-6">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute right-6 top-6 flex h-10 w-20 items-center justify-center border-2 border-black text-xs font-black uppercase tracking-widest transition hover:bg-brand-primary hover:text-white"
          >
            CLOSE
          </button>

          <nav className="flex flex-col items-center gap-1">
            {tabs.map(tab => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  className={[
                    "text-4xl font-black uppercase tracking-tighter transition-all sm:text-6xl",
                    isActive
                      ? "bg-brand-primary px-3 text-white"
                      : "text-black hover:bg-black hover:text-white"
                  ].join(" ")}
                  onClick={() => {
                    router.push(`/?tab=${tab.id}`);
                    setIsMenuOpen(false);
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
