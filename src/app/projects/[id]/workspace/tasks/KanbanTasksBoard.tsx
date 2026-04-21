"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import KanbanBoardHeader from "@/components/workspace/kanban/KanbanBoardHeader";
import KanbanColumns from "@/components/workspace/kanban/KanbanColumns";
import KanbanTaskCreateModal from "@/components/workspace/kanban/KanbanTaskCreateModal";
import KanbanTaskEditModal from "@/components/workspace/kanban/KanbanTaskEditModal";
import { useKanban } from "@/hooks/useKanban";
import { buildKanbanAssigneeOptions } from "@/lib/kanban/build-assignee-options";
import {
  KANBAN_COLUMN_ORDER,
  KANBAN_STATUS_OPTIONS,
  type KanbanTaskStatus,
} from "@/lib/kanban/constants";
import { nextSortOrderInColumn, sortTasksForBoard } from "@/lib/kanban/task-order";
import { transitionRequiresStatusComment } from "@/lib/kanban/task-status-policy";
import { COMMON, WORKSPACE } from "@/lib/constants/contents";
import type {
  KanbanColumnWikiItem,
  KanbanTaskWithAssignee,
  KanbanTeamMember,
  TaskWikiListEntry,
} from "@/types/kanban";

interface KanbanTasksBoardProps {
  projectId: string;
  projectTitle: string;
  initialTasks: KanbanTaskWithAssignee[];
  teamMembers: KanbanTeamMember[];
  currentUserId: string | null;
  teamLeaderId: string | null;
  recruitmentRoles: string[];
  supportsDueDate: boolean;
  supportsSortOrder: boolean;
  supportsDescription: boolean;
}

export default function KanbanTasksBoard({
  projectId,
  projectTitle: _projectTitle,
  initialTasks,
  teamMembers,
  currentUserId,
  teamLeaderId,
  recruitmentRoles = [],
  supportsDueDate,
  supportsSortOrder,
  supportsDescription,
}: KanbanTasksBoardProps) {
  const router = useRouter();
  const dragRollbackRef = useRef<KanbanTaskWithAssignee[]>([]);
  const {
    tasks,
    setTasks,
    handleStatusChange,
    handleAssigneeChange,
    commitTaskUpdate,
    reorderAfterDrag,
  } = useKanban({
    projectId,
    initialTasks,
    teamMembers,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<KanbanTaskStatus>("requested");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newAssigneeId, setNewAssigneeId] = useState<string>("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTaskWithAssignee | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">("medium");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<KanbanTaskStatus>("requested");
  const [editStatusComment, setEditStatusComment] = useState("");

  const [statusCommentFlow, setStatusCommentFlow] = useState<{
    taskId: string;
    newStatus: KanbanTaskStatus;
  } | null>(null);
  const [statusCommentDraft, setStatusCommentDraft] = useState("");

  const [columnWikiList, setColumnWikiList] = useState<TaskWikiListEntry[]>([]);

  const meInTeam = Boolean(currentUserId && teamMembers.some((m) => m.id === currentUserId));

  const taskWikiRefreshKey = useMemo(
    () => tasks.map((t) => `${t.id}:${t.status}`).join("|"),
    [tasks]
  );

  const wikisByColumn = useMemo(() => {
    const m: Record<KanbanTaskStatus, KanbanColumnWikiItem[]> = {
      requested: [],
      in_progress: [],
      feedback: [],
      completed: [],
      on_hold: [],
    };
    for (const w of columnWikiList) {
      const st = w.associated_status as KanbanTaskStatus;
      if (st in m) {
        m[st].push({ id: w.id, title: w.title });
      }
    }
    return m;
  }, [columnWikiList]);

  useEffect(() => {
    if (tasks.length === 0) {
      setColumnWikiList([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/projects/${projectId}/task-wikis`, {
        credentials: "same-origin",
      });
      const json = (await res.json().catch(() => ({}))) as {
        wikis?: TaskWikiListEntry[];
      };
      if (!cancelled && res.ok && Array.isArray(json.wikis)) {
        setColumnWikiList(json.wikis);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, tasks.length, taskWikiRefreshKey]);

  const assigneeOptions = useMemo(
    () =>
      buildKanbanAssigneeOptions({
        currentUserId,
        teamMembers,
        recruitmentRoles,
      }),
    [currentUserId, recruitmentRoles, teamMembers]
  );

  const q = searchQuery.trim().toLowerCase();
  const filteredTasks = q
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.assignee?.fullName ?? "").toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      )
    : tasks;

  const columns = useMemo(
    () =>
      KANBAN_COLUMN_ORDER.map((id) => ({
        id,
        title: KANBAN_STATUS_OPTIONS.find((o) => o.value === id)?.label ?? id,
        tasks: filteredTasks.filter((t) => t.status === id),
      })),
    [filteredTasks]
  );

  const dragEnabled = supportsSortOrder && !searchQuery.trim();

  const handleDragStart = useCallback(() => {
    dragRollbackRef.current = [...tasks];
  }, [tasks]);

  const handleDragEndReorder = useCallback(
    (next: KanbanTaskWithAssignee[]) => {
      const prev = dragRollbackRef.current;
      const prevById = new Map(prev.map((t) => [t.id, t]));
      for (const t of next) {
        const o = prevById.get(t.id);
        if (!o || o.status === t.status) continue;
        if (
          transitionRequiresStatusComment(
            o.status as KanbanTaskStatus,
            t.status as KanbanTaskStatus
          )
        ) {
          setTasks([...prev]);
          toast.info(WORKSPACE.toastDragUseMenuForComment);
          return;
        }
      }
      void reorderAfterDrag(next, prev);
    },
    [reorderAfterDrag, setTasks]
  );

  const openNewTaskModal = (column: KanbanTaskStatus) => {
    setNewTaskColumn(column);
    setNewTitle("");
    setNewPriority("medium");
    setNewAssigneeId(meInTeam && currentUserId ? currentUserId : "");
    setNewDueDate("");
    setNewDescription("");
    setShowNewTaskModal(true);
  };

  const onCardStatusChange = useCallback(
    (taskId: string, newStatus: string, opts?: { statusComment?: string }) => {
      if (opts?.statusComment) {
        void handleStatusChange(taskId, newStatus, opts);
        return;
      }
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      if (
        transitionRequiresStatusComment(
          task.status as KanbanTaskStatus,
          newStatus as KanbanTaskStatus
        )
      ) {
        setStatusCommentFlow({ taskId, newStatus: newStatus as KanbanTaskStatus });
        setStatusCommentDraft("");
        return;
      }
      void handleStatusChange(taskId, newStatus);
    },
    [tasks, handleStatusChange]
  );

  const submitStatusCommentFlow = () => {
    if (!statusCommentFlow) return;
    const c = statusCommentDraft.trim();
    if (!c) {
      toast.error(WORKSPACE.toastStatusCommentRequired);
      return;
    }
    void handleStatusChange(statusCommentFlow.taskId, statusCommentFlow.newStatus, {
      statusComment: c.slice(0, 4000),
    });
    setStatusCommentFlow(null);
    setStatusCommentDraft("");
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      toast.error(WORKSPACE.toastTitleRequired);
      return;
    }
    const assigneeOk =
      newAssigneeId && newAssigneeId.trim() && !newAssigneeId.startsWith("__role_");
    if (!assigneeOk) {
      toast.error(WORKSPACE.toastRequestedNeedsAssigneeAndDueDate);
      return;
    }

    let dueForApi = supportsDueDate && newDueDate.trim() ? newDueDate.trim() : "";
    if (!dueForApi) {
      dueForApi = new Date().toISOString().slice(0, 10);
    }

    setIsSubmitting(true);

    const body: Record<string, unknown> = {
      title: newTitle.trim(),
      category: "GENERAL",
      priority: newPriority,
      status: "requested",
      assignee_id: newAssigneeId.trim(),
      due_date: dueForApi,
    };
    if (supportsSortOrder) {
      body.sort_order = nextSortOrderInColumn(tasks, "requested");
    }
    if (supportsDescription) {
      const d = newDescription.trim();
      body.description = d.length === 0 ? null : d.slice(0, 8000);
    }

    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as {
      task?: Record<string, unknown>;
      error?: string;
    };

    setIsSubmitting(false);
    setShowNewTaskModal(false);

    if (!res.ok) {
      console.error("[KanbanTasksBoard] 업무 등록 실패:", json.error ?? res.status);
      toast.error(
        json.error
          ? `${WORKSPACE.toastTaskCreateFailedPrefix} (${json.error})`
          : WORKSPACE.toastTaskCreateFailedPrefix
      );
      return;
    }

    const inserted = json.task;
    if (!inserted?.id) {
      toast.error(WORKSPACE.toastTaskCreateFailedPrefix);
      return;
    }

    const supabase = createClient();

    const assignee = newAssigneeId
      ? teamMembers.find((m) => m.id === newAssigneeId)
      : null;
    const insertedRow = inserted as {
      id: string;
      sort_order?: number;
      priority?: string;
      due_date?: string | null;
      description?: string | null;
      requested_by?: string | null;
      status?: string;
    };
    setTasks((prev) =>
      sortTasksForBoard([
        ...prev,
        {
          ...inserted,
          id: insertedRow.id,
          priority: insertedRow.priority ?? "medium",
          status: insertedRow.status ?? "requested",
          due_date: supportsDueDate ? (insertedRow.due_date ?? null) : null,
          sort_order: supportsSortOrder ? (insertedRow.sort_order ?? 0) : 0,
          description: supportsDescription
            ? (insertedRow.description ??
              (newDescription.trim() ? newDescription.trim().slice(0, 8000) : null))
            : undefined,
          requested_by: insertedRow.requested_by ?? currentUserId ?? undefined,
          assignee: assignee
            ? { fullName: assignee.fullName, avatarUrl: assignee.avatarUrl }
            : null,
        } as KanbanTaskWithAssignee,
      ])
    );

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
    setEditDueDate(supportsDueDate && task.due_date ? task.due_date.slice(0, 10) : "");
    setEditDescription(supportsDescription ? (task.description ?? "") : "");
    setEditStatus((task.status as KanbanTaskStatus) ?? "requested");
    setEditStatusComment("");
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editTitle.trim()) return;

    const needsComment =
      editStatus !== editingTask.status &&
      transitionRequiresStatusComment(
        editingTask.status as KanbanTaskStatus,
        editStatus
      );
    if (needsComment && !editStatusComment.trim()) {
      toast.error(WORKSPACE.toastStatusCommentRequired);
      return;
    }

    setIsSubmitting(true);
    const editAssigneeDbValue =
      editAssigneeId && !editAssigneeId.startsWith("__role_") ? editAssigneeId : null;

    try {
      await commitTaskUpdate(editingTask.id, {
        title: editTitle.trim(),
        priority: editPriority,
        assignee_id: editAssigneeDbValue,
        status: editStatus,
        due_date: supportsDueDate ? editDueDate || null : null,
        ...(supportsDescription
          ? {
              description: editDescription.trim()
                ? editDescription.trim().slice(0, 8000)
                : null,
            }
          : {}),
        ...(needsComment
          ? { statusComment: editStatusComment.trim().slice(0, 4000) }
          : {}),
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

  const currentMember =
    currentUserId && teamMembers.length > 0
      ? teamMembers.find((m) => m.id === currentUserId) ?? null
      : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KanbanBoardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentMember={currentMember}
      />

      {tasks.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="flex min-h-[50vh] flex-1 items-center justify-center p-4 sm:p-8">
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
                {
                  label: WORKSPACE.taskCreateFirst,
                  onClick: () => openNewTaskModal("requested"),
                  primary: true,
                },
              ]}
            />
          </div>
        </div>
      ) : (
        <KanbanColumns
          projectId={projectId}
          columns={columns}
          wikisByColumn={wikisByColumn}
          teamMembers={teamMembers}
          teamLeaderId={teamLeaderId}
          currentUserId={currentUserId}
          onStatusChange={onCardStatusChange}
          onAssigneeChange={handleAssigneeChange}
          onEdit={openEditModal}
          onAddTask={openNewTaskModal}
          dragEnabled={dragEnabled}
          onDragStart={handleDragStart}
          onDragEndReorder={supportsSortOrder ? handleDragEndReorder : undefined}
        />
      )}

      <KanbanTaskCreateModal
        open={showNewTaskModal}
        onClose={() => setShowNewTaskModal(false)}
        newTaskColumn={newTaskColumn}
        newTitle={newTitle}
        onNewTitleChange={setNewTitle}
        newPriority={newPriority}
        onNewPriorityChange={setNewPriority}
        newAssigneeId={newAssigneeId}
        onNewAssigneeIdChange={setNewAssigneeId}
        newDueDate={newDueDate}
        onNewDueDateChange={setNewDueDate}
        assigneeOptions={assigneeOptions}
        supportsDueDate={supportsDueDate}
        supportsDescription={supportsDescription}
        newDescription={newDescription}
        onNewDescriptionChange={setNewDescription}
        isSubmitting={isSubmitting}
        onSubmit={handleCreateTask}
      />

      <KanbanTaskEditModal
        projectId={projectId}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        editTitle={editTitle}
        onEditTitleChange={setEditTitle}
        editPriority={editPriority}
        onEditPriorityChange={setEditPriority}
        editStatus={editStatus}
        onEditStatusChange={setEditStatus}
        editAssigneeId={editAssigneeId}
        onEditAssigneeIdChange={setEditAssigneeId}
        editDueDate={editDueDate}
        onEditDueDateChange={setEditDueDate}
        editDescription={editDescription}
        onEditDescriptionChange={setEditDescription}
        editStatusComment={editStatusComment}
        onEditStatusCommentChange={setEditStatusComment}
        assigneeOptions={assigneeOptions}
        supportsDueDate={supportsDueDate}
        supportsDescription={supportsDescription}
        currentUserId={currentUserId}
        teamLeaderId={teamLeaderId}
        isSubmitting={isSubmitting}
        onSave={handleUpdateTask}
      />

      {statusCommentFlow ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-comment-title"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="status-comment-title" className="text-lg font-semibold text-gray-900">
              {WORKSPACE.taskStatusCommentModalTitle}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {KANBAN_STATUS_OPTIONS.find((o) => o.value === statusCommentFlow.newStatus)?.label ??
                statusCommentFlow.newStatus}
            </p>
            <label className="mt-4 block text-sm font-medium text-gray-700">
              {WORKSPACE.taskStatusCommentLabel}
            </label>
            <textarea
              value={statusCommentDraft}
              onChange={(e) => setStatusCommentDraft(e.target.value)}
              placeholder={WORKSPACE.taskStatusCommentPlaceholder}
              rows={4}
              maxLength={4000}
              className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setStatusCommentFlow(null);
                  setStatusCommentDraft("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {COMMON.cancel}
              </button>
              <button
                type="button"
                onClick={submitStatusCommentFlow}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
              >
                {COMMON.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
