"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TabId } from "@/lib/navigation";
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

function HomeContent() {
  const searchParams = useSearchParams();
  const active = (searchParams.get("tab") as TabId) || "stats";

  return (
    <div className="space-y-5">
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-sm text-slate-400">Loading panel...</div>}>
      <HomeContent />
    </Suspense>
  );
}

