"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { shouldEnableSupabaseRealtimeSubscriptions } from "@/lib/supabase/realtime-flags";
import { fetchNotificationsForUser } from "@/lib/supabase-notification-query";
import EmptyState from "@/components/EmptyState";
import NotificationItem from "@/components/NotificationItem";
import type { NotificationListItem } from "@/types/notifications";

export default function NotificationDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
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

    const load = async () => {
      const { items, error } = await fetchNotificationsForUser(supabase, userId, { limit: 20 });
      if (error && process.env.NODE_ENV === "development") {
        console.warn("[NotificationDropdown] fetch:", error.message);
      }
      setNotifications(items);
    };

    void load();

    if (!shouldEnableSupabaseRealtimeSubscriptions()) {
      return;
    }

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
          const row = payload.new as NotificationListItem;
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
          const row = payload.new as NotificationListItem;
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

  /** Realtime 미사용 시 드롭다운을 열 때마다 최신 목록 갱신 */
  useEffect(() => {
    if (!userId || !isOpen || shouldEnableSupabaseRealtimeSubscriptions()) return;
    const supabase = createClient();
    void (async () => {
      const { items } = await fetchNotificationsForUser(supabase, userId, { limit: 20 });
      setNotifications(items);
    })();
  }, [userId, isOpen]);

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
    await (supabase as any).from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    const supabase = createClient();
    await (supabase as any).from("notifications").update({ read: true }).eq("user_id", userId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (n: NotificationListItem) => {
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

  // userId 비동기 로드 전에도 동일한 너비를 유지해 헤더 메뉴가 밀리지 않도록 함
  if (!userId) {
    return (
      <div
        className="h-9 w-9 shrink-0 rounded-full bg-gray-100 animate-pulse"
        aria-hidden
        aria-busy="true"
      />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
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

