"use client";

import { useState } from "react";
import type { KanbanTaskWithAssignee, KanbanTeamMember } from "@/types/kanban";
import { PRIORITY_STYLES, KANBAN_STATUS_OPTIONS, formatKanbanDueDate } from "@/lib/kanban/constants";
import { WORKSPACE } from "@/lib/constants/contents";

export interface TaskCardProps {
  task: KanbanTaskWithAssignee;
  teamMembers: KanbanTeamMember[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onAssigneeChange: (taskId: string, assigneeId: string | null) => void;
  onEdit: (task: KanbanTaskWithAssignee) => void;
}

function priorityLabel(p: string): string {
  if (p === "high") return WORKSPACE.priorityHigh;
  if (p === "low") return WORKSPACE.priorityLow;
  return WORKSPACE.priorityMedium;
}

export default function TaskCard({
  task,
  teamMembers,
  onStatusChange,
  onAssigneeChange,
  onEdit,
}: TaskCardProps) {
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
          className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${
            PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium
          }`}
        >
          {priorityLabel(task.priority)}
        </span>
        <div className="relative min-w-0 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setIsAssigneeOpen(false);
              setIsStatusOpen((o) => !o);
            }}
            className="whitespace-nowrap rounded px-1.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
          >
            {WORKSPACE.statusChange} ▾
          </button>
          {isStatusOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setIsStatusOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {KANBAN_STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onStatusChange(task.id, opt.value);
                      setIsStatusOpen(false);
                    }}
                    className={`block w-full whitespace-nowrap px-3 py-2 text-left text-sm hover:bg-gray-50 ${
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
        <p className="mt-1 text-xs text-gray-500">{formatKanbanDueDate(task.due_date)}</p>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span className="flex min-w-0 items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="truncate">0</span>
        </span>
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              setIsStatusOpen(false);
              setIsAssigneeOpen((o) => !o);
            }}
            className="flex items-center gap-1 rounded-full hover:ring-2 hover:ring-gray-200"
            aria-label={WORKSPACE.taskAssigneeLabel}
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
                  className="block w-full whitespace-nowrap px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50"
                >
                  {WORKSPACE.assigneeNone}
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
                      <img src={m.avatarUrl} alt="" className="h-5 w-5 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-600 text-[9px] font-medium text-white">
                        {(m.fullName?.[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                    <span className="min-w-0 truncate">{m.fullName ?? WORKSPACE.memberFallback}</span>
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
