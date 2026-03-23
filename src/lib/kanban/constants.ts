import { WORKSPACE } from "@/lib/constants/contents";

export const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-pink-100 text-red-700",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-sky-100 text-sky-700",
};

export const KANBAN_STATUS_OPTIONS = [
  { value: "todo", label: WORKSPACE.kanbanColumnTodo },
  { value: "doing", label: WORKSPACE.kanbanColumnDoing },
  { value: "done", label: WORKSPACE.kanbanColumnDone },
] as const;

export function formatKanbanDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
