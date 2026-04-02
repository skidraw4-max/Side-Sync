import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ServerSupabase = SupabaseClient<Database>;

/**
 * 프로젝트 칸반 태스크 API 공통: 팀장 또는 수락된 멤버만 허용.
 * @returns 허용 시 `null`, 거부 시 `NextResponse`
 */
export async function projectTaskAccessDenied(
  supabase: ServerSupabase,
  projectId: string,
  userId: string
): Promise<NextResponse | null> {
  const { data: project } = await supabase
    .from("projects")
    .select("id, team_leader_id")
    .eq("id", projectId)
    .single();

  const p = project as { id: string; team_leader_id: string | null } | null;
  if (!p) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const isLeader = p.team_leader_id === userId;
  const { data: accepted } = await supabase
    .from("applications")
    .select("id")
    .eq("project_id", projectId)
    .eq("applicant_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  if (!isLeader && !accepted) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  return null;
}
