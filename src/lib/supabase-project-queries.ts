import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

/** Navigator Lock steal/Abort 등 일시적 Auth 잠금 오류 */
function isTransientAuthLockError(e: unknown): boolean {
  if (e == null) return false;
  if (typeof e === "object" && e !== null && "name" in e && (e as { name: string }).name === "AbortError") {
    return true;
  }
  const msg =
    typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string"
      ? (e as { message: string }).message
      : String(e);
  return msg.includes("Lock broken") || msg.includes("steal");
}

const LED_SELECT_VARIANTS = [
  "id, title, description, gradient, tech_stack, manner_temp_target, team_leader_id, created_at",
  "id, title, description, tech_stack, manner_temp_target, team_leader_id, created_at",
  "id, title, description, team_leader_id, created_at",
  "id, title, description, team_leader_id",
] as const;

const BY_IDS_SELECT_VARIANTS = [
  "id, title, description, gradient, tech_stack, manner_temp_target, team_leader_id, created_at",
  "id, title, description, tech_stack, manner_temp_target, team_leader_id, created_at",
  "id, title, description, team_leader_id, created_at",
  "id, title, description, team_leader_id",
] as const;

/** 내가 팀 리더인 프로젝트 (RLS 환경에서도 .eq로 본인 행만 조회) */
export async function fetchLedProjectsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ProjectRow[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const sel of LED_SELECT_VARIANTS) {
      const { data, error } = await supabase
        .from("projects")
        .select(sel)
        .eq("team_leader_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data !== null) {
        return data as unknown as ProjectRow[];
      }
      if (error && isTransientAuthLockError(error)) {
        await new Promise((r) => setTimeout(r, 120 * (attempt + 1)));
        break;
      }
    }
  }
  return [];
}

/** ID 목록으로 프로젝트 조회 (멤버 참여 프로젝트 등) */
export async function fetchProjectsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<ProjectRow[]> {
  if (ids.length === 0) return [];

  for (const sel of BY_IDS_SELECT_VARIANTS) {
    const { data, error } = await supabase
      .from("projects")
      .select(sel)
      .in("id", ids)
      .order("created_at", { ascending: false });

    if (!error && data !== null) {
      return data as unknown as ProjectRow[];
    }
  }
  return [];
}

/**
 * 프로젝트 상세 페이지용 단건 조회.
 * 마이그레이션 단계별로 컬럼이 다른 DB에서도 동작하도록 select 문자열을 순차 시도하고,
 * 마지막에 `*` 로 폴백합니다. (존재하지 않는 컬럼을 나열하면 PostgREST가 전체 요청을 실패시켜 404로 이어짐)
 */
const DETAIL_SELECT_VARIANTS = [
  "id, title, description, goal, tech_stack, team_leader_id, recruitment_status, manner_temp_target, visibility, duration_months, est_launch, created_at, gradient, summary, content, category, status",
  "id, title, description, goal, tech_stack, team_leader_id, recruitment_status, manner_temp_target, visibility, duration_months, est_launch, created_at",
  "id, title, description, tech_stack, team_leader_id, recruitment_status, manner_temp_target, visibility, duration_months, est_launch, created_at, gradient",
  "id, title, description, tech_stack, team_leader_id, manner_temp_target, recruitment_status, visibility, duration_months, est_launch, created_at",
  "id, title, description, tech_stack, team_leader_id, manner_temp_target, visibility, duration_months, est_launch, created_at",
  "id, title, description, tech_stack, team_leader_id, manner_temp_target, created_at, gradient",
  "id, title, description, tech_stack, team_leader_id, manner_temp_target, created_at",
  ...BY_IDS_SELECT_VARIANTS,
] as const;

export async function fetchProjectDetailById(
  supabase: SupabaseClient,
  id: string
): Promise<ProjectRow | null> {
  for (const sel of DETAIL_SELECT_VARIANTS) {
    const { data, error } = await supabase.from("projects").select(sel).eq("id", id).maybeSingle();

    if (!error && data) {
      return data as unknown as ProjectRow;
    }
  }

  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();

  if (!error && data) {
    return data as unknown as ProjectRow;
  }

  return null;
}
