"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { coerceMannerTempFromDb, resolveMannerTempForProfile } from "@/lib/manner-temp-coerce";

/** 마이페이지·평가 후 무효화 시 동일 키 사용 */
export const MY_PROFILE_ROW_QUERY_KEY = "my-profile-row" as const;

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

/**
 * 마이페이지용 프로필 행 — 캐시를 짧게 두고 마운트·포커스마다 최신 조회.
 * profiles UPDATE 시 Realtime으로 무효화(테이블에 Realtime이 켜져 있을 때).
 */
export function useMyProfileRow(userId: string | null | undefined) {
  const queryClient = useQueryClient();
  const uid = userId ?? null;

  const query = useQuery({
    queryKey: [MY_PROFILE_ROW_QUERY_KEY, uid],
    enabled: !!uid,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    networkMode: "always",
    queryFn: async (): Promise<MyProfileBundle> => {
      const supabase = createClient();
      const [profileRes, logsRes] = await Promise.all([
        supabase.from("profiles").select(PROFILE_SELECT).eq("id", uid!).maybeSingle(),
        supabase.from("manner_temp_logs").select("id", { count: "exact", head: true }).eq("user_id", uid!),
      ]);

      if (profileRes.error) {
        throw profileRes.error;
      }

      const row = profileRes.data as MyProfileRow | null;
      const rawMt = row?.manner_temp;
      const coerced = coerceMannerTempFromDb(rawMt);
      const resolved = resolveMannerTempForProfile(row?.manner_temp, row?.manner_temp_target);

      if (logsRes.error) {
        console.warn("[useMyProfileRow] manner_temp_logs count:", logsRes.error.message);
      }

      console.log("[DEBUG] Current Manner Temp from DB:", {
        manner_temp_raw: rawMt,
        manner_temp_coerced: coerced,
        manner_temp_target: row?.manner_temp_target ?? null,
        resolved_value: resolved.mannerTempValue,
      });

      return {
        row,
        milestoneCount: logsRes.error ? 0 : (logsRes.count ?? 0),
      };
    },
  });

  useEffect(() => {
    if (!uid) return;
    const supabase = createClient();
    const channel = supabase
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
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [uid, queryClient]);

  return query;
}
