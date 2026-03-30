"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { shouldEnableSupabaseRealtimeSubscriptions } from "@/lib/supabase/realtime-flags";
import type { Database, RecruitmentStatusRow } from "@/types/database";
import type { ProjectCardProps } from "@/components/ProjectCard";
import { inferProjectRecruitmentState } from "@/lib/project-recruitment-state";
import { APPLICATION_STATUS } from "@/lib/application-status";
import { isMyProjectsDebugEnabled } from "@/lib/debug-my-projects";
import { fetchLedProjectsForUser, fetchProjectsByIds } from "@/lib/supabase-project-queries";
import {
  fetchLeaderMannerMap,
  formatMannerTemperatureForCard,
  type LeaderMannerRow,
} from "@/lib/manner-temp-display";
import {
  normalizeGradientForCard,
  normalizeProjectDescription,
  normalizeProjectTitle,
  normalizeTechStackForCard,
} from "@/lib/project-row-normalize";

const DEFAULT_GRADIENT = "from-blue-200 via-indigo-200 to-purple-200";

export interface ProjectWithId extends ProjectCardProps {
  id: string;
}

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

async function fetchMyProjects(userId: string): Promise<ProjectWithId[]> {
  if (!userId) return [];

  const supabase = createClient();

  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key";

  if (!isConfigured) {
    return [];
  }

  try {
    /** 세션 user id === applications.applicant_id (user_id 컬럼 없음) */
    if (isMyProjectsDebugEnabled()) {
      const { data: authData } = await supabase.auth.getUser();
      const authUid = authData.user?.id ?? null;
      console.log("🔍 [useMyProjects] Step A — applicant_id로 쓰는 userId:", userId);
      console.log("🔍 [useMyProjects] Step B — auth.getUser().id 와 동일?", authUid === userId, {
        userId_for_applicant_id: userId,
        auth_getUser_id: authUid,
      });
    }

    const safeLedProjects = await fetchLedProjectsForUser(supabase, userId);

    const { data: acceptedApps, error: acceptedAppsError } = await supabase
      .from("applications")
      .select("project_id")
      .eq("applicant_id", userId)
      .eq("status", APPLICATION_STATUS.ACCEPTED);

    const memberProjectIds = (acceptedApps ?? [])
      .map((a) => (a as { project_id: string }).project_id)
      .filter((id) => id);

    if (isMyProjectsDebugEnabled()) {
      if (acceptedAppsError) {
        console.warn("🔍 [useMyProjects] Step C — applications 조회 오류:", acceptedAppsError.message);
      } else {
        const empty = (acceptedApps?.length ?? 0) === 0;
        console.log(
          "🔍 [useMyProjects] Step C — status=accepted 행에서 나온 project_id 배열 (비었으면 []):",
          memberProjectIds,
          "| 빈 배열?", empty
        );
        console.log("🔍 [useMyProjects] Step C-raw — acceptedApps 원본:", acceptedApps);
      }
      console.log("🔍 [useMyProjects] Step D — 리더로 포함된 프로젝트 수:", safeLedProjects.length);
    }

    const ledIds = new Set(safeLedProjects.map((p) => p.id));
    const memberIdsOnly = memberProjectIds.filter((id) => !ledIds.has(id));

    if (isMyProjectsDebugEnabled()) {
      console.log(
        "🔍 [useMyProjects] Step E — 리더와 중복 제외 후 멤버만 조회할 project_id (비었으면 []):",
        memberIdsOnly
      );
    }

    let memberProjects: ProjectRow[] = [];
    try {
      memberProjects = await fetchProjectsByIds(supabase, memberIdsOnly);
    } catch (memberErr) {
      console.warn("[useMyProjects] fetchProjectsByIds 실패, 멤버 프로젝트 없음으로 처리:", memberErr);
    }

    const combined = [...safeLedProjects, ...memberProjects] as ProjectRow[];

    if (isMyProjectsDebugEnabled()) {
      console.log("🔍 [useMyProjects] Step F — 최종 합쳐진 프로젝트 개수 (카드 수):", combined.length);
    }

    let leaderMap = new Map<string, LeaderMannerRow>();
    try {
      leaderMap = await fetchLeaderMannerMap(
        supabase,
        combined.map((row) => row.team_leader_id)
      );
    } catch (mapErr) {
      console.warn("[useMyProjects] fetchLeaderMannerMap 실패, 프로젝트 기본 온도만 사용:", mapErr);
    }

    const cards: ProjectWithId[] = [];
    for (const row of combined) {
      try {
        const mannerTarget = (row as { manner_temp_target?: unknown }).manner_temp_target;
        cards.push({
          id: typeof row.id === "string" ? row.id : String(row.id ?? ""),
          title: normalizeProjectTitle(row.title),
          description: normalizeProjectDescription(row.description),
          techStack: normalizeTechStackForCard(row.tech_stack),
          mannerTemperature: formatMannerTemperatureForCard(
            row.team_leader_id,
            leaderMap,
            mannerTarget as string | number | null | undefined
          ),
          gradient: normalizeGradientForCard(
            (row as { gradient?: unknown }).gradient,
            DEFAULT_GRADIENT
          ),
          recruitmentState: inferProjectRecruitmentState(
            row.status,
            row.recruitment_status as RecruitmentStatusRow[] | null
          ),
        });
      } catch (rowErr) {
        console.warn("[useMyProjects] 프로젝트 행 가공 실패, 건너뜀:", row?.id, rowErr);
      }
    }
    return cards;
  } catch (err) {
    console.error("[useMyProjects] fetchMyProjects 에러:", err);
    return [];
  }
}

function isSupabaseConfigured(): boolean {
  if (typeof window === "undefined") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    url &&
    url !== "https://placeholder.supabase.co" &&
    key &&
    key !== "placeholder-key"
  );
}

export function useMyProjects(userId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["projects", "mine", userId],
    queryFn: () => fetchMyProjects(userId),
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !shouldEnableSupabaseRealtimeSubscriptions()) return;

    const supabase = createClient();
    const channel = supabase
      .channel("my-projects-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["projects", "mine"] });
        }
      )
      .subscribe();

    let appsCh: ReturnType<typeof supabase.channel> | null = null;
    let profileCh: ReturnType<typeof supabase.channel> | null = null;
    if (userId) {
      appsCh = supabase
        .channel(`my-projects-apps-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "applications",
            filter: `applicant_id=eq.${userId}`,
          },
          () => {
            void queryClient.invalidateQueries({ queryKey: ["projects", "mine"] });
            void queryClient.invalidateQueries({ queryKey: ["applications", "pending", userId] });
          }
        )
        .subscribe();

      profileCh = supabase
        .channel(`my-projects-profile-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          () => {
            void queryClient.invalidateQueries({ queryKey: ["projects", "mine"] });
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(channel);
      if (appsCh) supabase.removeChannel(appsCh);
      if (profileCh) supabase.removeChannel(profileCh);
    };
  }, [queryClient, userId]);

  return query;
}
