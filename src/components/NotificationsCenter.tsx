"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NotificationItem from "@/components/NotificationItem";
import { runAiProjectRecommendationsAction } from "@/app/actions/recommendations";
import type { NotificationListItem } from "@/types/notifications";
import EmptyState from "@/components/EmptyState";

export default function NotificationsCenter() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "ai">("all");
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const load = async (uid: string) => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, user_id, title, message, link, read, created_at, is_ai_recommendation, ai_comment, source_project_id"
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setItems([]);
      setLoading(false);
      return;
    }
    setItems((data as NotificationListItem[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    void load(userId);
  }, [userId]);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("notifications").update({ read: true }).eq("id", id);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleClick = (n: NotificationListItem) => {
    void markAsRead(n.id);
    if (n.link) {
      router.push(n.link);
    }
  };

  const filtered = tab === "ai" ? items.filter((n) => n.is_ai_recommendation) : items;

  const runAiRefresh = () => {
    setActionMessage(null);
    startTransition(async () => {
      const res = await runAiProjectRecommendationsAction();
      if (res.ok) {
        setActionMessage(
          res.created > 0
            ? `AI 추천 알림 ${res.created}건을 생성했습니다.`
            : res.skipped || "새로운 추천이 없습니다."
        );
        if (userId) await load(userId);
      } else {
        setActionMessage(res.error);
      }
    });
  };

  if (!userId) {
    return (
      <p className="mt-6 text-center text-sm text-gray-600">
        로그인 후 알림을 확인할 수 있습니다.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "all" ? "bg-[#2563EB] text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            전체
          </button>
          <button
            type="button"
            onClick={() => setTab("ai")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "ai" ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            AI 추천
          </button>
        </div>

        <button
          type="button"
          disabled={pending}
          onClick={runAiRefresh}
          className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 transition-colors hover:bg-violet-100 disabled:opacity-60"
        >
          {pending ? "분석 중…" : "AI 매칭 새로고침"}
        </button>
      </div>

      {actionMessage && (
        <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {actionMessage}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-gray-500">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="px-4 py-10">
            <EmptyState
              compact
              title={tab === "ai" ? "AI 추천 알림이 없습니다" : "알림이 없습니다"}
              description={
                tab === "ai"
                  ? "위 버튼으로 맞춤 추천을 받아 보세요."
                  : "새 활동이 생기면 여기에 표시됩니다."
              }
              textOnly
            />
          </div>
        ) : (
          filtered.map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              onClick={() => handleClick(n)}
              onDismiss={() => void markAsRead(n.id)}
              showDismissDot={false}
            />
          ))
        )}
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        AI 추천은 프로필의 <strong>대표 스택(primary_stack)</strong> 또는 기술 스택 첫 항목과 공개
        프로젝트의 모집 포지션을 비교해 생성됩니다.
      </p>
    </div>
  );
}
