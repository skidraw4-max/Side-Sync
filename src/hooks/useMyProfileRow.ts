"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { coerceMannerTempFromDb, resolveMannerTempForProfile } from "@/lib/manner-temp-coerce";

/** 마이페이지·평가 후 무효화 시 동일 키 사용 */
export const MY_PROFILE_ROW_QUERY_KEY = "my-profile-row" as const;

/**
 * true로 두면 profiles Realtime 구독 후 invalidate — 환경/네트워크에 따라 이슈 시 false 유지.
 * (무한 로딩·구독 이슈 시 우선 false)
 */
const PROFILE_REALTIME_ENABLED = false;

const PROFILE_FETCH_TIMEOUT_MS = 25_000;
const MILESTONE_COUNT_TIMEOUT_MS = 15_000;

/**
 * 마이그레이션 전 DB·컬럼 누락 시 400 방지 — 앞쪽이 최신 스키마, 뒤로 갈수록 최소 컬럼, 마지막 `*`.
 */
const PROFILE_SELECT_VARIANTS = [
  "full_name, avatar_url, role, occupation, manner_temp, manner_temp_target, success_rate, badges",
  "full_name, avatar_url, role, manner_temp, manner_temp_target, success_rate, badges",
  "full_name, avatar_url, manner_temp, manner_temp_target, success_rate, badges",
  "full_name, avatar_url, manner_temp, manner_temp_target, success_rate",
  "full_name, avatar_url, manner_temp, manner_temp_target",
  "*",
] as const;

export type MyProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  occupation: string | null;
  manner_temp: unknown;
  manner_temp_target: string | null;
  success_rate: string | null;
  badges: string[];
};

export type MyProfileBundle = {
  row: MyProfileRow | null;
  milestoneCount: number;
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error(`${label} (${ms}ms)`));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

function isColumnOrSchemaSelectError(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("column") ||
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("pgrst204") ||
    m.includes("could not find")
  );
}

/** `*` 또는 부분 select 결과를 마이페이지용 행으로 정규화 */
function normalizeProfileRow(raw: Record<string, unknown> | null | undefined): MyProfileRow | null {
  if (raw == null || typeof raw !== "object") return null;
  const badgesRaw = raw.badges;
  const stringish = (v: unknown): string | null => {
    if (v == null) return null;
    if (typeof v === "string") return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
    return String(v);
  };

  return {
    full_name: (raw.full_name as string | null | undefined) ?? null,
    avatar_url: (raw.avatar_url as string | null | undefined) ?? null,
    role: (raw.role as string | null | undefined) ?? null,
    occupation: (raw.occupation as string | null | undefined) ?? null,
    manner_temp: raw.manner_temp,
    manner_temp_target: stringish(raw.manner_temp_target),
    success_rate: stringish(raw.success_rate),
    badges: Array.isArray(badgesRaw) ? (badgesRaw as string[]) : [],
  };
}

async function fetchMyProfileRowResilient(
  supabase: ReturnType<typeof createClient>,
  uid: string
): Promise<MyProfileRow | null> {
  let lastMessage = "";

  for (const sel of PROFILE_SELECT_VARIANTS) {
    const { data, error } = await supabase.from("profiles").select(sel).eq("id", uid).maybeSingle();

    if (!error) {
      if (sel === "*") {
        return normalizeProfileRow(data as Record<string, unknown> | null);
      }
      return normalizeProfileRow(data as unknown as Record<string, unknown> | null);
    }

    lastMessage = error.message ?? String(error);
    console.warn("[useMyProfileRow] profiles select variant failed:", { sel, message: lastMessage });

    if (!isColumnOrSchemaSelectError(lastMessage)) {
      throw error;
    }
  }

  throw new Error(lastMessage || "profiles 조회 실패");
}

async function fetchMilestoneCountSafe(supabase: ReturnType<typeof createClient>, uid: string): Promise<number> {
  try {
    const countReq = supabase
      .from("manner_temp_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);

    const { count, error } = await withTimeout(
      Promise.resolve(countReq) as Promise<{ count: number | null; error: { message: string } | null }>,
      MILESTONE_COUNT_TIMEOUT_MS,
      "manner_temp_logs count 타임아웃"
    );
    if (error) {
      console.warn("[useMyProfileRow] manner_temp_logs count:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (e) {
    console.warn("[useMyProfileRow] manner_temp_logs count skipped:", e);
    return 0;
  }
}

/**
 * 마이페이지용 프로필 행 — 캐시를 짧게 두고 마운트·포커스마다 최신 조회.
 * Realtime은 기본 비활성화(PROFILE_REALTIME_ENABLED).
 */
export function useMyProfileRow(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const uid = userId ?? null;

  const query = useQuery({
    queryKey: [MY_PROFILE_ROW_QUERY_KEY, uid],
    enabled: !!uid,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    networkMode: "always",
    retry: 1,
    retryDelay: 800,
    queryFn: async (): Promise<MyProfileBundle> => {
      console.log("[DEBUG] Fetching Profile Start", { uid });
      const supabase = createClient();

      const row = await withTimeout(
        fetchMyProfileRowResilient(supabase, uid!),
        PROFILE_FETCH_TIMEOUT_MS,
        "프로필 조회 타임아웃"
      );

      const milestoneCount = await fetchMilestoneCountSafe(supabase, uid!);

      const rawMt = row?.manner_temp;
      const coerced = coerceMannerTempFromDb(rawMt);
      const resolved = resolveMannerTempForProfile(row?.manner_temp, row?.manner_temp_target);

      console.log("[DEBUG] Profile Data Received", {
        hasRow: row != null,
        success_rate: row?.success_rate ?? null,
        milestoneCount,
        manner_temp_raw: rawMt,
        manner_temp_coerced: coerced,
        manner_temp_target: row?.manner_temp_target ?? null,
        resolved_value: resolved.mannerTempValue,
      });
      console.log("[DEBUG] Current Manner Temp from DB:", resolved.mannerTempValue);

      return {
        row,
        milestoneCount,
      };
    },
  });

  useEffect(() => {
    if (!uid || !PROFILE_REALTIME_ENABLED) return;

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`my-profile-profiles-${uid}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${uid}`,
          },
          () => {
            void queryClient.invalidateQueries({ queryKey: [MY_PROFILE_ROW_QUERY_KEY, uid] });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("[DEBUG] Realtime Subscribed", { uid, channel: `my-profile-profiles-${uid}` });
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[DEBUG] Realtime subscription status:", status, { uid });
          }
        });
    } catch (e) {
      console.warn("[DEBUG] Realtime subscribe failed (ignored):", e);
    }

    return () => {
      if (channel) {
        void supabase.removeChannel(channel);
        console.log("[DEBUG] Realtime Unsubscribed", { uid });
      }
    };
  }, [uid, queryClient]);

  return query;
}
