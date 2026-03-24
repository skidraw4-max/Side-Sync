import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { APPLICATION_STATUS } from "@/lib/application-status";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

/**
 * 참여 프로젝트 / 멤버십 관련 DB 조건 (전수 점검 요약):
 * - `applications` 지원자 식별 컬럼은 **`applicant_id`** (auth.users id). **`user_id` 컬럼 없음**.
 * - 승인 상태는 **`APPLICATION_STATUS.ACCEPTED`** (= DB 소문자 `'accepted'`).
 */

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

/** 오래된 DB(컬럼 누락)에서 먼저 성공하도록 최소 컬럼을 앞에 둠 → 400 로그 감소 */
const LED_SELECT_VARIANTS = [
  "id, title, description, team_leader_id, created_at",
  "id, title, description, team_leader_id",
  "id, title, description, tech_stack, team_leader_id, created_at",
  "id, title, description, tech_stack, manner_temp_target, team_leader_id, created_at",
  "id, title, description, gradient, tech_stack, manner_temp_target, team_leader_id, created_at",
  "id, title, description, tech_stack, manner_temp_target, team_leader_id, created_at",
] as const;

const BY_IDS_SELECT_VARIANTS = [
  "id, title, description, team_leader_id, created_at",
  "id, title, description, team_leader_id",
  "id, title, description, tech_stack, team_leader_id, created_at",
  "id, title, description, tech_stack, manner_temp_target, team_leader_id, created_at",
  "id, title, description, gradient, tech_stack, manner_temp_target, team_leader_id, created_at",
  "id, title, description, tech_stack, manner_temp_target, team_leader_id, created_at",
] as const;

/** 내가 팀 리더인 프로젝트 — `projects.team_leader_id === userId` (세션 uid = auth.uid()) */
export async function fetchLedProjectsForUser(
  supabase: SupabaseClient,
  userId: string
): Promise<ProjectRow[]> {
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 fetchLedProjectsForUser team_leader_id (= 로그인 uid):", userId);
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    // 존재하지 않는 컬럼을 나열하면 PostgREST 400 — `*` 는 실제 컬럼만 반환
    const full = await supabase
      .from("projects")
      .select("*")
      .eq("team_leader_id", userId)
      .order("created_at", { ascending: false });

    if (!full.error && full.data !== null) {
      return full.data as unknown as ProjectRow[];
    }
    if (full.error && isTransientAuthLockError(full.error)) {
      await new Promise((r) => setTimeout(r, 120 * (attempt + 1)));
      continue;
    }

    const fullNoOrder = await supabase
      .from("projects")
      .select("*")
      .eq("team_leader_id", userId);

    if (!fullNoOrder.error && fullNoOrder.data !== null) {
      return fullNoOrder.data as unknown as ProjectRow[];
    }

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

/** ID 목록으로 프로젝트 조회 (멤버 참여: applications.applicant_id 로 모은 project_id 들) */
export async function fetchProjectsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<ProjectRow[]> {
  console.log("🔍 요청하는 프로젝트 ID 리스트:", ids);

  if (ids.length === 0) return [];

  const full = await supabase
    .from("projects")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (!full.error && full.data !== null) {
    return full.data as unknown as ProjectRow[];
  }

  const fullNoOrder = await supabase.from("projects").select("*").in("id", ids);

  if (!fullNoOrder.error && fullNoOrder.data !== null) {
    return fullNoOrder.data as unknown as ProjectRow[];
  }

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
  "id, title, description, team_leader_id, created_at",
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
  let data: Record<string, unknown> | null = null;

  // `*` 는 존재하는 컬럼만 반환하므로 안전. 부분 select 가 먼저 성공하면 recruitment_status·tech_stack 이 빠질 수 있음.
  const full = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!full.error && full.data) {
    data = full.data as unknown as Record<string, unknown>;
  } else {
    for (const sel of DETAIL_SELECT_VARIANTS) {
      const { data: row, error } = await supabase.from("projects").select(sel).eq("id", id).maybeSingle();
      if (!error && row) {
        data = row as unknown as Record<string, unknown>;
        break;
      }
    }
  }

  if (!data) {
    return null;
  }

  const missRecruitment = !("recruitment_status" in data);
  const missTech = !("tech_stack" in data);
  if (missRecruitment || missTech) {
    const { data: extra, error: exErr } = await supabase
      .from("projects")
      .select("recruitment_status, tech_stack")
      .eq("id", id)
      .maybeSingle();
    if (!exErr && extra) {
      const e = extra as Record<string, unknown>;
      if (missRecruitment && "recruitment_status" in e) {
        data.recruitment_status = e.recruitment_status;
      }
      if (missTech && "tech_stack" in e) {
        data.tech_stack = e.tech_stack;
      }
    }
  }

  return data as unknown as ProjectRow;
}

/** applications.role 컬럼이 없는 DB(마이그레이션 미적용)에서도 400을 피하기 위한 타입 */
export type AcceptedApplicationRow = {
  applicant_id: string;
  role: string | null;
};

/**
 * accepted 지원자 목록.
 * `select("applicant_id, role")` 처럼 컬럼을 나열하면 `role` 미존재 시 **첫 요청이 400**으로 콘솔에 남습니다.
 * `*` 는 테이블에 실제 존재하는 컬럼만 반환하므로 한 번에 안전합니다.
 */
export async function fetchAcceptedApplicationsForProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<AcceptedApplicationRow[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", APPLICATION_STATUS.ACCEPTED);

  if (error || !data || !Array.isArray(data)) {
    return [];
  }

  return data
    .map((row) => {
      const r = row as Record<string, unknown>;
      const applicantId = r.applicant_id;
      if (typeof applicantId !== "string") return null;
      const stackVal = r.tech_stack;
      const roleVal = r.role;
      const fromStack = typeof stackVal === "string" && stackVal.trim() !== "" ? stackVal.trim() : null;
      const fromRole = typeof roleVal === "string" && roleVal.trim() !== "" ? roleVal.trim() : null;
      const role = fromStack ?? fromRole;
      return { applicant_id: applicantId, role };
    })
    .filter((x): x is AcceptedApplicationRow => x !== null);
}
