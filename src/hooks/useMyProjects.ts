"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { shouldEnableSupabaseRealtimeSubscriptions } from "@/lib/supabase/realtime-flags";
import type { Database, RecruitmentStatusRow } from "@/types/database";
import type { ProjectCardProps } from "@/components/ProjectCard";
import { inferProjectRecruitmentState } from "@/lib/project-recruitment-state";
import { fetchLedProjectsForUser, fetchProjectsByIds } from "@/lib/supabase-project-queries";

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
    const safeLedProjects = await fetchLedProjectsForUser(supabase, userId);

    const { data: acceptedApps } = await supabase
      .from("applications")
      .select("project_id")
      .eq("applicant_id", userId)
      .eq("status", "accepted");

    const memberProjectIds = (acceptedApps ?? [])
      .map((a) => (a as { project_id: string }).project_id)
      .filter((id) => id);

    const ledIds = new Set(safeLedProjects.map((p) => p.id));
    const memberIdsOnly = memberProjectIds.filter((id) => !ledIds.has(id));
    const memberProjects = await fetchProjectsByIds(supabase, memberIdsOnly);

    const combined = [...safeLedProjects, ...memberProjects] as ProjectRow[];

    return combined.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
      mannerTemperature: (row as { manner_temp_target?: string | null }).manner_temp_target ?? "36.5°C",
      gradient: (row as { gradient?: string | null }).gradient ?? DEFAULT_GRADIENT,
      recruitmentState: inferProjectRecruitmentState(
        row.status,
        row.recruitment_status as RecruitmentStatusRow[] | null
      ),
    }));
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["projects", "mine"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
