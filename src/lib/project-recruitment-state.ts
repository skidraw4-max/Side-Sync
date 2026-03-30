import type { RecruitmentStatusRow } from "@/types/database";

export type ProjectRecruitmentState = "recruiting" | "urgent" | "full" | "closed";

/**
 * PostgREST·레거시 스키마에서 오는 status 값 정규화 (active/complete 등)
 */
export function normalizeRawProjectStatus(raw: unknown): string {
  if (raw == null) return "";
  const s =
    typeof raw === "string"
      ? raw.trim().toLowerCase()
      : String(raw)
          .trim()
          .toLowerCase();
  if (s === "complete" || s === "done" || s === "closed" || s === "archived") return "completed";
  if (s === "active") return "ongoing";
  return s;
}

/**
 * 프로젝트 카드 배지용 모집 상태 (DB의 status·recruitment_status 기반)
 */
export function inferProjectRecruitmentState(
  projectStatus: string | null | undefined,
  recruitmentRows: RecruitmentStatusRow[] | null | undefined
): ProjectRecruitmentState {
  const statusNorm = normalizeRawProjectStatus(projectStatus);
  if (statusNorm === "completed") return "closed";

  const rows = Array.isArray(recruitmentRows) ? recruitmentRows : [];
  if (rows.some((r) => r.status === "urgent")) return "urgent";

  const withSlots = rows.filter((r) => {
    const total =
      typeof r.total === "number"
        ? r.total
        : typeof r.count === "number"
          ? r.count
          : 0;
    return total > 0;
  });
  if (withSlots.length > 0) {
    const allFull = withSlots.every((r) => {
      const total =
        typeof r.total === "number"
          ? r.total
          : typeof r.count === "number"
            ? r.count
            : 1;
      const filled = typeof r.filled === "number" ? r.filled : 0;
      return filled >= total;
    });
    if (allFull) return "full";
  }

  return "recruiting";
}
