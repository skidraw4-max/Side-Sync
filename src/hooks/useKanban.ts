"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { KanbanAssignee, KanbanTaskWithAssignee, KanbanTeamMember } from "@/types/kanban";
import { WORKSPACE } from "@/lib/constants/contents";

type TaskRowFromRealtime = {
  id: string;
  title: string;
  category: string;
  priority?: string;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
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
  status: "todo" | "doing" | "done";
  due_date: string | null;
}

export function useKanban({ projectId, initialTasks, teamMembers }: UseKanbanOptions) {
  const router = useRouter();
  const [tasks, setTasks] = useState<KanbanTaskWithAssignee[]>(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
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

  // Supabase Realtime: 다른 팀원이 tasks를 변경하면 새로고침 없이 반영
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

            return prev.map((t) =>
              t.id === row.id
                ? {
                    ...t,
                    title: row.title,
                    category: row.category,
                    priority: row.priority ?? "medium",
                    status: row.status,
                    assignee_id: row.assignee_id,
                    due_date: row.due_date,
                    assignee: assignee
                      ? { fullName: assignee.fullName, avatarUrl: assignee.avatarUrl }
                      : null,
                  }
                : t
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
            return [
              {
                id: row.id,
                title: row.title,
                category: row.category,
                priority: row.priority ?? "medium",
                status: row.status,
                assignee_id: row.assignee_id,
                due_date: row.due_date,
                assignee: assignee
                  ? { fullName: assignee.fullName, avatarUrl: assignee.avatarUrl }
                  : null,
              },
              ...prev,
            ];
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
    async (taskId: string, newStatus: string) => {
      const safe =
        newStatus === "todo" || newStatus === "doing" || newStatus === "done"
          ? newStatus
          : "todo";
      let prevStatus = "todo";
      setTasks((prev) => {
        const t = prev.find((x) => x.id === taskId);
        prevStatus = t?.status ?? "todo";
        return prev.map((x) => (x.id === taskId ? { ...x, status: safe } : x));
      });

      try {
        await patchTaskApi(taskId, { status: safe });
        router.refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : WORKSPACE.toastStatusChangeFailed
        );
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
        );
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
        await patchTaskApi(taskId, { assignee_id: dbValue });
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

  /** 모달 저장: API PATCH 후 로컬 tasks 반영 */
  const commitTaskUpdate = useCallback(
    async (taskId: string, payload: CommitTaskUpdatePayload) => {
      const body: Record<string, unknown> = {
        title: payload.title,
        priority: payload.priority,
        assignee_id: payload.assignee_id,
        status: payload.status,
        due_date: payload.due_date,
      };
      await patchTaskApi(taskId, body);

      const newAssignee = payload.assignee_id
        ? teamMembers.find((m) => m.id === payload.assignee_id)
        : null;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                title: payload.title,
                priority: payload.priority,
                assignee_id: payload.assignee_id,
                assignee: newAssignee
                  ? { fullName: newAssignee.fullName, avatarUrl: newAssignee.avatarUrl }
                  : null,
                due_date: payload.due_date,
                status: payload.status,
              }
            : t
        )
      );
      router.refresh();
    },
    [patchTaskApi, router, teamMembers]
  );

  return {
    tasks,
    setTasks,
    handleStatusChange,
    handleAssigneeChange,
    commitTaskUpdate,
  };
}
