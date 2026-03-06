import type { Metadata } from "next";
import "./globals.css";
import { AuthNav } from "@/components/AuthNav";

export const metadata: Metadata = {
  title: "Humor Project Admin",
  description: "Admin console for humor project users, images, and captions."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-transparent text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-brand-800 sm:text-3xl">
                  Humor Project Admin
                </h1>
                <p className="text-sm text-slate-600">
                  Monitor platform activity, content, and profiles in one place.
                </p>
              </div>
            </div>
            <AuthNav />
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

