"use client";

import { useState } from "react";
import { StatsGrid } from "@/components/StatsGrid";
import { UsersPanel } from "@/components/UsersPanel";
import { ImagesPanel } from "@/components/ImagesPanel";
import { CaptionsPanel } from "@/components/CaptionsPanel";

type TabId = "stats" | "users" | "images" | "captions";

const tabs: { id: TabId; label: string; badge?: string }[] = [
  { id: "stats", label: "Stats", badge: "Overview" },
  { id: "users", label: "Users", badge: "Read" },
  { id: "images", label: "Images", badge: "CRUD" },
  { id: "captions", label: "Captions", badge: "Read" }
];

export default function HomePage() {
  const [active, setActive] = useState<TabId>("stats");

  return (
    <div className="space-y-5">
      <nav className="card flex flex-wrap items-center gap-2 border-slate-200 bg-white px-2 py-2">
        {tabs.map(tab => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition",
                isActive
                  ? "bg-brand-700 text-amber-50"
                  : "text-slate-800 hover:bg-slate-100"
              ].join(" ")}
              onClick={() => setActive(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em]",
                    isActive ? "bg-brand-800 text-amber-50" : "bg-slate-100 text-slate-700"
                  ].join(" ")}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {active === "stats" && <StatsGrid />}
      {active === "users" && <UsersPanel />}
      {active === "images" && <ImagesPanel />}
      {active === "captions" && <CaptionsPanel />}
    </div>
  );
}

