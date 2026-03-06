"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Caption = {
  id: string;
  image_id?: string | null;
  profile_id?: string | null;
  text?: string | null;
  body?: string | null;
  content?: string | null;
  created_datetime_utc?: string | null;
};

type ImageRow = {
  id: string;
  [key: string]: unknown;
};

const PAGE_SIZE = 50;

export function CaptionsPanel() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageFilter, setImageFilter] = useState("");
  const [imageMap, setImageMap] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const [countRes, dataRes] = await Promise.all([
        supabase.from("captions").select("*", { count: "exact", head: true }),
        supabase
          .from("captions")
          .select("*")
          .order("created_datetime_utc", { ascending: false })
          .range(from, to)
      ]);

      if (cancelled) return;

      if (countRes.error) {
        setError(countRes.error.message);
        setCaptions([]);
        setTotalCount(0);
      } else if (dataRes.error) {
        setError(dataRes.error.message);
        setCaptions([]);
        setTotalCount(countRes.count ?? 0);
      } else {
        const rows = (dataRes.data as Caption[]) ?? [];
        setCaptions(rows);
        setTotalCount(countRes.count ?? 0);

        const uniqueImageIds = Array.from(
          new Set(
            rows
              .map(c => c.image_id)
              .filter((id): id is string => typeof id === "string" && id.length > 0)
          )
        );

        if (uniqueImageIds.length) {
          const { data: images, error: imagesError } = await supabase
            .from("images")
            .select("*")
            .in("id", uniqueImageIds);

          if (!cancelled && !imagesError && images) {
            const map = new Map<string, string>();
            for (const img of images as ImageRow[]) {
              const anyImg = img as Record<string, unknown>;
              const urlCandidate =
                (anyImg.url as string | undefined) ??
                (anyImg.image_url as string | undefined) ??
                (anyImg.public_url as string | undefined) ??
                (anyImg.src as string | undefined);
              if (img.id && typeof urlCandidate === "string") {
                map.set(img.id, urlCandidate);
              }
            }
            setImageMap(map);
          } else if (!cancelled) {
            setImageMap(new Map());
          }
        } else if (!cancelled) {
          setImageMap(new Map());
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page]);

  const filtered = captions.filter(c => {
    const matchesImage = imageFilter
      ? c.image_id?.toLowerCase().includes(imageFilter.toLowerCase())
      : true;
    return matchesImage;
  });

  function captionBody(c: Caption) {
    return c.text || c.body || c.content || "";
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Captions
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input w-32 sm:w-40"
            placeholder="Filter by image id"
            value={imageFilter}
            onChange={e => setImageFilter(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">Unable to load captions.</p>
          <p className="mt-1 text-xs text-red-700/90">{error}</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-700">
          <span>
            Showing {totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} captions
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
              Page {page} of {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
            </span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(Math.ceil(totalCount / PAGE_SIZE), p + 1))}
              disabled={loading || page >= Math.ceil(totalCount / PAGE_SIZE)}
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
                <th className="px-3 py-2 text-left">Caption</th>
                <th className="px-3 py-2 text-left">Image</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500/80" colSpan={3}>
                    Loading captions…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-center text-slate-500/80" colSpan={3}>
                    No captions match this filter.
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map(caption => (
                  <tr key={caption.id} className="transition hover:bg-brand-50">
                    <td className="max-w-[280px] px-3 py-2 align-top">
                      <p className="line-clamp-3 text-slate-900">
                        {captionBody(caption) || <span className="text-slate-500/80">No text</span>}
                      </p>
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      {caption.image_id ? (
                        (() => {
                          const url = imageMap.get(caption.image_id!);
                          if (url) {
                            return (
                              <div className="flex items-center gap-3">
                                <img
                                  src={url}
                                  alt={captionBody(caption) || "Caption image"}
                                  className="h-20 w-32 rounded-xl border border-slate-200 bg-white object-cover"
                                />
                                <code className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.7rem]">
                                  {caption.image_id}
                                </code>
                              </div>
                            );
                          }
                          return (
                            <code className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.7rem]">
                              {caption.image_id}
                            </code>
                          );
                        })()
                      ) : (
                        <span className="text-slate-500/80">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top text-slate-700">
                      {caption.created_datetime_utc
                        ? new Date(caption.created_datetime_utc).toLocaleString()
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

