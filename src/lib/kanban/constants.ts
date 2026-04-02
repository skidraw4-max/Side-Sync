import { WORKSPACE } from "@/lib/constants/contents";

/** API·DB·폼 검증 공통 */
export const KANBAN_STATUS_VALUES = [
  "requested",
  "in_progress",
  "feedback",
  "completed",
  "on_hold",
] as const;
export type KanbanTaskStatus = (typeof KANBAN_STATUS_VALUES)[number];
export const KANBAN_STATUS_SET = new Set<string>(KANBAN_STATUS_VALUES);

/** 보드 컬럼 순서 (왼→오) */
export const KANBAN_COLUMN_ORDER: readonly KanbanTaskStatus[] = [
  "requested",
  "in_progress",
  "feedback",
  "completed",
  "on_hold",
] as const;

export const KANBAN_PRIORITY_VALUES = ["high", "medium", "low"] as const;
export type KanbanTaskPriority = (typeof KANBAN_PRIORITY_VALUES)[number];
export const KANBAN_PRIORITY_SET = new Set<string>(KANBAN_PRIORITY_VALUES);

export const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-pink-100 text-red-700",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-sky-100 text-sky-700",
};

export const KANBAN_STATUS_OPTIONS = [
  { value: "requested" as const, label: WORKSPACE.kanbanColumnRequested },
  { value: "in_progress" as const, label: WORKSPACE.kanbanColumnInProgress },
  { value: "feedback" as const, label: WORKSPACE.kanbanColumnFeedback },
  { value: "completed" as const, label: WORKSPACE.kanbanColumnCompleted },
  { value: "on_hold" as const, label: WORKSPACE.kanbanColumnOnHold },
] as const;

/** 컬럼 헤더 배지 */
export const KANBAN_STATUS_HEADER_CLASS: Record<KanbanTaskStatus, string> = {
  requested: "bg-sky-100 text-sky-900",
  in_progress: "bg-emerald-100 text-emerald-900",
  feedback: "bg-orange-100 text-orange-900",
  completed: "bg-indigo-100 text-indigo-950",
  on_hold: "bg-gray-200 text-gray-800",
};

export function formatKanbanDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
