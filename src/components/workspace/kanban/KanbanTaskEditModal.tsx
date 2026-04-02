import { COMMON, WORKSPACE } from "@/lib/constants/contents";
import { KANBAN_STATUS_OPTIONS } from "@/lib/kanban/constants";
import type { KanbanAssigneeOption } from "@/lib/kanban/build-assignee-options";
import type { KanbanTaskWithAssignee } from "@/types/kanban";

interface KanbanTaskEditModalProps {
  task: KanbanTaskWithAssignee | null;
  onClose: () => void;
  editTitle: string;
  onEditTitleChange: (v: string) => void;
  editPriority: "high" | "medium" | "low";
  onEditPriorityChange: (v: "high" | "medium" | "low") => void;
  editStatus: "todo" | "doing" | "done";
  onEditStatusChange: (v: "todo" | "doing" | "done") => void;
  editAssigneeId: string;
  onEditAssigneeIdChange: (v: string) => void;
  editDueDate: string;
  onEditDueDateChange: (v: string) => void;
  editDescription: string;
  onEditDescriptionChange: (v: string) => void;
  assigneeOptions: KanbanAssigneeOption[];
  supportsDueDate: boolean;
  supportsDescription: boolean;
  isSubmitting: boolean;
  onSave: () => void;
}

export default function KanbanTaskEditModal({
  task,
  onClose,
  editTitle,
  onEditTitleChange,
  editPriority,
  onEditPriorityChange,
  editStatus,
  onEditStatusChange,
  editAssigneeId,
  onEditAssigneeIdChange,
  editDueDate,
  onEditDueDateChange,
  editDescription,
  onEditDescriptionChange,
  assigneeOptions,
  supportsDueDate,
  supportsDescription,
  isSubmitting,
  onSave,
}: KanbanTaskEditModalProps) {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className={`w-full rounded-xl bg-white p-6 shadow-xl ${supportsDescription ? "max-w-lg" : "max-w-md"}`}
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
              onChange={(e) => onEditTitleChange(e.target.value)}
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
              onChange={(e) => onEditPriorityChange(e.target.value as "high" | "medium" | "low")}
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
              onChange={(e) => onEditStatusChange(e.target.value as "todo" | "doing" | "done")}
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
              onChange={(e) => onEditAssigneeIdChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {assigneeOptions.map((opt) => (
                <option key={opt.value || "__empty"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {supportsDueDate ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {WORKSPACE.taskDueDateLabel}
              </label>
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => onEditDueDateChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : null}
          {supportsDescription ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {WORKSPACE.taskDescriptionLabel}
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => onEditDescriptionChange(e.target.value)}
                placeholder={WORKSPACE.taskDescriptionPlaceholder}
                rows={4}
                maxLength={8000}
                className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="whitespace-nowrap rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {COMMON.cancel}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!editTitle.trim() || isSubmitting}
            className="whitespace-nowrap rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {isSubmitting ? WORKSPACE.taskSaving : COMMON.save}
          </button>
        </div>
      </div>
    </div>
  );
}
