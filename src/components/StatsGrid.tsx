"use client";

import { useEffect, useState } from "react";

type TopCaption = {
  id: string;
  content: string;
  likeCount: number;
  imageId: string | null;
  imageUrl: string | null;
};

type Stats = {
  totalProfiles: number;
  totalImages: number;
  totalCaptions: number;
  imagesWithCaptions: number;
  captionCoverage: number;
  mostTalkative: {
    name: string;
    captionCount: number;
    imageCount: number;
  };
  topCaptionsByLikes: TopCaption[] | null;
  topCaptionsByLikesError?: string | null;
};

export function StatsGrid() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/stats");
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error ?? "Failed to load stats");
        setStats(null);
      } else {
        setStats(json as Stats);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalUsers = stats?.totalProfiles ?? 0;
  const totalImages = stats?.totalImages ?? 0;
  const totalCaptions = stats?.totalCaptions ?? 0;
  const imagesWithCaptions = stats?.imagesWithCaptions ?? 0;
  const captionCoverage = stats?.captionCoverage ?? 0;
  const avgImagesPerUser = totalUsers ? totalImages / totalUsers : 0;
  const avgCaptionsPerImage = totalImages ? totalCaptions / totalImages : 0;
  const top = stats?.mostTalkative;
  const topByLikes = stats?.topCaptionsByLikes;
  const topByLikesErr = stats?.topCaptionsByLikesError;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
            Overview
          </h2>
        </div>
        <span className="pill">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {loading ? "Refreshing…" : "Live snapshot"}
        </span>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">We hit an error talking to Supabase.</p>
          <p className="mt-1 text-xs text-red-700/90">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card relative overflow-hidden p-4 sm:p-5">
          <p className="stat-label">Total humans</p>
          <p className="stat-number">{loading ? "—" : totalUsers}</p>
          <p className="mt-1 text-xs text-slate-300/80">
            Total number of profiles in the system.
          </p>
        </div>

        <div className="card p-4 sm:p-5">
          <p className="stat-label">Images in play</p>
          <p className="stat-number">{loading ? "—" : totalImages}</p>
          <p className="mt-1 text-xs text-slate-300/80">
            Total number of images stored in the system.
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            {loading
              ? "Crunching ratios…"
              : `${avgImagesPerUser.toFixed(2)} images per active profile.`}
          </p>
        </div>

        <div className="card p-4 sm:p-5">
          <p className="stat-label">Punchlines written</p>
          <p className="stat-number">{loading ? "—" : totalCaptions}</p>
          <p className="mt-1 text-xs text-slate-300/80">
            Total captions linked to images.
          </p>
          <p className="mt-2 text-xs text-sky-700">
            {loading
              ? "Measuring laughs…"
              : `${avgCaptionsPerImage.toFixed(2)} captions per image on average.`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Top captions by likes
        </h3>
        {loading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : topByLikesErr ? (
          <div className="card border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">Could not load top captions.</p>
            <p className="mt-1 text-xs text-amber-900/90">{topByLikesErr}</p>
          </div>
        ) : topByLikes && topByLikes.length > 0 ? (
          <ol className="card divide-y divide-slate-200 overflow-hidden p-0">
            {topByLikes.map((c, i) => (
              <li key={c.id} className="flex gap-3 px-4 py-3 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
                  {i + 1}
                </span>
                {c.imageUrl ? (
                  <img
                    src={c.imageUrl}
                    alt={c.content ? c.content.slice(0, 120) : "Caption image"}
                    className="h-20 w-32 shrink-0 rounded-xl border border-slate-200 bg-white object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1 space-y-2">
                  <blockquote className="line-clamp-5 text-lg font-normal leading-snug text-brand-800 sm:text-xl md:text-2xl">
                    {c.content ? (
                      <>“{c.content}”</>
                    ) : (
                      <span className="text-base text-slate-400">No content</span>
                    )}
                  </blockquote>
                  <p className="text-xs text-slate-500">
                    <span className="font-medium text-emerald-700">{c.likeCount}</span> likes
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-slate-500">No captions with likes to show yet.</p>
        )}
      </div>
    </section>
  );
}
