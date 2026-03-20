"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_PROJECTS } from "@/lib/demo-projects";
import { projectMatchesSearchTokens, tokenizeSearchQuery } from "@/lib/project-search";
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
  "id" | "title" | "description" | "goal" | "tech_stack"
> & {
  manner_temp_target?: string | null;
  summary?: string | null;
  content?: string | null;
};

function mapRowToCard(row: RowMinimal): ProjectWithId {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
    mannerTemperature: row.manner_temp_target ?? "36.5°C",
    gradient: DEFAULT_GRADIENT,
  };
}

async function fetchAllProjectsRows(supabase: ReturnType<typeof createClient>): Promise<RowMinimal[]> {
  const selectVariants = [
    "id, title, description, goal, summary, content, tech_stack, manner_temp_target",
    "id, title, description, goal, tech_stack, manner_temp_target",
    "id, title, description, tech_stack, manner_temp_target",
  ];

  for (const sel of selectVariants) {
    const { data, error } = await supabase
      .from("projects")
      .select(sel)
      .order("created_at", { ascending: false });

    if (!error && data !== null) {
      return data as unknown as RowMinimal[];
    }
  }

  return [];
}

async function fetchProjects(searchQuery?: string): Promise<ProjectWithId[]> {
  const q = searchQuery?.trim() ?? "";
  const tokens = tokenizeSearchQuery(q);

  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key";

  if (!isConfigured) {
    if (tokens.length === 0) return FALLBACK_PROJECTS;
    const filtered = FALLBACK_PROJECTS.filter((p) =>
      projectMatchesSearchTokens(
        {
          title: p.title,
          description: p.description ?? null,
          goal: null,
          summary: null,
          content: null,
          tech_stack: p.techStack,
        },
        tokens
      )
    );
    return filtered;
  }

  const supabase = createClient();

  try {
    if (tokens.length === 0) {
      const rows = await fetchAllProjectsRows(supabase);
      if (rows.length === 0) {
        return FALLBACK_PROJECTS;
      }
      return rows.map(mapRowToCard);
    }

    const { data: rpcData, error: rpcError } = await (
      supabase as unknown as {
        rpc: (n: string, a: { query_text: string }) => Promise<{ data: unknown; error: unknown }>;
      }
    ).rpc("search_projects", { query_text: q });

    if (!rpcError && rpcData !== null && Array.isArray(rpcData)) {
      const rows = rpcData as unknown as RowMinimal[];
      return rows.map(mapRowToCard);
    }

    const rows = await fetchAllProjectsRows(supabase);
    const filtered = rows.filter((r) => projectMatchesSearchTokens(r, tokens));
    return filtered.map(mapRowToCard);
  } catch {
    if (tokens.length === 0) return FALLBACK_PROJECTS;
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

export function useProjects(searchQuery: string = "") {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, searchQuery],
    queryFn: () => fetchProjects(searchQuery),
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
