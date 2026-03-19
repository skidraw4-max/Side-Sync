import { createClient } from "@/lib/supabase/server";
import KanbanTasksBoard from "./KanbanTasksBoard";

interface TasksPageProps {
  params: Promise<{ id: string }>;
}

export default async function TasksPage({ params }: TasksPageProps) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const [
    { data: project },
    { data: tasks },
    { data: acceptedApps },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, team_leader_id, recruitment_status, tech_stack")
      .eq("id", projectId)
      .single(),
    supabase
      .from("tasks")
      .select("id, title, category, priority, status, assignee_id")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("applications")
      .select("applicant_id")
      .eq("project_id", projectId)
      .eq("status", "accepted"),
  ]);

  const teamMemberIds = new Set<string>();
  if (project?.team_leader_id) teamMemberIds.add(project.team_leader_id);
  (acceptedApps ?? []).forEach((a) => teamMemberIds.add(a.applicant_id));

  const { data: profiles } =
    teamMemberIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", Array.from(teamMemberIds))
      : { data: [] };

  const assigneeIds = [...new Set((tasks ?? []).map((t) => t.assignee_id).filter(Boolean))] as string[];
  const assigneeProfileIds = new Set(assigneeIds);
  const allProfileIds = new Set([...teamMemberIds, ...assigneeProfileIds]);
  const { data: allProfiles } =
    allProfileIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", Array.from(allProfileIds))
      : { data: [] };

  const profileMap = new Map(
    (allProfiles ?? []).map((p) => [p.id, { fullName: p.full_name, avatarUrl: p.avatar_url }])
  );

  const tasksWithAssignee = (tasks ?? []).map((t) => ({
    ...t,
    priority: (t as { priority?: string }).priority ?? "medium",
    assignee: t.assignee_id ? profileMap.get(t.assignee_id) : null,
  }));

  // teamMembers: auth user id 기준 (assignee_id FK가 auth.users 참조)
  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, { fullName: p.full_name, avatarUrl: p.avatar_url }])
  );
  const teamMembers = Array.from(teamMemberIds).map((uid) => ({
    id: uid,
    fullName: profileById.get(uid)?.full_name ?? null,
    avatarUrl: profileById.get(uid)?.avatar_url ?? null,
  }));

  // recruitment_status: [{ role, roleKey }, ...] 또는 tech_stack (string[]) → 직군 라벨 목록
  type RecruitItem = { role?: string; roleKey?: string };
  const raw = (project as { recruitment_status?: unknown })?.recruitment_status;
  const recruitArr = Array.isArray(raw)
    ? (raw as RecruitItem[]).map((r) => r.role ?? r.roleKey ?? "").filter(Boolean)
    : [];
  const techArr = (project?.tech_stack ?? []) as string[];
  const recruitmentRoles = recruitArr.length > 0 ? recruitArr : techArr;

  return (
    <KanbanTasksBoard
      projectId={projectId}
      projectTitle={project?.title ?? ""}
      initialTasks={tasksWithAssignee}
      teamMembers={teamMembers}
      currentUserId={currentUser?.id ?? null}
      recruitmentRoles={recruitmentRoles}
    />
  );
}
