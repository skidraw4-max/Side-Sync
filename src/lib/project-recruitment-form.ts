import type { RecruitmentStatusRow } from "@/types/database";

/** 자주 쓰는 직군 — 입력 필드에서 datalist로 제안만 하며, 임의 문자열도 저장 가능 */
export const RECRUITMENT_ROLE_PRESETS: { value: string; label: string }[] = [
  { value: "planner", label: "기획자 (Planner)" },
  { value: "developer", label: "개발자 (Developer)" },
  { value: "designer", label: "디자이너 (Designer)" },
];

export interface RecruitmentEntry {
  id: string;
  /** DB `recruitment_status[].role` 에 그대로 저장되는 표시명 */
  role: string;
  count: number;
  status: RecruitmentStatusRow["status"];
}

export function createRecruitmentEntry(overrides?: Partial<RecruitmentEntry>): RecruitmentEntry {
  return {
    id: crypto.randomUUID(),
    role: "",
    count: 1,
    status: "recruiting",
    ...overrides,
  };
}

/** API·DB용 roleKey — 프리셋 라벨이면 고정 키, 그 외에는 라벨 기반 슬러그 */
export function roleKeyFromRoleLabel(role: string): string {
  const trimmed = role.trim();
  const preset = RECRUITMENT_ROLE_PRESETS.find((o) => o.label === trimmed);
  if (preset) return preset.value;
  const asValue = RECRUITMENT_ROLE_PRESETS.find((o) => o.value === trimmed);
  if (asValue) return asValue.value;
  const slug = trimmed
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣\-_]/gi, "");
  return slug || "custom-role";
}

export function recruitmentRowsToEntries(rows: unknown): RecruitmentEntry[] {
  const arr = Array.isArray(rows) ? (rows as RecruitmentStatusRow[]) : [];
  if (arr.length === 0) {
    return [createRecruitmentEntry()];
  }
  return arr.map((r) => {
    let role = typeof r.role === "string" ? r.role.trim() : "";
    if (!role) {
      const key = typeof r.roleKey === "string" ? r.roleKey.trim() : "";
      role = RECRUITMENT_ROLE_PRESETS.find((o) => o.value === key)?.label ?? key;
    }
    const count =
      typeof r.count === "number" ? r.count : typeof r.total === "number" ? r.total : 1;
    const status: RecruitmentStatusRow["status"] = r.status === "urgent" ? "urgent" : "recruiting";
    return createRecruitmentEntry({ role, count, status });
  });
}

export function entriesToRecruitmentStatusRows(entries: RecruitmentEntry[]): RecruitmentStatusRow[] {
  return entries.map((r) => ({
    role: r.role.trim(),
    roleKey: roleKeyFromRoleLabel(r.role.trim()),
    count: r.count,
    status: r.status,
  }));
}

export function recruitmentEntriesValidationMessage(entries: RecruitmentEntry[]): string | null {
  if (entries.length === 0) return "최소 하나의 모집 분야를 추가해주세요.";
  if (entries.some((e) => !e.role.trim())) {
    return "모든 모집 분야에 이름을 입력하거나, 빈 행은 삭제해주세요.";
  }
  return null;
}
