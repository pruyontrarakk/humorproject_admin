"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type LlmResponseRow = {
  id: string;
  model_id?: string | null;
  prompt_chain_id?: string | null;
  llm_prompt_chain_id?: string | null;
  request_id?: string | null;
  caption_request_id?: number | null;
  content?: string | null;
  llm_model_response?: string | null;
  llm_system_prompt?: string | null;
  llm_user_prompt?: string | null;
  created_datetime_utc?: string | null;
  [key: string]: unknown;
};

const PAGE_SIZE = 50;

export function LlmResponsesPanel() {
  const [rows, setRows] = useState<LlmResponseRow[]>([]);
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
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const [countRes, dataRes] = await Promise.all([
        supabase
          .from("llm_model_responses")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("llm_model_responses")
          .select("*")
          .order("created_datetime_utc", { ascending: false })
          .range(from, to)
      ]);

      if (cancelled) return;

      if (countRes.error) {
        setError(countRes.error.message);
        setRows([]);
        setTotalCount(0);
      } else if (dataRes.error) {
        setError(dataRes.error.message);
        setRows([]);
        setTotalCount(countRes.count ?? 0);
      } else {
        setRows((dataRes.data as LlmResponseRow[]) ?? []);
        setTotalCount(countRes.count ?? 0);
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page]);

  function promptChainIdFor(row: LlmResponseRow): string | null {
    return (
      (row.llm_prompt_chain_id as string | null | undefined) ??
      (row.prompt_chain_id as string | null | undefined) ??
      null
    );
  }

  const filtered = rows.filter(row => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(row.caption_request_id ?? "")
        .toLowerCase()
        .includes(q) ||
      String(promptChainIdFor(row) ?? "")
        .toLowerCase()
        .includes(q) ||
      row.llm_model_response?.toLowerCase().includes(q) ||
      row.llm_system_prompt?.toLowerCase().includes(q) ||
      row.llm_user_prompt?.toLowerCase().includes(q)
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
            LLM responses
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input w-52 sm:w-64"
            placeholder="Search by request id, model, or text…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">Unable to load responses.</p>
          <p className="mt-1 text-xs text-red-700/90">{error}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700">
          <span>
            Showing {from}–{to} of {totalCount} responses
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
        <div className="max-h-[360px] overflow-auto text-xs">
          <table className="min-w-full border-separate border-spacing-y-1 px-2">
            <thead className="sticky top-0 z-10 bg-white backdrop-blur">
              <tr className="text-[0.7rem] uppercase tracking-[0.16em] text-brand-700">
                <th className="px-3 py-2 text-left">Prompt chain id</th>
                <th className="px-3 py-2 text-left">Caption request id</th>
                <th className="px-3 py-2 text-left">System prompt</th>
                <th className="px-3 py-2 text-left">User prompt</th>
                <th className="px-3 py-2 text-left">LLM model response</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">ID</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-slate-500/80"
                    colSpan={7}
                  >
                    Loading responses…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-slate-500/80"
                    colSpan={7}
                  >
                    No responses on this page
                    {search.trim() ? " match this search" : ""}.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map(row => (
                  <tr key={row.id} className="transition hover:bg-brand-50">
                    <td className="px-3 py-2 align-top text-slate-700">
                      {promptChainIdFor(row) ?? (
                        <span className="text-slate-500/80">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      {row.caption_request_id ?? (
                        <span className="text-slate-500/80">—</span>
                      )}
                    </td>
                    <td className="max-w-[260px] px-3 py-2 align-top text-slate-700">
                      {row.llm_system_prompt ? (
                        <p className="line-clamp-3">{row.llm_system_prompt}</p>
                      ) : (
                        <span className="text-slate-500/80">—</span>
                      )}
                    </td>
                    <td className="max-w-[260px] px-3 py-2 align-top text-slate-700">
                      {row.llm_user_prompt ? (
                        <p className="line-clamp-3">{row.llm_user_prompt}</p>
                      ) : (
                        <span className="text-slate-500/80">—</span>
                      )}
                    </td>
                    <td className="max-w-[260px] px-3 py-2 align-top text-slate-700">
                      {row.llm_model_response ? (
                        <p className="line-clamp-3">{row.llm_model_response}</p>
                      ) : (
                        <span className="text-slate-500/80">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      {row.created_datetime_utc
                        ? new Date(
                            row.created_datetime_utc
                          ).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      <code className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.7rem]">
                        {row.id}
                      </code>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

