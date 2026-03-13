"use client";

import { UsersPanel } from "./UsersPanel";
import { WhitelistEmailsPanel } from "./WhitelistEmailsPanel";
import { AllowedSignupDomainsPanel } from "./AllowedSignupDomainsPanel";

export function UsersAdminPanel() {
  return (
    <div className="space-y-6">
      <UsersPanel />
      <WhitelistEmailsPanel />
      <AllowedSignupDomainsPanel />
    </div>
  );
}

