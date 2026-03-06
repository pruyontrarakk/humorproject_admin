import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;

export async function GET() {
  try {
    const supabase = await createClient();

    const [
      { count: totalProfiles, error: e1 },
      { count: totalImages, error: e2 },
      { count: totalCaptions, error: e3 }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("images").select("*", { count: "exact", head: true }),
      supabase.from("captions").select("*", { count: "exact", head: true })
    ]);

    if (e1 || e2 || e3) {
      const msg = e1?.message ?? e2?.message ?? e3?.message ?? "Failed to fetch counts";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const profilesCount = totalProfiles ?? 0;
    const imagesCount = totalImages ?? 0;
    const captionsCount = totalCaptions ?? 0;

    const allImageIdsWithCaptions = new Set<string>();
    const captionsPerUser = new Map<string, number>();
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error } = await supabase
        .from("captions")
        .select("image_id, profile_id")
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!batch?.length) {
        hasMore = false;
        break;
      }

      for (const row of batch as { image_id?: string | null; profile_id?: string | null }[]) {
        const iid = row.image_id;
        if (typeof iid === "string" && iid.length > 0) {
          allImageIdsWithCaptions.add(iid);
        }
        const pid = row.profile_id;
        if (typeof pid === "string" && pid.length > 0) {
          captionsPerUser.set(pid, (captionsPerUser.get(pid) ?? 0) + 1);
        }
      }

      if (batch.length < PAGE_SIZE) hasMore = false;
      else offset += PAGE_SIZE;
    }

    const imagesWithCaptions = allImageIdsWithCaptions.size;
    const captionCoverage =
      imagesCount > 0 ? (imagesWithCaptions / imagesCount) * 100 : 0;

    const [topProfileId, topCaptionCount] =
      [...captionsPerUser.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

    let topUserName: string = "—";
    let topImageCount: number = 0;
    if (topProfileId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, full_name, email")
        .eq("id", topProfileId)
        .maybeSingle();
      const p = profile as { username?: string; display_name?: string; full_name?: string; email?: string } | null;
      topUserName =
        p?.username ?? p?.display_name ?? p?.full_name ?? p?.email ?? `User ${topProfileId}`;

      const { count: imgCount } = await supabase
        .from("images")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", topProfileId);
      topImageCount = imgCount ?? 0;
    }

    return NextResponse.json({
      totalProfiles: profilesCount,
      totalImages: imagesCount,
      totalCaptions: captionsCount,
      imagesWithCaptions,
      captionCoverage,
      mostTalkative: {
        name: topUserName,
        captionCount: topCaptionCount ?? 0,
        imageCount: topImageCount
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
