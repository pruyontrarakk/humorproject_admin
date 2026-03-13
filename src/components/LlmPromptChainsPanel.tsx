"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type LlmPromptChainRow = {
  id: string;
  caption_request_id?: number | null;
  created_datetime_utc?: string | null;
};

type JoinedChainRow = LlmPromptChainRow & {
  llm_system_prompt?: string | null;
  llm_user_prompt?: string | null;
};

const PAGE_SIZE = 50;

export function LlmPromptChainsPanel() {
  const [rows, setRows] = useState<JoinedChainRow[]>([]);
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

      const [countRes, chainsRes] = await Promise.all([
        supabase
          .from("llm_prompt_chains")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("llm_prompt_chains")
          .select("*")
          .order("created_datetime_utc", { ascending: false })
          .range(from, to)
      ]);

      if (cancelled) return;

      if (countRes.error) {
        setError(countRes.error.message);
        setRows([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      if (chainsRes.error) {
        setError(chainsRes.error.message);
        setRows([]);
        setTotalCount(countRes.count ?? 0);
        setLoading(false);
        return;
      }

      const baseChains = (chainsRes.data as any[] | null) ?? [];
      const captionRequestIds = Array.from(
        new Set(
          baseChains
            .map(c => c.caption_request_id)
            .filter((id: unknown): id is number => typeof id === "number")
        )
      );

      let promptsByCaptionRequest = new Map<
        number,
        { llm_system_prompt?: string | null; llm_user_prompt?: string | null }
      >();

      if (captionRequestIds.length) {
        const { data: responses, error: responsesError } = await supabase
          .from("llm_model_responses")
          .select("caption_request_id, llm_system_prompt, llm_user_prompt, created_datetime_utc")
          .in("caption_request_id", captionRequestIds)
          .order("created_datetime_utc", { ascending: false });

        if (!responsesError && Array.isArray(responses)) {
          promptsByCaptionRequest = new Map();
          for (const r of responses as any[]) {
            if (typeof r.caption_request_id === "number") {
              if (!promptsByCaptionRequest.has(r.caption_request_id)) {
                promptsByCaptionRequest.set(r.caption_request_id, {
                  llm_system_prompt: r.llm_system_prompt ?? null,
                  llm_user_prompt: r.llm_user_prompt ?? null
                });
              }
            }
          }
        }
      }

      const joined: JoinedChainRow[] = baseChains.map(chain => {
        const prompts =
          typeof chain.caption_request_id === "number"
            ? promptsByCaptionRequest.get(chain.caption_request_id) ?? {}
            : {};

        return {
          id: String(chain.id),
          caption_request_id:
            typeof chain.caption_request_id === "number"
              ? chain.caption_request_id
              : null,
          created_datetime_utc: chain.created_datetime_utc ?? null,
          llm_system_prompt: (prompts.llm_system_prompt as string | null) ?? null,
          llm_user_prompt: (prompts.llm_user_prompt as string | null) ?? null
        };
      });

      setRows(joined);
      setTotalCount(countRes.count ?? 0);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page]);

  const filtered = rows.filter(row => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(row.caption_request_id ?? "")
        .toLowerCase()
        .includes(q) ||
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
            LLM prompt chains
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input w-52 sm:w-64"
            placeholder="Search by caption request id or prompt…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">Unable to load prompt chains.</p>
          <p className="mt-1 text-xs text-red-700/90">{error}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700">
          <span>
            Showing {from}–{to} of {totalCount} prompt chains
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
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">Caption request id</th>
                <th className="px-3 py-2 text-left">LLM system prompt</th>
                <th className="px-3 py-2 text-left">LLM user prompt</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-slate-500/80"
                    colSpan={5}
                  >
                    Loading prompt chains…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-slate-500/80"
                    colSpan={5}
                  >
                    No prompt chains on this page
                    {search.trim() ? " match this search" : ""}.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map(row => (
                  <tr key={row.id} className="transition hover:bg-brand-50">
                    <td className="px-3 py-2 align-top">
                      <code className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.7rem]">
                        {row.id}
                      </code>
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      {row.created_datetime_utc
                        ? new Date(
                            row.created_datetime_utc
                          ).toLocaleString()
                        : "—"}
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
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

