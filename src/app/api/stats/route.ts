import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 1000;

function imageRowToUrl(img: Record<string, unknown>): string | null {
  const urlCandidate =
    (img.url as string | undefined) ??
    (img.image_url as string | undefined) ??
    (img.public_url as string | undefined) ??
    (img.src as string | undefined);
  return typeof urlCandidate === "string" && urlCandidate.length > 0 ? urlCandidate : null;
}

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

    const { data: topCaptionRows, error: topCaptionsError } = await supabase
      .from("captions")
      .select("id, content, image_id, like_count")
      .order("like_count", { ascending: false, nullsFirst: false })
      .limit(3);

    let topCaptionsByLikes: {
      id: string;
      content: string;
      likeCount: number;
      imageId: string | null;
      imageUrl: string | null;
    }[] | null = null;
    let topCaptionsByLikesError: string | null = null;

    if (topCaptionsError) {
      topCaptionsByLikesError = topCaptionsError.message;
    } else {
      const rows = (topCaptionRows ?? []).map(row => {
        const r = row as {
          id: string;
          content?: string | null;
          image_id?: string | null;
          like_count?: number | null;
        };
        const content = r.content?.trim() || "";
        return {
          id: r.id,
          content,
          likeCount: typeof r.like_count === "number" ? r.like_count : 0,
          imageId: typeof r.image_id === "string" && r.image_id.length > 0 ? r.image_id : null
        };
      });

      const imageIds = [...new Set(rows.map(r => r.imageId).filter((id): id is string => Boolean(id)))];
      const idToUrl = new Map<string, string>();
      if (imageIds.length > 0) {
        const { data: imageRows, error: imagesJoinError } = await supabase
          .from("images")
          .select("*")
          .in("id", imageIds);

        if (!imagesJoinError && imageRows) {
          for (const img of imageRows) {
            const rec = img as Record<string, unknown>;
            const id = rec.id;
            if (typeof id !== "string" || !id.length) continue;
            const u = imageRowToUrl(rec);
            if (u) idToUrl.set(id, u);
          }
        }
      }

      topCaptionsByLikes = rows.map(r => ({
        ...r,
        imageUrl: r.imageId ? idToUrl.get(r.imageId) ?? null : null
      }));
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
      },
      topCaptionsByLikes,
      topCaptionsByLikesError
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
