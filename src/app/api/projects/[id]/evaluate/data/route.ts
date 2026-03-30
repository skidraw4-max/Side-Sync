import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type TeamMemberOut = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  manner_temp: string | number | null;
};

/**
 * GET: 상호 평가 페이지용 부트스트랩
 * - RLS로 인해 클라이언트만으로는 수락 멤버가 동료 applications 전체를 못 읽는 문제 보완(서비스 롤 우선)
 * - 프로필은 id, full_name, avatar_url, manner_* 만 반환 (이메일 제외)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: "Project ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: projRow, error: projErr } = await supabase
    .from("projects")
    .select("id, title, team_leader_id, status")
    .eq("id", projectId)
    .single();

  const project = projRow as {
    id: string;
    title: string;
    team_leader_id: string | null;
    status: string;
  } | null;

  if (projErr || !project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (project.status !== "completed") {
    return NextResponse.json(
      { error: "종료된 프로젝트만 평가할 수 있습니다." },
      { status: 400 }
    );
  }

  const isLeader = project.team_leader_id === user.id;
  const { data: myAccepted } = await supabase
    .from("applications")
    .select("id")
    .eq("project_id", projectId)
    .eq("applicant_id", user.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (!isLeader && !myAccepted) {
    return NextResponse.json({ error: "이 프로젝트의 팀원만 평가할 수 있습니다." }, { status: 403 });
  }

  const db = createAdminClient() ?? supabase;

  const { data: appsRaw, error: appsErr } = await db
    .from("applications")
    .select("applicant_id, role, tech_stack")
    .eq("project_id", projectId)
    .eq("status", "accepted");

  if (appsErr) {
    return NextResponse.json(
      { error: appsErr.message || "팀원 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  const apps = (appsRaw ?? []) as Array<{
    applicant_id: string;
    role: string | null;
    tech_stack: string | null;
  }>;

  const memberIds = new Set<string>();
  if (project.team_leader_id) {
    memberIds.add(project.team_leader_id);
  }
  apps.forEach((a) => memberIds.add(a.applicant_id));
  memberIds.delete(user.id);

  const roleMap = new Map<string, string>();
  if (project.team_leader_id) {
    roleMap.set(project.team_leader_id, "LEAD");
  }
  apps.forEach((a) => {
    const fromStack = typeof a.tech_stack === "string" && a.tech_stack.trim() !== "" ? a.tech_stack.trim() : null;
    const fromRole = typeof a.role === "string" && a.role.trim() !== "" ? a.role.trim() : null;
    roleMap.set(a.applicant_id, fromStack ?? fromRole ?? "MEMBER");
  });

  if (memberIds.size === 0) {
    return NextResponse.json({
      project: { title: project.title, status: project.status },
      teamMembers: [] as TeamMemberOut[],
      evaluatedIds: [] as string[],
      emptyReason: "no_peers" as const,
    });
  }

  const ids = Array.from(memberIds);
  const { data: profilesRaw, error: profErr } = await db
    .from("profiles")
    .select("id, full_name, avatar_url, manner_temp, manner_temp_target")
    .in("id", ids);

  if (profErr) {
    return NextResponse.json(
      { error: profErr.message || "프로필을 불러오지 못했습니다." },
      { status: 500 }
    );
  }

  const profiles = (profilesRaw ?? []) as Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    manner_temp?: number | null;
    manner_temp_target?: string | null;
  }>;
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  const teamMembers: TeamMemberOut[] = ids.map((id) => {
    const p = profileById.get(id);
    return {
      id,
      full_name: p?.full_name ?? null,
      avatar_url: p?.avatar_url ?? null,
      role: roleMap.get(id) ?? "MEMBER",
      manner_temp:
        p?.manner_temp != null
          ? p.manner_temp
          : p?.manner_temp_target != null
            ? p.manner_temp_target
            : "36.5",
    };
  });

  teamMembers.sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? "", "ko"));

  const { data: evalsRaw } = await db
    .from("peer_evaluations")
    .select("evaluatee_id")
    .eq("project_id", projectId)
    .eq("evaluator_id", user.id);

  const evaluatedIds = ((evalsRaw ?? []) as Array<{ evaluatee_id: string }>).map((e) => e.evaluatee_id);

  return NextResponse.json({
    project: { title: project.title, status: project.status },
    teamMembers,
    evaluatedIds,
  });
}
