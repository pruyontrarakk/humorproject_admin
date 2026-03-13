"use client";

import { useState } from "react";
import { StatsGrid } from "@/components/StatsGrid";
import { UsersAdminPanel } from "@/components/UsersAdminPanel";
import { ImagesPanel } from "@/components/ImagesPanel";
import { CaptionsPanel } from "@/components/CaptionsPanel";
import { HumorFlavorsPanel } from "@/components/HumorFlavorsPanel";
import { HumorFlavorMixPanel } from "@/components/HumorFlavorMixPanel";
import { LlmAdminPanel } from "@/components/LlmAdminPanel";
import { CaptionAdminPanel } from "@/components/CaptionAdminPanel";
import { FlavorAdminPanel } from "@/components/FlavorAdminPanel";
import { TermsPanel } from "@/components/TermsPanel";

type TabId =
  | "stats"
  | "users"
  | "images"
  | "captions"
  | "flavors"
  | "llm"
  | "terms";

const tabs: { id: TabId; label: string }[] = [
  { id: "stats", label: "Stats" },
  { id: "users", label: "Users" },
  { id: "images", label: "Images" },
  { id: "captions", label: "Captions" },
  { id: "flavors", label: "Flavors" },
  { id: "llm", label: "LLM" },
  { id: "terms", label: "Terms" }
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
            </button>
          );
        })}
      </nav>

      {active === "stats" && <StatsGrid />}
      {active === "users" && <UsersAdminPanel />}
      {active === "images" && <ImagesPanel />}
      {active === "captions" && <CaptionAdminPanel />}
      {active === "flavors" && <FlavorAdminPanel />}
      {active === "llm" && <LlmAdminPanel />}
      {active === "terms" && <TermsPanel />}
    </div>
  );
}

