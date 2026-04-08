import type { RecruitmentStatusRow } from "@/types/database";
import { RECRUITMENT_ROLE_PRESETS } from "@/lib/project-recruitment-form";

/** 프로젝트 개설/수정 폼과 동일한 직군 라벨 (roleKey → 표시명) */
export const RECRUITMENT_ROLE_KEY_LABELS: Record<string, string> = Object.fromEntries(
  RECRUITMENT_ROLE_PRESETS.map((p) => [p.value, p.label])
) as Record<string, string>;

/** DB/PostgREST에서 배열이 아닌 JSON 문자열로 올 수 있음 */
export function coerceRecruitmentArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value) as unknown;
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeTechStackFromDb(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((x): x is string => typeof x === "string" && x.trim() !== "")
      .map((s) => s.trim());
  }
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value) as unknown;
      if (Array.isArray(p)) {
        return p
          .map((x) => (typeof x === "string" ? x.trim() : String(x)))
          .filter(Boolean);
      }
    } catch {
      /* ignore */
    }
  }
  return [];
}

/**
 * 상세·마일스톤용 — role 문자열이 비어 있으면 roleKey 로 직군 라벨 복원
 */
export function normalizeRecruitmentStatusRows(value: unknown): RecruitmentStatusRow[] {
  const arr = coerceRecruitmentArray(value);
  const out: RecruitmentStatusRow[] = [];
  for (const item of arr) {
    const r = item as RecruitmentStatusRow;
    let role = typeof r.role === "string" && r.role.trim() ? r.role.trim() : "";
    if (!role && typeof r.roleKey === "string" && r.roleKey.trim()) {
      const k = r.roleKey.trim();
      role = RECRUITMENT_ROLE_KEY_LABELS[k] ?? k;
    }
    if (!role) continue;
    out.push({ ...r, role });
  }
  return out;
}
