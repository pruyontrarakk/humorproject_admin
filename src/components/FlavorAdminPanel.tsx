"use client";

import { HumorFlavorsPanel } from "./HumorFlavorsPanel";
import { HumorFlavorMixPanel } from "./HumorFlavorMixPanel";
import { HumorFlavorStepsPanel } from "./HumorFlavorStepsPanel";

export function FlavorAdminPanel() {
  return (
    <div className="space-y-6">
      <HumorFlavorsPanel />
      <HumorFlavorStepsPanel />
      <HumorFlavorMixPanel />
    </div>
  );
}

