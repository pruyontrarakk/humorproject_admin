"use client";

import { LlmModelsPanel } from "./LlmModelsPanel";
import { LlmProvidersPanel } from "./LlmProvidersPanel";
import { LlmPromptChainsPanel } from "./LlmPromptChainsPanel";
import { LlmResponsesPanel } from "./LlmResponsesPanel";

export function LlmAdminPanel() {
  return (
    <div className="space-y-6">
      <LlmModelsPanel />
      <LlmProvidersPanel />
      <LlmPromptChainsPanel />
      <LlmResponsesPanel />
    </div>
  );
}

