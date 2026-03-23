import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { PROJECT } from "@/lib/constants/contents";

/** 모집 공고가 비었을 때 참여 신청·정원 계산용 기본 슬롯 (PROJECT.roleGeneral 과 동일 라벨) */
export const FALLBACK_OPEN_RECRUITMENT_SLOT = {
  role: PROJECT.roleGeneral,
  total: 99,
} as const;

/** 지원서 행에서 모집 포지션 키 (tech_stack 우선, 없으면 role) */
export function applicationPositionKey(row: {
  tech_stack?: string | null;
  role?: string | null;
}): string {
  const t = row.tech_stack?.trim();
  const r = row.role?.trim();
  return t || r || PROJECT.roleGeneral;
}

/** recruitment_status JSON → 슬롯 목록 (role 누락 시 "General" 자리표 — 레거시) */
export function parseRecruitmentSlots(recruitment_status: unknown): { role: string; total: number }[] {
  if (!Array.isArray(recruitment_status)) return [];
  return recruitment_status.map((item) => {
    const r = item as { role?: string; count?: number; total?: number };
    const role =
      typeof r.role === "string" && r.role.trim() ? r.role.trim() : PROJECT.roleGeneral;
    const total =
      typeof r.total === "number" && r.total >= 0
        ? r.total
        : typeof r.count === "number" && r.count >= 0
          ? r.count
          : 1;
    return { role, total };
  });
}

/**
 * 실제 참여 신청·UI에 쓰는 모집 슬롯.
 * 배열이 비었거나, 항목에 유효한 role 이 하나도 없으면 기본 슬롯 1개(일반/넉넉한 정원)를 반환합니다.
 */
export function getEffectiveRecruitmentSlots(recruitment_status: unknown): { role: string; total: number }[] {
  if (!Array.isArray(recruitment_status) || recruitment_status.length === 0) {
    return [{ role: FALLBACK_OPEN_RECRUITMENT_SLOT.role, total: FALLBACK_OPEN_RECRUITMENT_SLOT.total }];
  }

  const out: { role: string; total: number }[] = [];
  for (const item of recruitment_status) {
    const r = item as { role?: string; count?: number; total?: number };
    if (typeof r.role !== "string" || !r.role.trim()) continue;
    const role = r.role.trim();
    const total =
      typeof r.total === "number" && r.total >= 0
        ? r.total
        : typeof r.count === "number" && r.count >= 0
          ? r.count
          : 1;
    out.push({ role, total });
  }

  if (out.length === 0) {
    return [{ role: FALLBACK_OPEN_RECRUITMENT_SLOT.role, total: FALLBACK_OPEN_RECRUITMENT_SLOT.total }];
  }
  return out;
}

/**
 * 참여 신청 모달·POST /apply·수락 시 정원 검증용 슬롯.
 * `tech_stack`이 비어 있지 않으면 옵션 라벨이 **필수 기술 스택**과 동일한 순서·이름이 됩니다.
 * recruitment_status에 동일 role 이 있으면 그 정원을 쓰고, 없으면 모집 슬롯 합(최소 1)을 기술 수로 나눈 값을 씁니다.
 */
export function getApplySlotsFromTechStack(
  techStack: string[],
  recruitment_status: unknown
): { role: string; total: number }[] {
  const normalized = [...new Set(techStack.map((t) => String(t).trim()).filter(Boolean))];
  if (normalized.length === 0) {
    return getEffectiveRecruitmentSlots(recruitment_status);
  }

  const rec = getEffectiveRecruitmentSlots(recruitment_status);
  const sumTotals = rec.reduce((s, x) => s + x.total, 0);
  const perUnmatched = Math.max(1, Math.ceil(Math.max(1, sumTotals) / normalized.length));

  return normalized.map((tech) => {
    const match = rec.find((s) => s.role === tech);
    return { role: tech, total: match ? match.total : perUnmatched };
  });
}

/** 포지션별 합류(accepted)·대기(pending) 건수 — RLS 우회 시 service role 클라이언트 권장 */
export async function fetchApplicationCountsByPosition(
  client: SupabaseClient<Database>,
  projectId: string
): Promise<{ accepted: Record<string, number>; pending: Record<string, number> }> {
  const accepted: Record<string, number> = {};
  const pending: Record<string, number> = {};
  const { data, error } = await client
    .from("applications")
    .select("tech_stack, role, status")
    .eq("project_id", projectId)
    .in("status", ["accepted", "pending"]);

  if (error || !data) {
    return { accepted, pending };
  }

  for (const row of data) {
    const r = row as { tech_stack?: string | null; role?: string | null; status?: string };
    const key = applicationPositionKey(r);
    if (r.status === "accepted") {
      accepted[key] = (accepted[key] ?? 0) + 1;
    } else if (r.status === "pending") {
      pending[key] = (pending[key] ?? 0) + 1;
    }
  }
  return { accepted, pending };
}
