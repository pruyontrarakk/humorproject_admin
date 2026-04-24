import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthNav } from "@/components/AuthNav";
import { GlobalNav } from "@/components/GlobalNav";

export const metadata: Metadata = {
  title: "Humor Project Admin",
  description: "Admin console for humor project users, images, and captions."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-transparent text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex w-1/4 justify-start">
              <Suspense fallback={null}>
                <GlobalNav />
              </Suspense>
            </div>

            <div className="flex flex-1 flex-col items-center text-center">
              <h1 className="text-3xl font-black uppercase tracking-tighter text-black sm:text-5xl">
                Humor Admin
              </h1>
              <div className="mt-1 bg-black px-3 py-0.5 text-[0.6rem] font-bold tracking-[0.4em] text-white">
                INTERNAL OPERATIONAL CONSOLE
              </div>
            </div>

            <div className="flex w-1/4 justify-end">
              <AuthNav />
            </div>
          </header>
          <main className="flex-1 pb-6">{children}</main>
          <footer className="mt-auto pt-4 text-xs text-slate-500">
            Powered by Supabase · Admin-only area
          </footer>
        </div>
      </body>
    </html>
  );
}

