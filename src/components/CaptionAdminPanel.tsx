"use client";

import { CaptionsPanel } from "./CaptionsPanel";
import { CaptionRequestsPanel } from "./CaptionRequestsPanel";
import { CaptionExamplesPanel } from "./CaptionExamplesPanel";

export function CaptionAdminPanel() {
  return (
    <div className="space-y-6">
      <CaptionsPanel />
      <CaptionRequestsPanel />
      <CaptionExamplesPanel />
    </div>
  );
}

