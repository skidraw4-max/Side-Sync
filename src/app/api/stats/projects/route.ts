import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProjectLifecycleStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export interface ProjectStatsResponse {
  recruiting: number;
  inProgress: number;
  completed: number;
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    url &&
    url !== "https://placeholder.supabase.co" &&
    key &&
    key !== "placeholder-key"
  );
}

async function countByStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  status: ProjectLifecycleStatus
): Promise<number> {
  const { count, error } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[stats/projects]", status, error.message);
    }
    return 0;
  }
  return count ?? 0;
}

/**
 * GET — 공개 프로젝트 라이프사이클별 건수 (RLS: anon SELECT 허용 정책과 동일 범위)
 */
export async function GET() {
  const empty: ProjectStatsResponse = { recruiting: 0, inProgress: 0, completed: 0 };

  if (!isSupabaseConfigured()) {
    return NextResponse.json(empty);
  }

  const supabase = await createClient();
  const [recruiting, inProgress, completed] = await Promise.all([
    countByStatus(supabase, "hiring"),
    countByStatus(supabase, "ongoing"),
    countByStatus(supabase, "completed"),
  ]);

  return NextResponse.json({
    recruiting,
    inProgress,
    completed,
  } satisfies ProjectStatsResponse);
}
