"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  created_datetime_utc?: string | null;
};

const PAGE_SIZE = 50;

export function UsersPanel() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/profiles?page=${page}&pageSize=${PAGE_SIZE}`
      );
      const json = await res.json();

      if (cancelled) return;

      if (!res.ok) {
        setError(json.error ?? "Failed to load profiles");
        setProfiles([]);
        setTotalCount(0);
      } else {
        setProfiles(json.data ?? []);
        setTotalCount(json.totalCount ?? 0);
      }

      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  const filtered = profiles.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.email?.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalCount);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Users &amp; profiles
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input w-52 sm:w-64"
            placeholder="Search by name, email, id…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">Unable to load profiles.</p>
          <p className="mt-1 text-xs text-red-700/90">{error}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700">
          <span>
            Showing {from}–{to} of {totalCount} profiles
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              Previous
            </button>
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={loading || page >= totalPages}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none"
            >
              Next
            </button>
          </div>
        </div>
        <div className="max-h-[420px] overflow-auto text-xs">
          <table className="min-w-full border-separate border-spacing-y-1 px-2">
            <thead className="sticky top-0 z-10 bg-white backdrop-blur">
              <tr className="text-[0.7rem] uppercase tracking-[0.16em] text-brand-700">
                <th className="px-3 py-2 text-left">User ID</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500/80" colSpan={3}>
                    Loading profiles…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500/80" colSpan={3}>
                    No profiles on this page{search.trim() ? " match this search" : ""}.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map(profile => {
                  return (
                      <tr
                      key={profile.id}
                      className="transition hover:bg-brand-50"
                    >
                      <td className="px-3 py-2 align-top">
                        {profile.id ? (
                          <code className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.7rem]">
                            {profile.id}
                          </code>
                        ) : (
                          <span className="text-slate-500/80">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-800">
                        {profile.email ?? <span className="text-slate-500/80">—</span>}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {profile.created_datetime_utc
                          ? new Date(profile.created_datetime_utc).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
