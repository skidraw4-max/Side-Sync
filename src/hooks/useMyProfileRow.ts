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

const PROFILE_SELECT =
  "full_name, avatar_url, role, occupation, manner_temp, manner_temp_target, success_rate, badges" as const;

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

      const [profileRes, logsRes] = await withTimeout(
        Promise.all([
          supabase.from("profiles").select(PROFILE_SELECT).eq("id", uid!).maybeSingle(),
          supabase.from("manner_temp_logs").select("id", { count: "exact", head: true }).eq("user_id", uid!),
        ]),
        PROFILE_FETCH_TIMEOUT_MS,
        "프로필/마일스톤 조회 타임아웃"
      );

      if (profileRes.error) {
        console.error("[DEBUG] Profile fetch error:", profileRes.error.message);
        throw profileRes.error;
      }

      const row = profileRes.data as MyProfileRow | null;
      const rawMt = row?.manner_temp;
      const coerced = coerceMannerTempFromDb(rawMt);
      const resolved = resolveMannerTempForProfile(row?.manner_temp, row?.manner_temp_target);

      if (logsRes.error) {
        console.warn("[useMyProfileRow] manner_temp_logs count:", logsRes.error.message);
      }

      console.log("[DEBUG] Profile Data Received", {
        hasRow: row != null,
        manner_temp_raw: rawMt,
        manner_temp_coerced: coerced,
        manner_temp_target: row?.manner_temp_target ?? null,
        resolved_value: resolved.mannerTempValue,
      });
      console.log("[DEBUG] Current Manner Temp from DB:", resolved.mannerTempValue);

      return {
        row,
        milestoneCount: logsRes.error ? 0 : (logsRes.count ?? 0),
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
