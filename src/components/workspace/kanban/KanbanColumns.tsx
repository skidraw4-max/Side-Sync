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
import { WORKSPACE } from "@/lib/constants/contents";
import { mergeColumnsToTasks } from "@/lib/kanban/task-order";
import type { KanbanTaskWithAssignee, KanbanTeamMember } from "@/types/kanban";

export type KanbanColumnModel = {
  id: "todo" | "doing" | "done";
  title: string;
  tasks: KanbanTaskWithAssignee[];
};

interface KanbanColumnsProps {
  columns: KanbanColumnModel[];
  teamMembers: KanbanTeamMember[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onAssigneeChange: (taskId: string, assigneeId: string | null) => void;
  onEdit: (task: KanbanTaskWithAssignee) => void;
  onAddTask: (column: "todo" | "doing" | "done") => void;
  dragEnabled: boolean;
  onDragStart?: () => void;
  onDragEndReorder?: (nextTasks: KanbanTaskWithAssignee[]) => void;
}

function columnTaskList(
  col: KanbanColumnModel,
  teamMembers: KanbanTeamMember[],
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
        onStatusChange={onStatusChange}
        onAssigneeChange={onAssigneeChange}
        onEdit={onEdit}
      />
    )
  );
}

function columnAddButton(
  colId: "todo" | "doing" | "done",
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
  columns,
  teamMembers,
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

    const sourceCol = source.droppableId as "todo" | "doing" | "done";
    const destCol = destination.droppableId as "todo" | "doing" | "done";

    const cols = {
      todo: [...(columns.find((c) => c.id === "todo")?.tasks ?? [])],
      doing: [...(columns.find((c) => c.id === "doing")?.tasks ?? [])],
      done: [...(columns.find((c) => c.id === "done")?.tasks ?? [])],
    };

    const [removed] = cols[sourceCol].splice(source.index, 1);
    if (!removed) return;
    cols[destCol].splice(destination.index, 0, { ...removed, status: destCol });

    const next = mergeColumnsToTasks(cols.todo, cols.doing, cols.done);
    onDragEndReorder(next);
  };

  const inner = (
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
              onClick={() => onAddTask(col.id)}
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
            </>
          ) : (
            <div className="flex flex-col gap-4">
              {columnTaskList(
                col,
                teamMembers,
                onStatusChange,
                onAssigneeChange,
                onEdit,
                false
              )}
              {columnAddButton(col.id, onAddTask)}
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
