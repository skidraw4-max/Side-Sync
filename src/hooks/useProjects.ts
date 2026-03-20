"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_PROJECTS } from "@/lib/demo-projects";
import type { Database } from "@/types/database";
import type { ProjectCardProps } from "@/components/ProjectCard";

const PROJECTS_QUERY_KEY = ["projects"] as const;

const DEFAULT_GRADIENT = "from-blue-200 via-indigo-200 to-purple-200";

export interface ProjectWithId extends ProjectCardProps {
  id: string;
}

/** DB 미연결·오류 시 트렌딩 카드용 (상세는 demo-projects와 동일 ID로 렌더) */
const FALLBACK_PROJECTS: ProjectWithId[] = DEMO_PROJECTS.map((p) => ({
  ...p,
}));

type RowMinimal = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "title" | "description" | "tech_stack"
> & { manner_temp_target?: string | null };

async function fetchProjects(): Promise<ProjectWithId[]> {
  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key";

  if (!isConfigured) {
    return FALLBACK_PROJECTS;
  }

  const supabase = createClient();

  try {
    // gradient 컬럼이 없는 프로젝트 DB에서 select에 gradient 포함 시 400 Bad Request →
    // 콘솔에 GET .../projects?...gradient... 400 이 찍힘 (로그아웃 후 홈 재로드 시에도 동일).
    // UI는 기본 그라데이션을 쓰므로 DB에서 gradient는 조회하지 않음.
    let { data, error } = await supabase
      .from("projects")
      .select("id, title, description, tech_stack, manner_temp_target")
      .order("created_at", { ascending: false });

    if (error) {
      const { data: d2, error: e2 } = await supabase
        .from("projects")
        .select("id, title, description, tech_stack")
        .order("created_at", { ascending: false });
      data = d2;
      error = e2;
    }

    if (error) {
      return FALLBACK_PROJECTS;
    }

    const rows = (data ?? []) as RowMinimal[];
    if (rows.length === 0) {
      return FALLBACK_PROJECTS;
    }

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
      mannerTemperature: row.manner_temp_target ?? "36.5°C",
      gradient: DEFAULT_GRADIENT,
    }));
  } catch {
    return FALLBACK_PROJECTS;
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

export function useProjects() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: fetchProjects,
    retry: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
