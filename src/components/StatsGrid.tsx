"use client";

import { useEffect, useState } from "react";

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

      {/* Additional stats (caption coverage, most talkative profile) removed per design. */}
    </section>
  );
}
