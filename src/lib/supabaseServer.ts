import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service_role key.
 * Bypasses RLS — use only in API routes or server components.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Project Settings → API in Supabase)."
    );
  }

  return createClient(url, serviceRoleKey);
}

export const supabaseServer = getSupabaseServer();
