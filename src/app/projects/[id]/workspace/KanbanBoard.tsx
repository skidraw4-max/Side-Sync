"use client";

interface Assignee {
  fullName: string | null;
  avatarUrl: string | null;
}

interface TaskWithAssignee {
  id: string;
  title: string;
  category: string;
  status: string;
  assignee_id: string | null;
  due_date: string | null;
  assignee: Assignee | null;
}

interface KanbanBoardProps {
  projectId: string;
  todoTasks: TaskWithAssignee[];
  doingTasks: TaskWithAssignee[];
  doneTasks: TaskWithAssignee[];
  categoryColors: Record<string, string>;
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TaskCard({
  task,
  categoryColor,
  showDone,
}: {
  task: TaskWithAssignee;
  categoryColor: string;
  showDone?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        task.status === "doing"
          ? "border-l-4 border-l-[#2563EB]"
          : "border-gray-100"
      }`}
    >
      <span
        className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
          categoryColor
        }`}
      >
        {task.category}
      </span>
      <p className="mt-3 text-sm font-medium text-gray-900">{task.title}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span>{formatDueDate(task.due_date)}</span>
          )}
          {task.status === "doing" && (
            <span className="text-gray-600">In Progress</span>
          )}
          {showDone && (
            <span className="flex items-center gap-1 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Done
            </span>
          )}
        </div>
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
          <div className="h-6 w-6 rounded-full bg-gray-200" />
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({
  projectId,
  todoTasks,
  doingTasks,
  doneTasks,
  categoryColors,
}: KanbanBoardProps) {
  const columns = [
    {
      id: "todo",
      title: "TO-DO",
      count: todoTasks.length,
      tasks: todoTasks,
      showDone: false,
    },
    {
      id: "doing",
      title: "DOING",
      count: doingTasks.length,
      tasks: doingTasks,
      showDone: false,
    },
    {
      id: "done",
      title: "DONE",
      count: doneTasks.length,
      tasks: doneTasks,
      showDone: true,
    },
  ];

  return (
    <div className="mt-6 flex gap-6">
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex w-80 shrink-0 flex-col rounded-xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{col.title}</h2>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                {col.count}
              </span>
              <button
                type="button"
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="옵션"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="6" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="18" r="1.5" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {col.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                categoryColor={categoryColors[task.category] ?? categoryColors.GENERAL}
                showDone={col.showDone}
              />
            ))}
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors"
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
  );
}
