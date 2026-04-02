import { WORKSPACE } from "@/lib/constants/contents";

/** API·폼 검증 공통 (라벨은 KANBAN_STATUS_OPTIONS 참고) */
export const KANBAN_STATUS_VALUES = ["todo", "doing", "done"] as const;
export type KanbanTaskStatus = (typeof KANBAN_STATUS_VALUES)[number];
export const KANBAN_STATUS_SET = new Set<string>(KANBAN_STATUS_VALUES);

export const KANBAN_PRIORITY_VALUES = ["high", "medium", "low"] as const;
export type KanbanTaskPriority = (typeof KANBAN_PRIORITY_VALUES)[number];
export const KANBAN_PRIORITY_SET = new Set<string>(KANBAN_PRIORITY_VALUES);

export const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-pink-100 text-red-700",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-sky-100 text-sky-700",
};

export const KANBAN_STATUS_OPTIONS = [
  { value: "todo" as const, label: WORKSPACE.kanbanColumnTodo },
  { value: "doing" as const, label: WORKSPACE.kanbanColumnDoing },
  { value: "done" as const, label: WORKSPACE.kanbanColumnDone },
] as const;

export function formatKanbanDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
