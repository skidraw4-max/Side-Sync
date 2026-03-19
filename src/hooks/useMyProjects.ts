"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";
import type { ProjectCardProps } from "@/components/ProjectCard";

const DEFAULT_GRADIENT = "from-blue-200 via-indigo-200 to-purple-200";

export interface ProjectWithId extends ProjectCardProps {
  id: string;
}

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
    // gradient, manner_temp_target 등 DB에 없을 수 있는 컬럼 제외 후 조회
    const { data: allProjects, error: fetchError } = await supabase
      .from("projects")
      .select("id, title, description, tech_stack, manner_temp_target, team_leader_id")
      .order("created_at", { ascending: false })
      .limit(100);

    let safeLedProjects: Database["public"]["Tables"]["projects"]["Row"][] = [];

    if (fetchError) {
      console.error("[useMyProjects] 프로젝트 조회 에러:", fetchError.message ?? fetchError);
      // tech_stack, manner_temp_target 없이 재시도 (컬럼 없을 수 있음)
      const { data: fallbackData } = await supabase
        .from("projects")
        .select("id, title, description, team_leader_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (fallbackData?.length) {
        const rows = (fallbackData ?? []) as Array<{ id: string; title: string; description: string | null; team_leader_id: string | null }>;
        safeLedProjects = rows
          .filter((p) => p.team_leader_id === userId)
          .map(({ team_leader_id, ...rest }) => rest) as Database["public"]["Tables"]["projects"]["Row"][];
      }
    } else {
      // team_leader_id가 현재 유저와 일치하는 프로젝트만
      const rows = (allProjects ?? []) as Array<{ team_leader_id?: string | null } & Database["public"]["Tables"]["projects"]["Row"]>;
      safeLedProjects = rows
        .filter((p) => p.team_leader_id === userId)
        .map(({ team_leader_id, ...rest }) => rest) as Database["public"]["Tables"]["projects"]["Row"][];
    }

    // 내가 멤버(accepted)로 참여한 프로젝트
    const { data: acceptedApps } = await supabase
      .from("applications")
      .select("project_id")
      .eq("applicant_id", userId)
      .eq("status", "accepted");

    const memberProjectIds = (acceptedApps ?? [])
      .map((a) => (a as { project_id: string }).project_id)
      .filter((id) => id);

    let memberProjects: Database["public"]["Tables"]["projects"]["Row"][] = [];
    if (memberProjectIds.length > 0) {
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, tech_stack, manner_temp_target")
        .in("id", memberProjectIds)
        .order("created_at", { ascending: false });
      memberProjects = (data ?? []) as Database["public"]["Tables"]["projects"]["Row"][];
    }

    // 리더 프로젝트 + 멤버 프로젝트 (중복 제거, created_at 기준 정렬)
    const ledIds = new Set(safeLedProjects.map((p) => p.id));
    const combined = [
      ...safeLedProjects,
      ...memberProjects.filter((p) => !ledIds.has(p.id)),
    ] as Database["public"]["Tables"]["projects"]["Row"][];

    const result = combined.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
      mannerTemperature: row.manner_temp_target,
      gradient: row.gradient ?? DEFAULT_GRADIENT,
    }));
    console.log("[useMyProjects] 가져온 프로젝트 (최종 결합):", result);
    return result;
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
    staleTime: 0, // 캐시로 인한 목록 미표시 방지: 항상 최신 데이터 요청
  });

  // Supabase Realtime: projects/applications 변경 시 refetch
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

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
