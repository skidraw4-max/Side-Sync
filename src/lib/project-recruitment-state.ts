import type { RecruitmentStatusRow } from "@/types/database";

export type ProjectRecruitmentState = "recruiting" | "urgent" | "full" | "closed";

/**
 * 프로젝트 카드 배지용 모집 상태 (DB의 status·recruitment_status 기반)
 */
export function inferProjectRecruitmentState(
  projectStatus: string | null | undefined,
  recruitmentRows: RecruitmentStatusRow[] | null | undefined
): ProjectRecruitmentState {
  if (projectStatus === "completed") return "closed";

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
