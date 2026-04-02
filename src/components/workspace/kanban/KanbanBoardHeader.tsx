import { WORKSPACE } from "@/lib/constants/contents";
import type { KanbanTeamMember } from "@/types/kanban";

interface KanbanBoardHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  currentMember: KanbanTeamMember | null;
}

export default function KanbanBoardHeader({
  searchQuery,
  onSearchChange,
  currentMember,
}: KanbanBoardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-8 sm:py-4">
      <h1 className="text-xl font-bold text-gray-900">{WORKSPACE.kanbanBoardTitle}</h1>
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <input
            type="search"
            placeholder={WORKSPACE.taskSearchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
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
  );
}
