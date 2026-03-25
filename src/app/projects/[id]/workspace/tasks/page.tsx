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
      .select("id, title, category, priority, status, assignee_id, due_date")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("applications")
      .select("applicant_id")
      .eq("project_id", projectId)
      .eq("status", "accepted"),
  ]);

  const projectTyped = project as { id: string; title: string; team_leader_id: string | null; recruitment_status?: unknown; tech_stack?: unknown } | null;
  const acceptedAppsTyped = (acceptedApps ?? []) as Array<{ applicant_id: string }>;

  const teamMemberIds = new Set<string>();
  if (projectTyped?.team_leader_id) teamMemberIds.add(projectTyped.team_leader_id);
  acceptedAppsTyped.forEach((a) => teamMemberIds.add(a.applicant_id));

  const { data: profiles } =
    teamMemberIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", Array.from(teamMemberIds))
      : { data: [] };

  const tasksTyped = (tasks ?? []) as Array<{
    id: string;
    title: string;
    category: string | null;
    priority?: string;
    status: string;
    assignee_id: string | null;
    due_date: string | null;
  }>;
  const assigneeIds = [...new Set(tasksTyped.map((t) => t.assignee_id).filter(Boolean))] as string[];
  const assigneeProfileIds = new Set(assigneeIds);
  const allProfileIds = new Set([...teamMemberIds, ...assigneeProfileIds]);
  const { data: allProfiles } =
    allProfileIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", Array.from(allProfileIds))
      : { data: [] };

  const allProfilesTyped = (allProfiles ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
  const profileMap = new Map(
    allProfilesTyped.map((p) => [p.id, { fullName: p.full_name, avatarUrl: p.avatar_url }])
  );

  const tasksWithAssignee = tasksTyped.map((t) => ({
    ...t,
    category: t.category ?? "",
    priority: (t as { priority?: string }).priority ?? "medium",
    due_date: t.due_date,
    assignee: t.assignee_id ? (profileMap.get(t.assignee_id) ?? null) : null,
  }));

  // teamMembers: auth user id 기준 (assignee_id FK가 auth.users 참조)
  const profilesTyped = (profiles ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
  const profileById = new Map(
    profilesTyped.map((p) => [p.id, { fullName: p.full_name, avatarUrl: p.avatar_url }])
  );
  const teamMembers = Array.from(teamMemberIds).map((uid) => ({
    id: uid,
    fullName: profileById.get(uid)?.fullName ?? null,
    avatarUrl: profileById.get(uid)?.avatarUrl ?? null,
  }));

  // recruitment_status: [{ role, roleKey }, ...] 또는 tech_stack (string[]) → 직군 라벨 목록
  type RecruitItem = { role?: string; roleKey?: string };
  const raw = projectTyped?.recruitment_status;
  const recruitArr = Array.isArray(raw)
    ? (raw as RecruitItem[]).map((r) => r.role ?? r.roleKey ?? "").filter(Boolean)
    : [];
  const techArr = (projectTyped?.tech_stack ?? []) as string[];
  const recruitmentRoles = recruitArr.length > 0 ? recruitArr : techArr;

  return (
    <KanbanTasksBoard
      projectId={projectId}
      projectTitle={projectTyped?.title ?? ""}
      initialTasks={tasksWithAssignee}
      teamMembers={teamMembers}
      currentUserId={currentUser?.id ?? null}
      recruitmentRoles={recruitmentRoles}
    />
  );
}
