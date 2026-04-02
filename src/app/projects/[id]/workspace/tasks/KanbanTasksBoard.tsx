"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
import { nextSortOrderInColumn, sortTasksForBoard } from "@/lib/kanban/task-order";
import { WORKSPACE } from "@/lib/constants/contents";
import type { KanbanTaskWithAssignee, KanbanTeamMember } from "@/types/kanban";

interface KanbanTasksBoardProps {
  projectId: string;
  projectTitle: string;
  initialTasks: KanbanTaskWithAssignee[];
  teamMembers: KanbanTeamMember[];
  currentUserId: string | null;
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
  recruitmentRoles = [],
  supportsDueDate,
  supportsSortOrder,
  supportsDescription,
}: KanbanTasksBoardProps) {
  const router = useRouter();
  const dragRollbackRef = useRef<KanbanTaskWithAssignee[]>([]);
  const { tasks, setTasks, handleStatusChange, handleAssigneeChange, commitTaskUpdate, reorderAfterDrag } =
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
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTaskWithAssignee | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">("medium");
  const [editAssigneeId, setEditAssigneeId] = useState<string>("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"todo" | "doing" | "done">("todo");

  const meInTeam = Boolean(currentUserId && teamMembers.some((m) => m.id === currentUserId));

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

  const todoTasks = filteredTasks.filter((t) => t.status === "todo");
  const doingTasks = filteredTasks.filter((t) => t.status === "doing");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");

  const dragEnabled = supportsSortOrder && !searchQuery.trim();

  const handleDragStart = useCallback(() => {
    dragRollbackRef.current = [...tasks];
  }, [tasks]);

  const handleDragEndReorder = useCallback(
    (next: KanbanTaskWithAssignee[]) => {
      void reorderAfterDrag(next, dragRollbackRef.current);
    },
    [reorderAfterDrag]
  );

  const openNewTaskModal = (column: "todo" | "doing" | "done") => {
    setNewTaskColumn(column);
    setNewTitle("");
    setNewPriority("medium");
    setNewAssigneeId(meInTeam && currentUserId ? currentUserId : "");
    setNewDueDate("");
    setNewDescription("");
    setShowNewTaskModal(true);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      toast.error(WORKSPACE.toastTitleRequired);
      return;
    }
    setIsSubmitting(true);

    const body: Record<string, unknown> = {
      title: newTitle.trim(),
      category: "GENERAL",
      priority: newPriority,
      status: newTaskColumn,
      assignee_id:
        newAssigneeId && newAssigneeId.trim() && !newAssigneeId.startsWith("__role_")
          ? newAssigneeId.trim()
          : null,
    };
    if (supportsSortOrder) {
      body.sort_order = nextSortOrderInColumn(tasks, newTaskColumn);
    }
    if (supportsDueDate && newDueDate.trim()) {
      body.due_date = newDueDate.trim();
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
    };
    setTasks((prev) =>
      sortTasksForBoard([
        ...prev,
        {
          ...inserted,
          id: insertedRow.id,
          priority: insertedRow.priority ?? "medium",
          due_date: supportsDueDate ? (insertedRow.due_date ?? null) : null,
          sort_order: supportsSortOrder ? (insertedRow.sort_order ?? 0) : 0,
          description: supportsDescription
            ? (insertedRow.description ?? (newDescription.trim() ? newDescription.trim().slice(0, 8000) : null))
            : undefined,
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
        due_date: supportsDueDate ? editDueDate || null : null,
        ...(supportsDescription
          ? {
              description: editDescription.trim()
                ? editDescription.trim().slice(0, 8000)
                : null,
            }
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
                  onClick: () => openNewTaskModal("todo"),
                  primary: true,
                },
              ]}
            />
          </div>
        </div>
      ) : (
        <KanbanColumns
          columns={columns}
          teamMembers={teamMembers}
          onStatusChange={handleStatusChange}
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
        assigneeOptions={assigneeOptions}
        supportsDueDate={supportsDueDate}
        supportsDescription={supportsDescription}
        isSubmitting={isSubmitting}
        onSave={handleUpdateTask}
      />
    </div>
  );
}
