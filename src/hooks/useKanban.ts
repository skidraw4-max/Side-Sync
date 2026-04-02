"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  applyFullTaskUpdate,
  applyTaskStatusMove,
  layoutSignature,
  sortTasksForBoard,
} from "@/lib/kanban/task-order";
import type { KanbanAssignee, KanbanTaskWithAssignee, KanbanTeamMember } from "@/types/kanban";
import { KANBAN_STATUS_SET, type KanbanTaskStatus } from "@/lib/kanban/constants";
import { WORKSPACE } from "@/lib/constants/contents";

type TaskRowFromRealtime = {
  id: string;
  title: string;
  category: string;
  priority?: string;
  status: string;
  assignee_id: string | null;
  due_date?: string | null;
  sort_order?: number;
  description?: string | null;
  requested_by?: string | null;
};

export interface UseKanbanOptions {
  projectId: string;
  initialTasks: KanbanTaskWithAssignee[];
  teamMembers: KanbanTeamMember[];
}

export interface CommitTaskUpdatePayload {
  title: string;
  priority: "high" | "medium" | "low";
  assignee_id: string | null;
  status: KanbanTaskStatus;
  due_date: string | null;
  /** undefined면 PATCH에 넣지 않음 */
  description?: string | null;
  /** 피드백·보류 등 전환 시 */
  statusComment?: string;
}

export function useKanban({ projectId, initialTasks, teamMembers }: UseKanbanOptions) {
  const router = useRouter();
  const [tasks, setTasks] = useState<KanbanTaskWithAssignee[]>(initialTasks);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  useEffect(() => {
    setTasks(initialTasks);
    tasksRef.current = initialTasks;
  }, [initialTasks]);

  const patchTaskApi = useCallback(
    async (taskId: string, body: Record<string, unknown>) => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(
          json.error ?? `${WORKSPACE.saveFailedWithStatus} (${res.status})`
        );
      }
    },
    [projectId]
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`tasks:project:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = payload.new as TaskRowFromRealtime;
          if (!row) return;

          const assignee = row.assignee_id
            ? teamMembers.find((m) => m.id === row.assignee_id)
            : null;

          setTasks((prev) => {
            const exists = prev.some((t) => t.id === row.id);
            if (!exists) return prev;

            return sortTasksForBoard(
              prev.map((t) =>
                t.id === row.id
                  ? {
                      ...t,
                      title: row.title,
                      category: row.category,
                      priority: row.priority ?? "medium",
                      status: row.status,
                      assignee_id: row.assignee_id,
                      due_date: "due_date" in row ? row.due_date ?? null : t.due_date,
                      sort_order: "sort_order" in row ? row.sort_order ?? t.sort_order : t.sort_order,
                      description:
                        "description" in row ? row.description ?? null : t.description,
                      requested_by:
                        "requested_by" in row ? row.requested_by ?? null : t.requested_by,
                      assignee: assignee
                        ? { fullName: assignee.fullName, avatarUrl: assignee.avatarUrl }
                        : null,
                    }
                  : t
              )
            );
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = payload.new as TaskRowFromRealtime;
          if (!row) return;

          const assignee = row.assignee_id
            ? teamMembers.find((m) => m.id === row.assignee_id)
            : null;

          setTasks((prev) => {
            if (prev.some((t) => t.id === row.id)) return prev;
            return sortTasksForBoard([
              ...prev,
              {
                id: row.id,
                title: row.title,
                category: row.category,
                priority: row.priority ?? "medium",
                status: row.status,
                assignee_id: row.assignee_id,
                due_date: "due_date" in row ? row.due_date ?? null : null,
                sort_order: row.sort_order ?? 0,
                description: "description" in row ? row.description ?? null : undefined,
                requested_by: "requested_by" in row ? row.requested_by ?? null : undefined,
                assignee: assignee
                  ? { fullName: assignee.fullName, avatarUrl: assignee.avatarUrl }
                  : null,
              },
            ]);
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = payload.old as { id: string };
          if (!row) return;
          setTasks((prev) => prev.filter((t) => t.id !== row.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, teamMembers]);

  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: string, opts?: { statusComment?: string }) => {
      if (!KANBAN_STATUS_SET.has(newStatus)) {
        toast.error(WORKSPACE.toastStatusChangeFailed);
        return;
      }
      const safe = newStatus as KanbanTaskStatus;
      const prev = tasksRef.current;
      const next = applyTaskStatusMove(prev, taskId, safe);
      const before = new Map(prev.map((t) => [t.id, layoutSignature(t)]));
      setTasks(next);
      tasksRef.current = next;

      try {
        const toPatch = next.filter((t) => layoutSignature(t) !== before.get(t.id));
        await Promise.all(
          toPatch.map((t) => {
            const body: Record<string, unknown> = {
              status: t.status,
              sort_order: t.sort_order ?? 0,
            };
            if (t.id === taskId && opts?.statusComment) {
              body.status_comment = opts.statusComment;
            }
            return patchTaskApi(t.id, body);
          })
        );
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : WORKSPACE.toastStatusChangeFailed
        );
        setTasks(prev);
        tasksRef.current = prev;
      }
    },
    [patchTaskApi, router]
  );

  const handleAssigneeChange = useCallback(
    async (taskId: string, assigneeId: string | null) => {
      const dbValue = assigneeId && !assigneeId.startsWith("__role_") ? assigneeId : null;
      const newAssignee = dbValue
        ? teamMembers.find((m) => m.id === dbValue)
        : null;

      const rollbackRef: {
        snapshot: { assignee_id: string | null; assignee: KanbanAssignee | null } | null;
      } = { snapshot: null };
      setTasks((prev) => {
        const cur = prev.find((t) => t.id === taskId);
        if (cur) {
          rollbackRef.snapshot = { assignee_id: cur.assignee_id, assignee: cur.assignee };
        }
        return prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                assignee_id: dbValue,
                assignee: newAssignee
                  ? { fullName: newAssignee.fullName, avatarUrl: newAssignee.avatarUrl }
                  : null,
              }
            : t
        );
      });

      try {
        await patchTaskApi(taskId, {
          assignee_id: dbValue,
        });
        toast.success(WORKSPACE.toastAssigneeUpdated);
        router.refresh();
      } catch {
        toast.error(WORKSPACE.toastAssigneeChangeFailed);
        const snap = rollbackRef.snapshot;
        if (snap) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, assignee_id: snap.assignee_id, assignee: snap.assignee }
                : t
            )
          );
        }
      }
    },
    [router, teamMembers, patchTaskApi]
  );

  const commitTaskUpdate = useCallback(
    async (taskId: string, payload: CommitTaskUpdatePayload) => {
      const prev = tasksRef.current;
      const newAssignee = payload.assignee_id
        ? teamMembers.find((m) => m.id === payload.assignee_id)
        : null;
      const assignee = newAssignee
        ? { fullName: newAssignee.fullName, avatarUrl: newAssignee.avatarUrl }
        : null;

      const next = applyFullTaskUpdate(prev, taskId, payload, assignee);
      const before = new Map(prev.map((t) => [t.id, layoutSignature(t)]));
      setTasks(next);
      tasksRef.current = next;

      try {
        const self = next.find((t) => t.id === taskId);
        if (!self) throw new Error("업무를 찾을 수 없습니다.");

        const patchBody: Record<string, unknown> = {
          title: payload.title,
          priority: payload.priority,
          assignee_id: payload.assignee_id,
          status: payload.status,
          due_date: payload.due_date,
          sort_order: self.sort_order ?? 0,
        };
        if (payload.description !== undefined) {
          patchBody.description = payload.description;
        }
        if (payload.statusComment) {
          patchBody.status_comment = payload.statusComment;
        }
        await patchTaskApi(taskId, patchBody);

        const others = next.filter(
          (t) => t.id !== taskId && layoutSignature(t) !== before.get(t.id)
        );
        await Promise.all(
          others.map((t) =>
            patchTaskApi(t.id, { status: t.status, sort_order: t.sort_order ?? 0 })
          )
        );
        router.refresh();
      } catch (e) {
        setTasks(prev);
        tasksRef.current = prev;
        throw e;
      }
    },
    [patchTaskApi, router, teamMembers]
  );

  const reorderAfterDrag = useCallback(
    async (nextTasks: KanbanTaskWithAssignee[], rollback: KanbanTaskWithAssignee[]) => {
      const prev = rollback;
      const before = new Map(prev.map((t) => [t.id, layoutSignature(t)]));
      setTasks(nextTasks);
      tasksRef.current = nextTasks;
      try {
        const toPatch = nextTasks.filter(
          (t) => layoutSignature(t) !== before.get(t.id)
        );
        await Promise.all(
          toPatch.map((t) =>
            patchTaskApi(t.id, { status: t.status, sort_order: t.sort_order ?? 0 })
          )
        );
        router.refresh();
      } catch (e) {
        setTasks(prev);
        tasksRef.current = prev;
        toast.error(
          e instanceof Error ? e.message : WORKSPACE.toastStatusChangeFailed
        );
      }
    },
    [patchTaskApi, router]
  );

  return {
    tasks,
    setTasks,
    handleStatusChange,
    handleAssigneeChange,
    commitTaskUpdate,
    reorderAfterDrag,
  };
}
