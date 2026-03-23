"use client";

import type { NotificationListItem } from "@/types/notifications";

export type { NotificationListItem } from "@/types/notifications";

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays === 1) return "어제";
  if (diffDays < 7) return `${diffDays}일 전`;
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function getNotificationIcon(type: string) {
  const iconClass = "h-5 w-5";
  switch (type) {
    case "application":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case "task":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      );
    case "accepted":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "invitation":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      );
    case "ai":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      );
  }
}

export function inferNotificationType(n: NotificationListItem): string {
  if (n.is_ai_recommendation) return "ai";
  if (n.title.includes("지원") || n.title.includes("Application")) return "application";
  if (n.title.includes("업무") || n.title.includes("Task") || n.title.includes("할당")) return "task";
  if (n.title.includes("합격") || n.title.includes("수락") || n.title.includes("Accepted")) return "accepted";
  if (n.title.includes("초대") || n.title.includes("Invitation")) return "invitation";
  return "default";
}

export default function NotificationItem({
  n,
  onClick,
  onDismiss,
  showDismissDot = true,
}: {
  n: NotificationListItem;
  onClick: () => void;
  onDismiss: () => void;
  /** 드롭다운 등에서만 읽음 점 표시 */
  showDismissDot?: boolean;
}) {
  const type = inferNotificationType(n);
  const icon = getNotificationIcon(type);
  const isUnread = !n.read;
  const isAi = Boolean(n.is_ai_recommendation);
  const aiExtra = n.ai_comment?.trim();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`relative flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
        isUnread ? "bg-blue-50/50" : "bg-white"
      } ${n.link ? "cursor-pointer" : ""}`}
    >
      {isUnread && (
        <div className="absolute left-0 top-0 h-full w-0.5 bg-[#2563EB]" aria-hidden />
      )}
      <div className="relative shrink-0">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full ${
            isUnread ? "bg-blue-100 text-[#2563EB]" : "bg-gray-100 text-gray-500"
          }`}
        >
          {icon}
        </div>
        {isAi && (
          <span
            className="absolute -right-1 -top-1 rounded-md bg-violet-600 px-1 py-px text-[9px] font-bold leading-tight text-white shadow-sm"
            title="AI 추천"
          >
            AI ✨
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{n.title}</p>
        <p className="mt-0.5 text-sm text-gray-600 line-clamp-3">{n.message}</p>
        {aiExtra && (
          <p className="mt-2 border-l-2 border-gray-200 pl-3 text-sm leading-snug text-gray-500">{aiExtra}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(n.created_at)}</p>
      </div>
      {isUnread && showDismissDot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="h-2 w-2 rounded-full bg-[#2563EB]" aria-hidden />
        </div>
      )}
    </div>
  );
}
