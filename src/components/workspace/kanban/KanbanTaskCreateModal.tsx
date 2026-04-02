import { COMMON, WORKSPACE } from "@/lib/constants/contents";
import { KANBAN_STATUS_OPTIONS } from "@/lib/kanban/constants";
import type { KanbanAssigneeOption } from "@/lib/kanban/build-assignee-options";

interface KanbanTaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  newTaskColumn: "todo" | "doing" | "done";
  newTitle: string;
  onNewTitleChange: (v: string) => void;
  newPriority: "high" | "medium" | "low";
  onNewPriorityChange: (v: "high" | "medium" | "low") => void;
  newAssigneeId: string;
  onNewAssigneeIdChange: (v: string) => void;
  newDueDate: string;
  onNewDueDateChange: (v: string) => void;
  assigneeOptions: KanbanAssigneeOption[];
  supportsDueDate: boolean;
  supportsDescription: boolean;
  newDescription: string;
  onNewDescriptionChange: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function KanbanTaskCreateModal({
  open,
  onClose,
  newTaskColumn,
  newTitle,
  onNewTitleChange,
  newPriority,
  onNewPriorityChange,
  newAssigneeId,
  onNewAssigneeIdChange,
  newDueDate,
  onNewDueDateChange,
  assigneeOptions,
  supportsDueDate,
  supportsDescription,
  newDescription,
  onNewDescriptionChange,
  isSubmitting,
  onSubmit,
}: KanbanTaskCreateModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className={`w-full rounded-xl bg-white p-6 shadow-xl ${supportsDescription ? "max-w-lg" : "max-w-md"}`}
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
              onChange={(e) => onNewTitleChange(e.target.value)}
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
              onChange={(e) => onNewPriorityChange(e.target.value as "high" | "medium" | "low")}
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
              onChange={(e) => onNewAssigneeIdChange(e.target.value)}
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
                value={newDueDate}
                onChange={(e) => onNewDueDateChange(e.target.value)}
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
                value={newDescription}
                onChange={(e) => onNewDescriptionChange(e.target.value)}
                placeholder={WORKSPACE.taskDescriptionPlaceholder}
                rows={4}
                maxLength={8000}
                className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ) : null}
          <p className="text-xs text-gray-500">
            {WORKSPACE.taskColumnHintPrefix}:{" "}
            {KANBAN_STATUS_OPTIONS.find((o) => o.value === newTaskColumn)?.label ??
              newTaskColumn}
          </p>
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
            onClick={onSubmit}
            disabled={!newTitle.trim() || isSubmitting}
            className="whitespace-nowrap rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {isSubmitting ? WORKSPACE.taskRegistering : COMMON.register}
          </button>
        </div>
      </div>
    </div>
  );
}
