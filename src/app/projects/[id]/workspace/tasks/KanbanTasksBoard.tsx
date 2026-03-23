"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

interface Assignee {
  fullName: string | null;
  avatarUrl: string | null;
}

interface TeamMember {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
}

interface TaskWithAssignee {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
  assignee: Assignee | null;
}

interface KanbanTasksBoardProps {
  projectId: string;
  projectTitle: string;
  initialTasks: TaskWithAssignee[];
  teamMembers: TeamMember[];
  currentUserId: string | null;
  recruitmentRoles: string[];
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-pink-100 text-red-700",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-sky-100 text-sky-700",
};

const STATUS_OPTIONS = [
  { value: "todo", label: "To-do" },
  { value: "doing", label: "In Progress" },
  { value: "done", label: "Done" },
] as const;

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function TaskCard({
  task,
  teamMembers,
  onStatusChange,
  onAssigneeChange,
  onEdit,
}: {
  task: TaskWithAssignee;
  teamMembers: TeamMember[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onAssigneeChange: (taskId: string, assigneeId: string | null) => void;
  onEdit: (task: TaskWithAssignee) => void;
}) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const isDone = task.status === "done";

  return (
    <div
      className={`group cursor-pointer rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-opacity hover:shadow-md ${
        isDone ? "opacity-75" : ""
      }`}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
            PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium
          }`}
        >
          {task.priority === "high" ? "High" : task.priority === "low" ? "Low" : "Medium"}
        </span>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setIsAssigneeOpen(false);
              setIsStatusOpen((o) => !o);
            }}
            className="rounded p-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            상태 변경 ▾
          </button>
          {isStatusOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setIsStatusOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onStatusChange(task.id, opt.value);
                      setIsStatusOpen(false);
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      task.status === opt.value ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <p className="mt-2 font-medium text-gray-900">{task.title}</p>
      {task.due_date && (
        <p className="mt-1 text-xs text-gray-500">{formatDueDate(task.due_date)}</p>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          0
        </span>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setIsStatusOpen(false);
              setIsAssigneeOpen((o) => !o);
            }}
            className="flex items-center gap-1 rounded-full hover:ring-2 hover:ring-gray-200"
          >
            {task.assignee ? (
              task.assignee.avatarUrl ? (
                <img
                  src={task.assignee.avatarUrl}
                  alt=""
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-[10px] font-medium text-white">
                  {(task.assignee.fullName?.[0] ?? "?").toUpperCase()}
                </div>
              )
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">+</div>
            )}
          </button>
          {isAssigneeOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setIsAssigneeOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onAssigneeChange(task.id, null);
                    setIsAssigneeOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                >
                  담당자 없음
                </button>
                {teamMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onAssigneeChange(task.id, m.id);
                      setIsAssigneeOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                      task.assignee_id === m.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                    }`}
                  >
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-[9px] font-medium text-white">
                        {(m.fullName?.[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                    {m.fullName ?? "회원"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KanbanTasksBoard({
  projectId,
  projectTitle,
  initialTasks,
  teamMembers,
  currentUserId,
  recruitmentRoles = [],
}: KanbanTasksBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithAssignee[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<"todo" | "doing" | "done">("todo");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newAssigneeId, setNewAssigneeId] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithAssignee | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">("medium");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<"todo" | "doing" | "done">("todo");

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
        throw new Error(json.error ?? `저장 실패 (${res.status})`);
      }
    },
    [projectId]
  );

  const meInTeam = currentUserId && teamMembers.some((m) => m.id === currentUserId);
  const assigneeOptions = (() => {
    const opts: { value: string; label: string; isUser: boolean }[] = [];
    opts.push({ value: "", label: "미지정", isUser: false });
    if (meInTeam) {
      const me = teamMembers.find((m) => m.id === currentUserId);
      opts.push({
        value: currentUserId!,
        label: `본인 (${me?.fullName ?? "나"})`,
        isUser: true,
      });
    }
    teamMembers
      .filter((m) => m.id !== currentUserId)
      .forEach((m) => opts.push({ value: m.id, label: m.fullName ?? "회원", isUser: true }));
    if (recruitmentRoles.length > 0) {
      recruitmentRoles.forEach((r, i) =>
        opts.push({ value: `__role_${i}`, label: `${r} (모집 중)`, isUser: false })
      );
    }
    return opts;
  })();

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
          const row = payload.new as {
            id: string;
            title: string;
            category: string;
            priority?: string;
            status: string;
            assignee_id: string | null;
            due_date: string | null;
          };
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
          const row = payload.new as {
            id: string;
            title: string;
            category: string;
            priority?: string;
            status: string;
            assignee_id: string | null;
            due_date: string | null;
          };
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

  const filteredTasks = searchQuery.trim()
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.assignee?.fullName ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  const todoTasks = filteredTasks.filter((t) => t.status === "todo");
  const doingTasks = filteredTasks.filter((t) => t.status === "doing");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");

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
        toast.error(e instanceof Error ? e.message : "상태 변경에 실패했습니다.");
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: prevStatus } : t))
        );
      }
    },
    [patchTaskApi, router]
  );

  const openNewTaskModal = (column: "todo" | "doing" | "done") => {
    setNewTaskColumn(column);
    setNewTitle("");
    setNewPriority("medium");
    setNewAssigneeId(meInTeam ? currentUserId! : "");
    setNewDueDate("");
    setShowNewTaskModal(true);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    setIsSubmitting(true);

    const supabase = createClient();

    const insertPayload: Record<string, unknown> = {
      project_id: projectId,
      title: newTitle.trim(),
      category: "GENERAL",
      priority: newPriority,
      status: newTaskColumn,
      assignee_id: newAssigneeId && newAssigneeId.trim() && !newAssigneeId.startsWith("__role_") ? newAssigneeId.trim() : null,
    };
    let { data: inserted, error } = await (supabase as any)
      .from("tasks")
      .insert(insertPayload)
      .select("id, title, category, priority, status, assignee_id")
      .single();

    if (error && insertPayload.assignee_id) {
      console.warn("[KanbanTasksBoard] assignee_id로 등록 실패, 담당자 없이 재시도:", error.message);
      const retryPayload = { ...insertPayload, assignee_id: null };
      const { data: retryData, error: retryError } = await (supabase as any)
        .from("tasks")
        .insert(retryPayload)
        .select("id, title, category, priority, status, assignee_id")
        .single();
      inserted = retryData;
      error = retryError;
    }

    setIsSubmitting(false);
    setShowNewTaskModal(false);

    if (error) {
      console.error("[KanbanTasksBoard] 업무 등록 에러:", error.message, error.code, error.details);
      toast.error(`업무 등록에 실패했습니다. (${error.message})`);
      return;
    }

    const assignee = newAssigneeId
      ? teamMembers.find((m) => m.id === newAssigneeId)
      : null;
    setTasks((prev) => [
      {
        ...inserted,
        priority: inserted.priority ?? "medium",
        due_date: null,
        assignee: assignee
          ? { fullName: assignee.fullName, avatarUrl: assignee.avatarUrl }
          : null,
      },
      ...prev,
    ]);

    // 담당자 지정 시 채팅에 업무 할당 알림 자동 등록
    const assigneeIdForDb = newAssigneeId && !newAssigneeId.startsWith("__role_") ? newAssigneeId : null;
    if (assigneeIdForDb && currentUserId) {
      const assigner = teamMembers.find((m) => m.id === currentUserId);
      const assigneeMember = teamMembers.find((m) => m.id === assigneeIdForDb);
      const assignerName = assigner?.fullName ?? "팀원";
      const assigneeName = assigneeMember?.fullName ?? "팀원";
      const taskTitle = newTitle.trim();
      const notificationMessage = `${assignerName}님이 '${taskTitle}' 업무를 ${assigneeName}님에게 할당했습니다.`;
      const content = JSON.stringify({
        type: "notification",
        task_id: inserted.id,
        message: notificationMessage,
      });
      const { data: generalChannel } = await supabase
        .from("chat_channels")
        .select("id")
        .eq("project_id", projectId)
        .eq("slug", "general")
        .single();
      await (supabase as any).from("chat_messages").insert({
        project_id: projectId,
        channel_id: (generalChannel as { id?: string } | null)?.id ?? null,
        author_id: currentUserId,
        content,
      });
    }

    toast.success("업무가 등록되었습니다.");
    router.refresh();
  };

  const handleAssigneeChange = useCallback(
    async (taskId: string, assigneeId: string | null) => {
      const dbValue = assigneeId && !assigneeId.startsWith("__role_") ? assigneeId : null;
      const newAssignee = dbValue
        ? teamMembers.find((m) => m.id === dbValue)
        : null;

      const rollbackRef: {
        snapshot: { assignee_id: string | null; assignee: Assignee | null } | null;
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
        toast.success("담당자가 변경되었습니다.");
        router.refresh();
      } catch {
        toast.error("담당자 변경에 실패했습니다.");
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

  const openEditModal = (task: TaskWithAssignee) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditPriority((task.priority as "high" | "medium" | "low") ?? "medium");
    setEditAssigneeId(task.assignee_id ?? "");
    setEditDueDate(task.due_date ? task.due_date.slice(0, 10) : "");
    setEditStatus((task.status as "todo" | "doing" | "done") ?? "todo");
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editTitle.trim()) return;

    setIsSubmitting(true);
    const updatePayload: Record<string, unknown> = {
      title: editTitle.trim(),
      priority: editPriority,
      assignee_id: editAssigneeId && !editAssigneeId.startsWith("__role_") ? editAssigneeId : null,
      status: editStatus,
    };
    if (editDueDate) {
      updatePayload.due_date = editDueDate;
    } else {
      updatePayload.due_date = null;
    }

    try {
      await patchTaskApi(editingTask.id, updatePayload);
    } catch (e) {
      setIsSubmitting(false);
      toast.error(e instanceof Error ? e.message : "업무 수정에 실패했습니다.");
      return;
    }

    setIsSubmitting(false);
    setEditingTask(null);

    const editAssigneeDbValue = editAssigneeId && !editAssigneeId.startsWith("__role_") ? editAssigneeId : null;
    const newAssignee = editAssigneeDbValue
      ? teamMembers.find((m) => m.id === editAssigneeDbValue)
      : null;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: editTitle.trim(),
              priority: editPriority,
              assignee_id: editAssigneeDbValue,
              assignee: newAssignee
                ? { fullName: newAssignee.fullName, avatarUrl: newAssignee.avatarUrl }
                : null,
              due_date: editDueDate || null,
              status: editStatus,
            }
          : t
      )
    );
    toast.success("업무가 수정되었습니다.");
    router.refresh();
  };

  const columns = [
    { id: "todo" as const, title: "To-do", tasks: todoTasks },
    { id: "doing" as const, title: "In Progress", tasks: doingTasks },
    { id: "done" as const, title: "Done", tasks: doneTasks },
  ];

  const currentMember =
    currentUserId && teamMembers.length > 0
      ? teamMembers.find((m) => m.id === currentUserId) ?? null
      : null;

  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-8 sm:py-4">
        <h1 className="text-xl font-bold text-gray-900">Project Kanban Board</h1>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 md:w-64"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button type="button" className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13 3a2 2 0 0 1-2 2c0-.7.3-1.4.7-1.9" />
            </svg>
          </button>
          {currentMember?.avatarUrl ? (
            <img
              src={currentMember.avatarUrl}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full border border-gray-200 object-cover"
            />
          ) : currentMember ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-medium text-gray-700">
              {(currentMember.fullName?.[0] ?? "?").toUpperCase()}
            </div>
          ) : null}
        </div>
      </header>

      <div
        className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-8 overscroll-contain touch-pan-y"
        style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" />
                </svg>
              }
              title="업무가 없습니다"
              description="첫 업무를 만들어 팀의 작업을 체계적으로 관리해보세요."
              actions={[
                { label: "첫 업무 만들기", onClick: () => openNewTaskModal("todo"), primary: true },
              ]}
            />
          </div>
        ) : (
        <div className="flex min-w-max gap-4 sm:gap-6">
            {columns.map((col) => (
            <div key={col.id} className="flex w-72 shrink-0 flex-col sm:w-80">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900">{col.title}</h2>
                  <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-gray-200 px-2 text-xs font-medium text-gray-600">
                    {col.tasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openNewTaskModal(col.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {col.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    teamMembers={teamMembers}
                    onStatusChange={handleStatusChange}
                    onAssigneeChange={handleAssigneeChange}
                    onEdit={openEditModal}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => openNewTaskModal(col.id)}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {showNewTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowNewTaskModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">새 업무 등록</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="업무 제목을 입력하세요"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">우선순위</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as "high" | "medium" | "low")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">담당자</label>
                <select
                  value={newAssigneeId}
                  onChange={(e) => setNewAssigneeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {assigneeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">마감일</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500">
                상태: {STATUS_OPTIONS.find((o) => o.value === newTaskColumn)?.label ?? newTaskColumn}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                disabled={!newTitle.trim() || isSubmitting}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {isSubmitting ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setEditingTask(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900">업무 수정</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="업무 제목"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">우선순위</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as "high" | "medium" | "low")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">상태</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "todo" | "doing" | "done")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">담당자</label>
                <select
                  value={editAssigneeId}
                  onChange={(e) => setEditAssigneeId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {assigneeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">마감일</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleUpdateTask}
                disabled={!editTitle.trim() || isSubmitting}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {isSubmitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
