"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type JoinedRow = {
  id: string;
  created_datetime_utc?: string | null;
  caption_request_id?: number | null;
  llm_prompt_chain_id?: number | null;
  model_name?: string | null;
  provider_name?: string | null;
  llm_system_prompt?: string | null;
  llm_user_prompt?: string | null;
};

const PAGE_SIZE = 50;

export function LlmOverviewPanel() {
  const [rows, setRows] = useState<JoinedRow[]>([]);
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

      const [responsesCountRes, responsesDataRes, modelsRes, providersRes, chainsRes] =
        await Promise.all([
          supabase
            .from("llm_model_responses")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("llm_model_responses")
            .select("*")
            .order("created_datetime_utc", { ascending: false })
            .range(from, to),
          supabase.from("llm_models").select("*"),
          supabase.from("llm_providers").select("*"),
          supabase.from("llm_prompt_chains").select("*")
        ]);

      if (cancelled) return;

      if (responsesCountRes.error) {
        setError(responsesCountRes.error.message);
        setRows([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      if (responsesDataRes.error) {
        setError(responsesDataRes.error.message);
        setRows([]);
        setTotalCount(responsesCountRes.count ?? 0);
        setLoading(false);
        return;
      }

      const responses = (responsesDataRes.data ?? []) as any[];

      const modelsById = new Map<string, any>();
      if (!modelsRes.error && Array.isArray(modelsRes.data)) {
        for (const model of modelsRes.data as any[]) {
          if (typeof model.id === "string") {
            modelsById.set(model.id, model);
          }
        }
      }

      const providersById = new Map<string, any>();
      if (!providersRes.error && Array.isArray(providersRes.data)) {
        for (const provider of providersRes.data as any[]) {
          if (typeof provider.id === "string") {
            providersById.set(provider.id, provider);
          }
        }
      }

      const chainsByCaptionRequest = new Map<number, any>();
      if (!chainsRes.error && Array.isArray(chainsRes.data)) {
        for (const chain of chainsRes.data as any[]) {
          if (typeof chain.caption_request_id === "number") {
            chainsByCaptionRequest.set(chain.caption_request_id, chain);
          }
        }
      }

      const joined: JoinedRow[] = responses.map(r => {
        const model = r.llm_model_id
          ? modelsById.get(r.llm_model_id as string)
          : null;
        const providerId =
          (model && (model.llm_provider_id as string | undefined)) ??
          (model && (model.provider_id as string | undefined));
        const provider = providerId ? providersById.get(providerId) : null;
        const chain =
          typeof r.caption_request_id === "number"
            ? chainsByCaptionRequest.get(r.caption_request_id)
            : null;

        return {
          id: r.id,
          created_datetime_utc: r.created_datetime_utc,
          caption_request_id: r.caption_request_id ?? null,
          llm_prompt_chain_id: chain?.id ?? r.llm_prompt_chain_id ?? null,
          model_name: model?.name ?? null,
          provider_name: provider?.name ?? providerId ?? null,
          llm_system_prompt:
            r.llm_system_prompt ?? chain?.llm_system_prompt ?? null,
          llm_user_prompt:
            r.llm_user_prompt ?? chain?.llm_user_prompt ?? null
        };
      });

      setRows(joined);
      setTotalCount(responsesCountRes.count ?? 0);
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
      row.model_name?.toLowerCase().includes(q) ||
      row.provider_name?.toLowerCase().includes(q) ||
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
              LLM models, providers &amp; responses
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="filter-input w-52 sm:w-64">
              <svg className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="FILTER RESPONSES..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            <p className="font-medium">Unable to load LLM responses.</p>
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
          <div className="max-h-[420px] overflow-auto text-xs">
            <table className="min-w-full border-separate border-spacing-y-1 px-2">
              <thead className="sticky top-0 z-10 bg-white backdrop-blur">
                <tr className="text-[0.7rem] uppercase tracking-[0.16em] text-brand-700">
                  <th className="px-3 py-2 text-left">Model</th>
                  <th className="px-3 py-2 text-left">Provider</th>
                  <th className="px-3 py-2 text-left">Caption request id</th>
                  <th className="px-3 py-2 text-left">Prompt chain id</th>
                  <th className="px-3 py-2 text-left">System prompt</th>
                  <th className="px-3 py-2 text-left">User prompt</th>
                  <th className="px-3 py-2 text-left">Created</th>
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
                      <td className="px-3 py-2 align-top text-slate-800">
                        {row.model_name ?? (
                          <span className="text-slate-500/80">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {row.provider_name ?? (
                          <span className="text-slate-500/80">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {row.caption_request_id ?? (
                          <span className="text-slate-500/80">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-slate-700">
                        {row.llm_prompt_chain_id ?? (
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
                      <td className="px-3 py-2 align-top text-slate-700">
                        {row.created_datetime_utc
                          ? new Date(
                              row.created_datetime_utc
                            ).toLocaleString()
                          : "—"}
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

