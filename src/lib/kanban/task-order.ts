import type { KanbanAssignee, KanbanTaskWithAssignee } from "@/types/kanban";

const STATUS_RANK: Record<string, number> = { todo: 0, doing: 1, done: 2 };

/** 보드 표시용: 컬럼 순서 → 컬럼 내 sort_order */
export function sortTasksForBoard(tasks: KanbanTaskWithAssignee[]): KanbanTaskWithAssignee[] {
  return [...tasks].sort((a, b) => {
    const ra = STATUS_RANK[a.status] ?? 9;
    const rb = STATUS_RANK[b.status] ?? 9;
    if (ra !== rb) return ra - rb;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

export function mergeColumnsToTasks(
  todo: KanbanTaskWithAssignee[],
  doing: KanbanTaskWithAssignee[],
  done: KanbanTaskWithAssignee[]
): KanbanTaskWithAssignee[] {
  const assign = (list: KanbanTaskWithAssignee[], status: "todo" | "doing" | "done") =>
    list.map((t, i) => ({ ...t, status, sort_order: i }));
  return sortTasksForBoard([
    ...assign(todo, "todo"),
    ...assign(doing, "doing"),
    ...assign(done, "done"),
  ]);
}

/** 상태 변경(카드 UI·모달) 시: 해당 카드를 제외한 뒤 목표 컬럼 맨 아래에 두고 재번호 */
export function applyTaskStatusMove(
  tasks: KanbanTaskWithAssignee[],
  taskId: string,
  newStatus: "todo" | "doing" | "done"
): KanbanTaskWithAssignee[] {
  const moved = tasks.find((t) => t.id === taskId);
  if (!moved) return tasks;
  const rest = tasks.filter((t) => t.id !== taskId);
  const cols = {
    todo: rest.filter((t) => t.status === "todo"),
    doing: rest.filter((t) => t.status === "doing"),
    done: rest.filter((t) => t.status === "done"),
  };
  cols[newStatus].push({ ...moved, status: newStatus });
  return mergeColumnsToTasks(cols.todo, cols.doing, cols.done);
}

export function layoutSignature(t: KanbanTaskWithAssignee): string {
  return `${t.status}:${t.sort_order ?? 0}`;
}

export function nextSortOrderInColumn(
  tasks: KanbanTaskWithAssignee[],
  column: "todo" | "doing" | "done"
): number {
  const inCol = tasks.filter((t) => t.status === column);
  if (inCol.length === 0) return 0;
  return Math.max(...inCol.map((t) => t.sort_order ?? 0)) + 1;
}

/** 모달 저장: 상태 동일하면 제목 등만 갱신, 상태 변경 시 해당 컬럼 맨 아래로 이동 후 재번호 */
export function applyFullTaskUpdate(
  tasks: KanbanTaskWithAssignee[],
  taskId: string,
  payload: {
    title: string;
    priority: string;
    assignee_id: string | null;
    status: "todo" | "doing" | "done";
    due_date: string | null;
    /** undefined면 기존 설명 유지 */
    description?: string | null;
  },
  assignee: KanbanAssignee | null
): KanbanTaskWithAssignee[] {
  const cur = tasks.find((t) => t.id === taskId);
  if (!cur) return tasks;

  const nextDescription =
    payload.description !== undefined ? payload.description : cur.description;

  if (cur.status === payload.status) {
    return tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            title: payload.title,
            priority: payload.priority,
            assignee_id: payload.assignee_id,
            assignee,
            due_date: payload.due_date,
            description: nextDescription,
          }
        : t
    );
  }

  const rest = tasks.filter((t) => t.id !== taskId);
  const cols = {
    todo: rest.filter((t) => t.status === "todo"),
    doing: rest.filter((t) => t.status === "doing"),
    done: rest.filter((t) => t.status === "done"),
  };
  cols[payload.status].push({
    ...cur,
    title: payload.title,
    priority: payload.priority,
    assignee_id: payload.assignee_id,
    assignee,
    due_date: payload.due_date,
    description: nextDescription,
    status: payload.status,
  });
  return mergeColumnsToTasks(cols.todo, cols.doing, cols.done);
}
