"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AllowedDomainRow = {
  id: number | string;
  apex_domain?: string | null;
  created_datetime_utc?: string | null;
};

const PAGE_SIZE = 50;

export function AllowedSignupDomainsPanel() {
  const [rows, setRows] = useState<AllowedDomainRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [selected, setSelected] = useState<AllowedDomainRow | null>(null);
  const [jsonText, setJsonText] = useState('{\n  "apex_domain": "example.com"\n}');
  const [mutating, setMutating] = useState(false);
  const [mutateError, setMutateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const [countRes, dataRes] = await Promise.all([
        supabase
          .from("allowed_signup_domains")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("allowed_signup_domains")
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
        setRows((dataRes.data as AllowedDomainRow[]) ?? []);
        setTotalCount(countRes.count ?? 0);
      }

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
    return row.apex_domain?.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const from = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, totalCount);

  function openCreate() {
    setMode("create");
    setSelected(null);
    setMutateError(null);
    setJsonText('{\n  "apex_domain": "example.com"\n}');
  }

  function openEdit(row: AllowedDomainRow) {
    setMode("edit");
    setSelected(row);
    setMutateError(null);
    setJsonText(JSON.stringify(row, null, 2));
  }

  function closeForm() {
    setMode("idle");
    setSelected(null);
    setMutateError(null);
  }

  async function reloadPage() {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const [countRes, dataRes] = await Promise.all([
      supabase
        .from("allowed_signup_domains")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("allowed_signup_domains")
        .select("*")
        .order("created_datetime_utc", { ascending: false })
        .range(from, to)
    ]);
    if (!countRes.error && !dataRes.error) {
      setRows((dataRes.data as AllowedDomainRow[]) ?? []);
      setTotalCount(countRes.count ?? 0);
    }
  }

  async function handleSave() {
    setMutating(true);
    setMutateError(null);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(jsonText);
    } catch {
      setMutateError("Invalid JSON. Please fix the syntax and try again.");
      setMutating(false);
      return;
    }

    if (mode === "create") {
      const { error: insertError } = await supabase
        .from("allowed_signup_domains")
        .insert([payload]);
      if (insertError) {
        setMutateError(insertError.message);
      } else {
        closeForm();
        await reloadPage();
      }
    } else if (mode === "edit" && selected) {
      const { error: updateError } = await supabase
        .from("allowed_signup_domains")
        .update(payload)
        .eq("id", selected.id);
      if (updateError) {
        setMutateError(updateError.message);
      } else {
        closeForm();
        await reloadPage();
      }
    }

    setMutating(false);
  }

  async function handleDelete(row: AllowedDomainRow) {
    if (!row.id) return;
    const confirmed = window.confirm(
      "Delete this allowed signup domain? This cannot be undone."
    );
    if (!confirmed) return;

    setMutating(true);
    setMutateError(null);

    const { error: deleteError } = await supabase
      .from("allowed_signup_domains")
      .delete()
      .eq("id", row.id);
    if (deleteError) {
      setMutateError(deleteError.message);
    } else {
      await reloadPage();
    }

    setMutating(false);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Allowed signup domains
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input w-52 sm:w-64"
            placeholder="Search by domain…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="btn-primary text-xs"
            onClick={openCreate}
            disabled={mutating}
          >
            New domain
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">Unable to load allowed domains.</p>
          <p className="mt-1 text-xs text-red-700/90">{error}</p>
        </div>
      )}

      <div className={mode === "idle" ? "card overflow-hidden" : "grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]"}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700">
          <span>
            Showing {from}–{to} of {totalCount} domains
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
                <th className="px-3 py-2 text-left">Apex domain</th>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-slate-500/80"
                    colSpan={3}
                  >
                    Loading domains…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-slate-500/80"
                    colSpan={3}
                  >
                    No domains on this page
                    {search.trim() ? " match this search" : ""}.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map(row => (
                  <tr key={row.id} className="transition hover:bg-brand-50">
                    <td className="px-3 py-2 align-top text-slate-800">
                      {row.apex_domain ?? (
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
                    <td className="px-3 py-2 align-top">
                      <code className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.7rem]">
                        {row.id}
                      </code>
                    </td>
                    <td className="px-3 py-2 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          className="btn-ghost px-2 py-1 text-[0.7rem]"
                          onClick={() => openEdit(row)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-ghost px-2 py-1 text-[0.7rem] text-red-300 hover:border-red-500/60 hover:bg-red-950/50"
                          onClick={() => handleDelete(row)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {mode !== "idle" && (
          <div className="card flex min-h-[220px] flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <div className="flex flex-col text-xs">
                <span className="font-semibold text-slate-900">
                  {mode === "create"
                    ? "Create allowed domain"
                    : "Edit allowed domain"}
                </span>
                <span className="text-slate-600">
                  Edit raw JSON for this row.
                </span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-3 px-4 py-3 text-xs">
              <textarea
                className="input min-h-[160px] flex-1 font-mono text-[0.75rem]"
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                spellCheck={false}
              />
              {mutateError && (
                <p className="text-[0.7rem] text-red-700/90">{mutateError}</p>
              )}
              <div className="mt-1 flex justify-end gap-2">
                <button
                  className="btn-ghost text-xs"
                  onClick={closeForm}
                  disabled={mutating}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary text-xs"
                  onClick={handleSave}
                  disabled={mutating}
                >
                  {mutating
                    ? "Saving…"
                    : mode === "create"
                    ? "Insert row"
                    : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

