import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
    );

    const supabase = await createClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [countRes, dataRes] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*")
        .order("created_datetime_utc", { ascending: false })
        .range(from, to)
    ]);

    if (countRes.error) {
      return NextResponse.json({ error: countRes.error.message }, { status: 500 });
    }
    if (dataRes.error) {
      return NextResponse.json({ error: dataRes.error.message }, { status: 500 });
    }

    const totalCount = countRes.count ?? 0;
    return NextResponse.json({
      data: dataRes.data ?? [],
      totalCount,
      page,
      pageSize
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch profiles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
