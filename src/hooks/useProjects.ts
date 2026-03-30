"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { shouldEnableSupabaseRealtimeSubscriptions } from "@/lib/supabase/realtime-flags";
import { DEMO_PROJECTS } from "@/lib/demo-projects";
import { projectMatchesSearchTokens, tokenizeSearchQuery } from "@/lib/project-search";
import type { Database, RecruitmentStatusRow } from "@/types/database";
import type { ProjectCardProps } from "@/components/ProjectCard";
import { APPLICATION_STATUS } from "@/lib/application-status";
import { inferProjectRecruitmentState } from "@/lib/project-recruitment-state";
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

const PROJECTS_QUERY_KEY = ["projects"] as const;

const DEFAULT_GRADIENT = "from-blue-200 via-indigo-200 to-purple-200";

export interface ProjectWithId extends ProjectCardProps {
  id: string;
}

const FALLBACK_RECRUITMENT = ["recruiting", "urgent", "recruiting"] as const;

/** DB 미연결·오류 시 트렌딩 카드용 (상세는 demo-projects와 동일 ID로 렌더) */
const FALLBACK_PROJECTS: ProjectWithId[] = DEMO_PROJECTS.map((p, i) => ({
  ...p,
  recruitmentState: FALLBACK_RECRUITMENT[i % FALLBACK_RECRUITMENT.length],
}));

type RowMinimal = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "title" | "description" | "goal" | "tech_stack" | "status" | "recruitment_status"
> & {
  manner_temp_target?: string | number | null;
  team_leader_id?: string | null;
  summary?: string | null;
  content?: string | null;
};

function mapRowToCard(
  row: RowMinimal,
  leaderMap: Map<string, LeaderMannerRow>,
  opts?: { showWorkspaceLink?: boolean }
): ProjectWithId {
  const r = row as RowMinimal & { gradient?: unknown };
  return {
    id: typeof row.id === "string" ? row.id : String(row.id ?? ""),
    title: normalizeProjectTitle(row.title),
    description: normalizeProjectDescription(row.description),
    techStack: normalizeTechStackForCard(row.tech_stack),
    mannerTemperature: formatMannerTemperatureForCard(
      r.team_leader_id ?? null,
      leaderMap,
      row.manner_temp_target ?? null
    ),
    gradient: normalizeGradientForCard(r.gradient, DEFAULT_GRADIENT),
    recruitmentState: inferProjectRecruitmentState(
      row.status,
      row.recruitment_status as RecruitmentStatusRow[] | null
    ),
    showWorkspaceLink: opts?.showWorkspaceLink ?? false,
  };
}

async function fetchAcceptedProjectIdsForViewer(
  supabase: ReturnType<typeof createClient>
): Promise<Set<string>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data: apps, error } = await supabase
    .from("applications")
    .select("project_id")
    .eq("applicant_id", user.id)
    .eq("status", APPLICATION_STATUS.ACCEPTED);
  if (error || !apps) return new Set();
  return new Set(apps.map((a) => (a as { project_id: string }).project_id));
}

async function fetchAllProjectsRows(supabase: ReturnType<typeof createClient>): Promise<RowMinimal[]> {
  /** 컬럼 목록을 직접 나열하면 마이그레이션 누락 시 400(Bad Request)이 날 수 있어 * 한 번만 조회 */
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[useProjects] projects select:", error.message);
    }
    return [];
  }

  return (data ?? []) as unknown as RowMinimal[];
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
    const acceptedIds = await fetchAcceptedProjectIdsForViewer(supabase);

    if (tokens.length === 0) {
      const rows = await fetchAllProjectsRows(supabase);
      if (rows.length === 0) {
        return FALLBACK_PROJECTS;
      }
      const leaderMap = await fetchLeaderMannerMap(
        supabase,
        rows.map((row) => (row as RowMinimal).team_leader_id)
      );
      return rows.map((row) =>
        mapRowToCard(row, leaderMap, { showWorkspaceLink: acceptedIds.has(row.id) })
      );
    }

    const { data: rpcData, error: rpcError } = await (
      supabase as unknown as {
        rpc: (n: string, a: { query_text: string }) => Promise<{ data: unknown; error: unknown }>;
      }
    ).rpc("search_projects", { query_text: q });

    if (!rpcError && rpcData !== null && Array.isArray(rpcData)) {
      const rows = rpcData as unknown as RowMinimal[];
      const leaderMap = await fetchLeaderMannerMap(
        supabase,
        rows.map((row) => row.team_leader_id)
      );
      return rows.map((row) =>
        mapRowToCard(row, leaderMap, { showWorkspaceLink: acceptedIds.has(row.id) })
      );
    }

    const rows = await fetchAllProjectsRows(supabase);
    const filtered = rows.filter((r) => projectMatchesSearchTokens(r, tokens));
    const leaderMap = await fetchLeaderMannerMap(
      supabase,
      filtered.map((row) => (row as RowMinimal).team_leader_id)
    );
    return filtered.map((row) =>
      mapRowToCard(row, leaderMap, { showWorkspaceLink: acceptedIds.has(row.id) })
    );
  } catch (e) {
    console.warn("[useProjects] fetchProjects 실패:", e);
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
    if (!isSupabaseConfigured() || !shouldEnableSupabaseRealtimeSubscriptions()) return;

    const supabase = createClient();
    const main = supabase
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

    let appsChannel: ReturnType<typeof supabase.channel> | null = null;
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;
      appsChannel = supabase
        .channel(`projects-realtime-apps-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "applications",
            filter: `applicant_id=eq.${user.id}`,
          },
          () => {
            void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
          }
        )
        .subscribe();

      profileChannel = supabase
        .channel(`projects-realtime-profile-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          () => {
            void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
          }
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      supabase.removeChannel(main);
      if (appsChannel) supabase.removeChannel(appsChannel);
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, [queryClient]);

  return query;
}
