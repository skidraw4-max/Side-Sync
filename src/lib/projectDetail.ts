import { supabase } from "./supabase";
import type { Database } from "@/types/database";

export interface ProjectDetailTeamLeader {
  id: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  successRate: string;
  mannerTemp: string;
}

export interface ProjectDetailData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  techStack: string[];
  gradient: string | null;
  teamLeader: ProjectDetailTeamLeader | null;
  teamLeaderId: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
  success_rate: string | null;
  manner_temp_target: string | null;
}

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  tech_stack: string[];
  manner_temp_target: string;
  gradient: string | null;
  team_leader_id: string | null;
  category: string | null;
  team_leader: ProfileRow | ProfileRow[] | null;
}

const DEFAULT_CATEGORY = "GENERAL";
const DEFAULT_TEAM_LEADER: ProjectDetailTeamLeader = {
  id: "",
  fullName: "Unknown",
  role: "-",
  avatarUrl: null,
  successRate: "-",
  mannerTemp: "-",
};

/**
 * URL의 id 파라미터로 projects 테이블 조회 후,
 * profiles와 Join하여 팀장의 Success Rate, Manner Temp 포함
 */
export async function fetchProjectDetail(
  projectId: string
): Promise<ProjectDetailData | null> {
  // 1) projects + profiles join 시도 (team_leader_id FK 필요)
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      tech_stack,
      manner_temp_target,
      gradient,
      team_leader_id,
      category,
      team_leader:profiles!team_leader_id (
        id,
        full_name,
        role,
        avatar_url,
        success_rate,
        manner_temp_target
      )
    `
    )
    .eq("id", projectId)
    .single();

  if (error) {
    // join 실패 시 (FK/컬럼 없음) 단순 projects 조회로 폴백
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("projects")
      .select("id, title, description, tech_stack, manner_temp_target, gradient, team_leader_id")
      .eq("id", projectId)
      .single();

    if (fallbackError || !fallbackData) return null;

    const f = fallbackData as {
      id: string;
      title: string;
      description: string | null;
      tech_stack: string[];
      manner_temp_target: string;
      gradient: string | null;
      team_leader_id?: string | null;
    };
    return {
      id: f.id,
      title: f.title,
      description: f.description,
      category: DEFAULT_CATEGORY,
      techStack: Array.isArray(f.tech_stack) ? f.tech_stack : [],
      gradient: f.gradient,
      teamLeader: null,
      teamLeaderId: f.team_leader_id ?? null,
    };
  }

  if (!data) return null;

  const row = data as unknown as ProjectRow;

  const teamLeaderProfile = Array.isArray(row.team_leader)
    ? row.team_leader[0] ?? null
    : row.team_leader;
  const teamLeader: ProjectDetailTeamLeader | null = teamLeaderProfile
    ? {
        id: teamLeaderProfile.id,
        fullName: teamLeaderProfile.full_name ?? "Unknown",
        role: teamLeaderProfile.role ?? "-",
        avatarUrl: teamLeaderProfile.avatar_url ?? null,
        successRate: teamLeaderProfile.success_rate ?? "-",
        mannerTemp: teamLeaderProfile.manner_temp_target ?? row.manner_temp_target ?? "-",
      }
    : row.team_leader_id
      ? { ...DEFAULT_TEAM_LEADER, id: row.team_leader_id }
      : null;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category ?? DEFAULT_CATEGORY,
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
    gradient: row.gradient,
    teamLeader,
    teamLeaderId: row.team_leader_id ?? null,
  };
}
