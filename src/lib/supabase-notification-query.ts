import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationListItem } from "@/types/notifications";

/** 기본 스키마(20240317000003_create_notifications.sql)에만 있는 컬럼 */
export const NOTIFICATION_COLUMNS_BASE =
  "id, user_id, title, message, link, read, created_at";

/** AI 추천 알림 확장(20260326000000_ai_recommendation_notifications.sql) */
export const NOTIFICATION_COLUMNS_WITH_AI = `${NOTIFICATION_COLUMNS_BASE}, is_ai_recommendation, ai_comment, source_project_id`;

function isLikelyMissingColumnError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  const m = (err.message ?? "").toLowerCase();
  return (
    (m.includes("column") && (m.includes("not find") || m.includes("could not find"))) ||
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    err.code === "42703"
  );
}

/** PostgREST 응답 행을 UI 타입으로 통일 (AI 컬럼 없으면 기본값) */
export function normalizeNotificationRows(rows: unknown): NotificationListItem[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      id: String(r.id),
      user_id: String(r.user_id),
      title: String(r.title ?? ""),
      message: String(r.message ?? ""),
      link: typeof r.link === "string" ? r.link : null,
      read: Boolean(r.read),
      created_at: String(r.created_at ?? ""),
      is_ai_recommendation: Boolean(r.is_ai_recommendation),
      ai_comment: typeof r.ai_comment === "string" ? r.ai_comment : null,
      source_project_id: typeof r.source_project_id === "string" ? r.source_project_id : null,
    };
  });
}

/**
 * 알림 목록 조회. AI 컬럼이 없는 DB에서는 자동으로 BASE select로 폴백 (400 방지).
 */
export async function fetchNotificationsForUser(
  supabase: SupabaseClient,
  userId: string,
  options: { limit?: number } = {}
): Promise<{ items: NotificationListItem[]; usedAiColumns: boolean; error: Error | null }> {
  const limit = options.limit ?? 100;

  const full = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS_WITH_AI)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!full.error && full.data) {
    return {
      items: normalizeNotificationRows(full.data),
      usedAiColumns: true,
      error: null,
    };
  }

  if (full.error && !isLikelyMissingColumnError(full.error)) {
    return {
      items: [],
      usedAiColumns: false,
      error: new Error(full.error.message),
    };
  }

  const base = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS_BASE)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (base.error) {
    return {
      items: [],
      usedAiColumns: false,
      error: new Error(base.error.message),
    };
  }

  return {
    items: normalizeNotificationRows(base.data),
    usedAiColumns: false,
    error: null,
  };
}
