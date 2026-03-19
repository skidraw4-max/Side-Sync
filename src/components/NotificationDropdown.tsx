"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/EmptyState";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

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
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "task":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      );
  }
}

function inferNotificationType(title: string): string {
  if (title.includes("지원") || title.includes("Application")) return "application";
  if (title.includes("업무") || title.includes("Task") || title.includes("할당")) return "task";
  if (title.includes("합격") || title.includes("수락") || title.includes("Accepted")) return "accepted";
  if (title.includes("초대") || title.includes("Invitation")) return "invitation";
  return "default";
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id, user_id, title, message, link, read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications((data as Notification[]) ?? []);
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Notification;
          if (!row) return;
          setNotifications((prev) => [row, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Notification;
          if (!row) return;
          setNotifications((prev) =>
            prev.map((n) => (n.id === row.id ? row : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    if (n.link) {
      setIsOpen(false);
      router.push(n.link);
    }
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const newActivity = notifications.filter((n) => new Date(n.created_at) >= todayStart || !n.read);
  const earlierToday = notifications.filter((n) => new Date(n.created_at) < todayStart && n.read);

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
        aria-label="알림"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.29 13a2 2 0 0 1 3.42 0" />
        </svg>
        {hasUnread && (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500"
            aria-hidden
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[400px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-gray-900">알림</h3>
            {hasUnread && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-sm font-medium text-[#2563EB] hover:underline"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6">
                <EmptyState
                  compact
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  }
                  title="알림이 없습니다"
                  description="새로운 활동이 있으면 여기에 표시돼요."
                  textOnly
                />
              </div>
            ) : (
              <>
                {newActivity.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      새 활동
                    </p>
                  </div>
                )}
                {newActivity.map((n) => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    onClick={() => handleNotificationClick(n)}
                    onDismiss={() => markAsRead(n.id)}
                  />
                ))}

                {earlierToday.length > 0 && (
                  <div className="border-t border-gray-100 px-4 pt-3 pb-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      오늘 이전
                    </p>
                  </div>
                )}
                {earlierToday.map((n) => (
                  <NotificationItem
                    key={n.id}
                    n={n}
                    onClick={() => handleNotificationClick(n)}
                    onDismiss={() => markAsRead(n.id)}
                  />
                ))}
              </>
            )}
          </div>

          <div className="border-t border-gray-100 py-2">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block py-2 text-center text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              모든 알림 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  n,
  onClick,
  onDismiss,
}: {
  n: Notification;
  onClick: () => void;
  onDismiss: () => void;
}) {
  const type = inferNotificationType(n.title);
  const icon = getNotificationIcon(type);
  const isUnread = !n.read;

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
        <div className="absolute left-0 top-0 h-full w-0.5 bg-[#2563EB]" />
      )}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isUnread ? "bg-blue-100 text-[#2563EB]" : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{n.title}</p>
        <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">{n.message}</p>
        <p className="mt-1 text-xs text-gray-400">{formatRelativeTime(n.created_at)}</p>
      </div>
      {isUnread && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
        </div>
      )}
    </div>
  );
}
