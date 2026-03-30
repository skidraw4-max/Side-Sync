import type { RecruitmentStatusRow } from "@/types/database";

export type ProjectRecruitmentState = "recruiting" | "urgent" | "full" | "closed";

/** 포지션별 total·filled 합산 — 슬롯이 없으면 null */
export function getRecruitmentProgress(
  recruitmentRows: RecruitmentStatusRow[] | null | undefined
): { filled: number; total: number } | null {
  const rows = Array.isArray(recruitmentRows) ? recruitmentRows : [];
  let filled = 0;
  let total = 0;
  for (const r of rows) {
    const t =
      typeof r.total === "number"
        ? r.total
        : typeof r.count === "number"
          ? r.count
          : 0;
    if (t <= 0) continue;
    const f = typeof r.filled === "number" ? r.filled : 0;
    total += t;
    filled += Math.min(f, t);
  }
  if (total <= 0) return null;
  return { filled, total };
}

/**
 * 프로젝트 카드 배지용 모집 상태 (DB의 status·recruitment_status 기반)
 */
export function inferProjectRecruitmentState(
  projectStatus: string | null | undefined,
  recruitmentRows: RecruitmentStatusRow[] | null | undefined
): ProjectRecruitmentState {
  const statusNorm =
    typeof projectStatus === "string" ? projectStatus.trim().toLowerCase() : "";
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
