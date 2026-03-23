"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import TaskCard from "@/components/workspace/TaskCard";
import { useKanban } from "@/hooks/useKanban";
import { KANBAN_STATUS_OPTIONS } from "@/lib/kanban/constants";
import { COMMON, WORKSPACE } from "@/lib/constants/contents";
import type { KanbanTaskWithAssignee, KanbanTeamMember } from "@/types/kanban";

interface KanbanTasksBoardProps {
  projectId: string;
  projectTitle: string;
  initialTasks: KanbanTaskWithAssignee[];
  teamMembers: KanbanTeamMember[];
  currentUserId: string | null;
  recruitmentRoles: string[];
}

export default function KanbanTasksBoard({
  projectId,
  projectTitle: _projectTitle,
  initialTasks,
  teamMembers,
  currentUserId,
  recruitmentRoles = [],
}: KanbanTasksBoardProps) {
  const router = useRouter();
  const { tasks, setTasks, handleStatusChange, handleAssigneeChange, commitTaskUpdate } =
    useKanban({
      projectId,
      initialTasks,
      teamMembers,
    });

  const [searchQuery, setSearchQuery] = useState("");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<"todo" | "doing" | "done">("todo");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newAssigneeId, setNewAssigneeId] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTaskWithAssignee | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">("medium");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState<"todo" | "doing" | "done">("todo");

  const meInTeam = Boolean(currentUserId && teamMembers.some((m) => m.id === currentUserId));

  const assigneeOptions = useMemo(() => {
    const opts: { value: string; label: string; isUser: boolean }[] = [];
    opts.push({ value: "", label: WORKSPACE.assigneeUnset, isUser: false });
    if (meInTeam && currentUserId) {
      const me = teamMembers.find((m) => m.id === currentUserId);
      opts.push({
        value: currentUserId,
        label: `${WORKSPACE.meSelfPrefix} (${me?.fullName ?? WORKSPACE.meFallbackName})`,
        isUser: true,
      });
    }
    teamMembers
      .filter((m) => m.id !== currentUserId)
      .forEach((m) =>
        opts.push({ value: m.id, label: m.fullName ?? WORKSPACE.memberFallback, isUser: true })
      );
    if (recruitmentRoles.length > 0) {
      recruitmentRoles.forEach((r, i) =>
        opts.push({
          value: `__role_${i}`,
          label: `${r} (${WORKSPACE.recruitingSlotSuffix})`,
          isUser: false,
        })
      );
    }
    return opts;
  }, [currentUserId, meInTeam, recruitmentRoles, teamMembers]);

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

  const openNewTaskModal = (column: "todo" | "doing" | "done") => {
    setNewTaskColumn(column);
    setNewTitle("");
    setNewPriority("medium");
    setNewAssigneeId(meInTeam && currentUserId ? currentUserId : "");
    setNewDueDate("");
    setShowNewTaskModal(true);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      toast.error(WORKSPACE.toastTitleRequired);
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
      assignee_id:
        newAssigneeId && newAssigneeId.trim() && !newAssigneeId.startsWith("__role_")
          ? newAssigneeId.trim()
          : null,
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
      toast.error(`${WORKSPACE.toastTaskCreateFailedPrefix} (${error.message})`);
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

    const assigneeIdForDb =
      newAssigneeId && !newAssigneeId.startsWith("__role_") ? newAssigneeId : null;
    if (assigneeIdForDb && currentUserId) {
      const assigner = teamMembers.find((m) => m.id === currentUserId);
      const assigneeMember = teamMembers.find((m) => m.id === assigneeIdForDb);
      const assignerName = assigner?.fullName ?? WORKSPACE.teammate;
      const assigneeName = assigneeMember?.fullName ?? WORKSPACE.teammate;
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

    toast.success(WORKSPACE.toastTaskCreated);
    router.refresh();
  };

  const openEditModal = (task: KanbanTaskWithAssignee) => {
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
    const editAssigneeDbValue =
      editAssigneeId && !editAssigneeId.startsWith("__role_") ? editAssigneeId : null;

    try {
      await commitTaskUpdate(editingTask.id, {
        title: editTitle.trim(),
        priority: editPriority,
        assignee_id: editAssigneeDbValue,
        status: editStatus,
        due_date: editDueDate || null,
      });
    } catch (e) {
      setIsSubmitting(false);
      toast.error(e instanceof Error ? e.message : WORKSPACE.toastTaskUpdateFailed);
      return;
    }

    setIsSubmitting(false);
    setEditingTask(null);
    toast.success(WORKSPACE.toastTaskUpdated);
  };

  const columns = [
    { id: "todo" as const, title: WORKSPACE.kanbanColumnTodo, tasks: todoTasks },
    { id: "doing" as const, title: WORKSPACE.kanbanColumnDoing, tasks: doingTasks },
    { id: "done" as const, title: WORKSPACE.kanbanColumnDone, tasks: doneTasks },
  ];

  const currentMember =
    currentUserId && teamMembers.length > 0
      ? teamMembers.find((m) => m.id === currentUserId) ?? null
      : null;

  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-8 sm:py-4">
        <h1 className="text-xl font-bold text-gray-900">{WORKSPACE.kanbanBoardTitle}</h1>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <input
              type="search"
              placeholder={WORKSPACE.taskSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 max-w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-40 md:w-64"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button type="button" className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
        style={{ WebkitOverflowScrolling: "touch" } as CSSProperties}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" />
                </svg>
              }
              title={WORKSPACE.taskEmptyTitle}
              description={WORKSPACE.taskEmptyDescription}
              actions={[
                { label: WORKSPACE.taskCreateFirst, onClick: () => openNewTaskModal("todo"), primary: true },
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
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
                    className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    {WORKSPACE.taskAddToColumn}
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
            <h3 className="text-lg font-semibold text-gray-900">{WORKSPACE.taskCreateNew}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {WORKSPACE.taskTitleLabel}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={WORKSPACE.taskCreatePlaceholder}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {WORKSPACE.taskPriorityLabel}
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as "high" | "medium" | "low")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="high">{WORKSPACE.priorityHigh}</option>
                  <option value="medium">{WORKSPACE.priorityMedium}</option>
                  <option value="low">{WORKSPACE.priorityLow}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {WORKSPACE.taskAssigneeLabel}
                </label>
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
                <label className="block text-sm font-medium text-gray-700">
                  {WORKSPACE.taskDueDateLabel}
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-500">
                {WORKSPACE.taskColumnHintPrefix}:{" "}
                {KANBAN_STATUS_OPTIONS.find((o) => o.value === newTaskColumn)?.label ??
                  newTaskColumn}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {COMMON.cancel}
              </button>
              <button
                type="button"
                onClick={handleCreateTask}
                disabled={!newTitle.trim() || isSubmitting}
                className="whitespace-nowrap rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {isSubmitting ? WORKSPACE.taskRegistering : COMMON.register}
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
            <h3 className="text-lg font-semibold text-gray-900">{WORKSPACE.taskEdit}</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {WORKSPACE.taskTitleLabel}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={WORKSPACE.taskCreatePlaceholder}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {WORKSPACE.taskPriorityLabel}
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as "high" | "medium" | "low")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="high">{WORKSPACE.priorityHigh}</option>
                  <option value="medium">{WORKSPACE.priorityMedium}</option>
                  <option value="low">{WORKSPACE.priorityLow}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {WORKSPACE.taskStatusLabel}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as "todo" | "doing" | "done")}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {KANBAN_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {WORKSPACE.taskAssigneeLabel}
                </label>
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
                <label className="block text-sm font-medium text-gray-700">
                  {WORKSPACE.taskDueDateLabel}
                </label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {COMMON.cancel}
              </button>
              <button
                type="button"
                onClick={handleUpdateTask}
                disabled={!editTitle.trim() || isSubmitting}
                className="whitespace-nowrap rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {isSubmitting ? WORKSPACE.taskSaving : COMMON.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
