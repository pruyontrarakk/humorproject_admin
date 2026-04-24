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
    <section className="space-y-6 border-t-4 border-black pt-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black uppercase tracking-widest text-black">
          Metrics
        </h2>
        <div className="bg-brand-primary px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white">
          {loading ? "SYNCING" : "LIVE"}
        </div>
      </div>

      {error && (
        <div className="border-2 border-brand-primary bg-brand-primary px-3 py-1 text-white text-[0.7rem] font-bold uppercase tracking-widest">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 border-2 border-black md:grid-cols-3">
        <div className="border-b-2 border-black p-4 md:border-b-0 md:border-r-2">
          <p className="stat-label text-[0.6rem]">PROFILES</p>
          <p className="text-3xl font-black tracking-tighter text-black">{loading ? "—" : totalUsers}</p>
        </div>

        <div className="border-b-2 border-black p-4 md:border-b-0 md:border-r-2">
          <p className="stat-label text-[0.6rem]">ASSETS</p>
          <p className="text-3xl font-black tracking-tighter text-black">{loading ? "—" : totalImages}</p>
          <p className="text-[0.55rem] font-bold text-slate-400">
            {loading ? "..." : `${avgImagesPerUser.toFixed(1)}/USR`}
          </p>
        </div>

        <div className="p-4">
          <p className="stat-label text-[0.6rem]">CAPTIONS</p>
          <p className="text-3xl font-black tracking-tighter text-black">{loading ? "—" : totalCaptions}</p>
          <p className="text-[0.55rem] font-bold text-slate-400">
            {loading ? "..." : `${avgCaptionsPerImage.toFixed(1)}/IMG`}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-black uppercase tracking-widest">
            Leaderboard
          </h3>
          <div className="h-0.5 flex-1 bg-black opacity-10" />
        </div>

        {loading ? (
          <p className="text-[0.6rem] font-bold uppercase text-slate-300">Loading…</p>
        ) : topByLikesErr ? (
          <div className="text-[0.6rem] font-bold text-red-500 uppercase">
            ERROR: {topByLikesErr}
          </div>
        ) : topByLikes && topByLikes.length > 0 ? (
          <div className="grid gap-0 border-2 border-black">
            {topByLikes.map((c, i) => (
              <div key={c.id} className="flex flex-col border-b-2 border-black last:border-b-0 sm:flex-row">
                <div className="flex w-12 items-center justify-center bg-black text-2xl font-black text-white sm:w-16">
                  {i + 1}
                </div>
                <div className="flex flex-1 flex-col p-4 sm:flex-row sm:items-center sm:gap-6">
                  {c.imageUrl ? (
                    <img
                      src={c.imageUrl}
                      alt="Asset"
                      className="mb-3 h-24 w-40 border-2 border-black object-cover sm:mb-0 sm:h-20 sm:w-32"
                    />
                  ) : null}
                  <div className="flex-1 min-w-0 space-y-2">
                    <blockquote className="text-lg font-black leading-none tracking-tight text-black sm:text-2xl">
                      {c.content ? c.content.toUpperCase() : "NO DATA"}
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className="bg-brand-primary px-2 py-0.5 text-[0.6rem] font-black text-white">
                        {c.likeCount} LIKES
                      </div>
                      <div className="text-[0.55rem] font-bold text-slate-300">
                        ID: {c.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[0.6rem] font-bold uppercase text-slate-300">No data.</p>
        )}
      </div>
    </section>
  );
}
