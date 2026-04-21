"use client";

import type { CSSProperties } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
  type DragStart,
} from "@hello-pangea/dnd";
import TaskCard from "@/components/workspace/TaskCard";
import KanbanWikiList from "@/components/workspace/KanbanWikiList";
import { WORKSPACE } from "@/lib/constants/contents";
import type { KanbanTaskStatus } from "@/lib/kanban/constants";
import { KANBAN_STATUS_HEADER_CLASS } from "@/lib/kanban/constants";
import { mergeColumnsToTasks } from "@/lib/kanban/task-order";
import type {
  KanbanColumnWikiItem,
  KanbanTaskWithAssignee,
  KanbanTeamMember,
} from "@/types/kanban";

export type KanbanColumnModel = {
  id: KanbanTaskStatus;
  title: string;
  tasks: KanbanTaskWithAssignee[];
};

interface KanbanColumnsProps {
  projectId: string;
  columns: KanbanColumnModel[];
  /** 컬럼 id → 해당 단계(associated_status)의 위키 목록 */
  wikisByColumn: Record<KanbanTaskStatus, KanbanColumnWikiItem[]>;
  teamMembers: KanbanTeamMember[];
  teamLeaderId: string | null;
  currentUserId: string | null;
  onStatusChange: (taskId: string, newStatus: string, opts?: { statusComment?: string }) => void;
  onAssigneeChange: (taskId: string, assigneeId: string | null) => void;
  onEdit: (task: KanbanTaskWithAssignee) => void;
  onAddTask: (column: KanbanTaskStatus) => void;
  dragEnabled: boolean;
  onDragStart?: () => void;
  onDragEndReorder?: (nextTasks: KanbanTaskWithAssignee[]) => void;
}

function columnTaskList(
  col: KanbanColumnModel,
  teamMembers: KanbanTeamMember[],
  teamLeaderId: string | null,
  currentUserId: string | null,
  onStatusChange: KanbanColumnsProps["onStatusChange"],
  onAssigneeChange: KanbanColumnsProps["onAssigneeChange"],
  onEdit: KanbanColumnsProps["onEdit"],
  dragEnabled: boolean
) {
  return col.tasks.map((task, index) =>
    dragEnabled ? (
      <Draggable key={task.id} draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={snapshot.isDragging ? "rounded-xl shadow-lg ring-2 ring-[#2563EB]/30" : ""}
          >
            <TaskCard
              task={task}
              teamMembers={teamMembers}
              teamLeaderId={teamLeaderId}
              currentUserId={currentUserId}
              onStatusChange={onStatusChange}
              onAssigneeChange={onAssigneeChange}
              onEdit={onEdit}
              dragHandleProps={provided.dragHandleProps}
            />
          </div>
        )}
      </Draggable>
    ) : (
      <TaskCard
        key={task.id}
        task={task}
        teamMembers={teamMembers}
        teamLeaderId={teamLeaderId}
        currentUserId={currentUserId}
        onStatusChange={onStatusChange}
        onAssigneeChange={onAssigneeChange}
        onEdit={onEdit}
      />
    )
  );
}

function columnAddButton(
  colId: KanbanTaskStatus,
  onAddTask: KanbanColumnsProps["onAddTask"]
) {
  return (
    <button
      type="button"
      onClick={() => onAddTask(colId)}
      className="mt-4 flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border-2 border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-600"
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
  );
}

export default function KanbanColumns({
  projectId,
  columns,
  wikisByColumn,
  teamMembers,
  teamLeaderId,
  currentUserId,
  onStatusChange,
  onAssigneeChange,
  onEdit,
  onAddTask,
  dragEnabled,
  onDragStart,
  onDragEndReorder,
}: KanbanColumnsProps) {
  const handleDragStart = (_start: DragStart) => {
    if (!dragEnabled) return;
    onDragStart?.();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!dragEnabled || !onDragEndReorder) return;
    const { destination, source } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceCol = source.droppableId as KanbanTaskStatus;
    const destCol = destination.droppableId as KanbanTaskStatus;

    const cols: Record<KanbanTaskStatus, KanbanTaskWithAssignee[]> = {
      requested: [...(columns.find((c) => c.id === "requested")?.tasks ?? [])],
      in_progress: [...(columns.find((c) => c.id === "in_progress")?.tasks ?? [])],
      feedback: [...(columns.find((c) => c.id === "feedback")?.tasks ?? [])],
      completed: [...(columns.find((c) => c.id === "completed")?.tasks ?? [])],
      on_hold: [...(columns.find((c) => c.id === "on_hold")?.tasks ?? [])],
    };

    const [removed] = cols[sourceCol].splice(source.index, 1);
    if (!removed) return;
    cols[destCol].splice(destination.index, 0, { ...removed, status: destCol });

    const next = mergeColumnsToTasks(cols);
    onDragEndReorder(next);
  };

  const inner = (
    <div className="flex min-w-max gap-4 sm:gap-6">
      {columns.map((col) => (
        <div key={col.id} className="flex w-72 shrink-0 flex-col sm:w-80">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={`truncate rounded-full px-2.5 py-0.5 text-sm font-semibold ${KANBAN_STATUS_HEADER_CLASS[col.id]}`}
              >
                {col.title}
              </span>
              <span className="flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-gray-200 px-2 text-xs font-medium text-gray-600">
                {col.tasks.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onAddTask(col.id)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
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
          {dragEnabled ? (
            <>
              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex min-h-[120px] flex-col gap-4"
                  >
                    {columnTaskList(
                      col,
                      teamMembers,
                      teamLeaderId,
                      currentUserId,
                      onStatusChange,
                      onAssigneeChange,
                      onEdit,
                      true
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              {columnAddButton(col.id, onAddTask)}
              <KanbanWikiList projectId={projectId} items={wikisByColumn[col.id] ?? []} />
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {columnTaskList(
                col,
                teamMembers,
                teamLeaderId,
                currentUserId,
                onStatusChange,
                onAssigneeChange,
                onEdit,
                false
              )}
              {columnAddButton(col.id, onAddTask)}
              <KanbanWikiList projectId={projectId} items={wikisByColumn[col.id] ?? []} />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div
      className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-8 overscroll-contain touch-pan-y"
      style={{ WebkitOverflowScrolling: "touch" } as CSSProperties}
    >
      {dragEnabled ? (
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {inner}
        </DragDropContext>
      ) : (
        inner
      )}
    </div>
  );
}
