import { createClient } from "@/lib/supabase/server";
import { sortTasksForBoard } from "@/lib/kanban/task-order";
import KanbanTasksBoard from "./KanbanTasksBoard";
import TasksAccessDeniedRedirect from "./redirect-no-access";

interface TasksPageProps {
  params: Promise<{ id: string }>;
}

export default async function TasksPage({ params }: TasksPageProps) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    return <TasksAccessDeniedRedirect projectId={projectId} />;
  }

  // Board와 동일하게 "프로젝트 리더 또는 status='accepted' 멤버"만 업무 목록을 조회/수정할 수 있게 UI 레벨 접근 제어
  const [{ data: projectForAccess }, { data: acceptedApp }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, team_leader_id")
      .eq("id", projectId)
      .single(),
    supabase
      .from("applications")
      .select("id")
      .eq("project_id", projectId)
      .eq("applicant_id", currentUser.id)
      .eq("status", "accepted")
      .maybeSingle(),
  ]);

  const projectForAccessTyped = projectForAccess as
    | { id: string; team_leader_id: string | null }
    | null;
  const hasAccess =
    !!projectForAccessTyped &&
    (projectForAccessTyped.team_leader_id === currentUser.id || !!acceptedApp);

  if (!hasAccess) {
    return <TasksAccessDeniedRedirect projectId={projectId} />;
  }

  const [projectResult, acceptedAppsResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, team_leader_id, recruitment_status, tech_stack")
      .eq("id", projectId)
      .single(),
    supabase
      .from("applications")
      .select("applicant_id")
      .eq("project_id", projectId)
      .eq("status", "accepted"),
  ]);

  if (projectResult.error) {
    return (
      <div className="p-6 text-sm text-red-600">
        프로젝트를 불러오지 못했습니다: {projectResult.error.message}
      </div>
    );
  }
  if (acceptedAppsResult.error) {
    return (
      <div className="p-6 text-sm text-red-600">
        워크스페이스 멤버를 불러오지 못했습니다: {acceptedAppsResult.error.message}
      </div>
    );
  }

  const projectTyped = projectResult.data as
    | { id: string; title: string; team_leader_id: string | null; recruitment_status?: unknown; tech_stack?: unknown }
    | null;
  const acceptedAppsTyped = (acceptedAppsResult.data ?? []) as Array<{ applicant_id: string }>;

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

  // due_date / sort_order / description 컬럼이 없는 환경은 SELECT를 줄여 재시도합니다.
  let supportsDueDate = true;
  let supportsSortOrder = true;
  let supportsDescription = true;

  const isMissingColumn = (lower: string, col: string) =>
    lower.includes(`column tasks.${col} does not exist`) ||
    (lower.includes(col) && (lower.includes("does not exist") || lower.includes("not exist")));

  const tasksSelect = (opts: { due: boolean; sort: boolean; desc: boolean }) => {
    const cols = [
      "id",
      "title",
      "category",
      "priority",
      "status",
      "assignee_id",
    ];
    if (opts.due) cols.push("due_date");
    if (opts.sort) cols.push("sort_order");
    if (opts.desc) cols.push("description");
    return cols.join(", ");
  };

  const fetchTasks = () =>
    supabase
      .from("tasks")
      .select(
        tasksSelect({
          due: supportsDueDate,
          sort: supportsSortOrder,
          desc: supportsDescription,
        })
      )
      .eq("project_id", projectId);

  let tasksResult = await fetchTasks();

  while (tasksResult.error) {
    const lower = tasksResult.error.message?.toLowerCase?.() ?? "";
    let fixed = false;
    if (supportsSortOrder && isMissingColumn(lower, "sort_order")) {
      supportsSortOrder = false;
      fixed = true;
    } else if (supportsDueDate && isMissingColumn(lower, "due_date")) {
      supportsDueDate = false;
      fixed = true;
    } else if (supportsDescription && isMissingColumn(lower, "description")) {
      supportsDescription = false;
      fixed = true;
    }
    if (!fixed) {
      return (
        <div className="p-6 text-sm text-red-600">
          업무를 불러오지 못했습니다: {tasksResult.error.message}
        </div>
      );
    }
    tasksResult = await fetchTasks();
  }

  const tasksTyped = (tasksResult.data ?? []) as Array<{
    id: string;
    title: string;
    category: string | null;
    priority?: string;
    status: string;
    assignee_id: string | null;
    due_date?: string | null;
    sort_order?: number;
    description?: string | null;
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

  const tasksWithAssignee = sortTasksForBoard(
    tasksTyped.map((t) => ({
      ...t,
      category: t.category ?? "",
      priority: (t as { priority?: string }).priority ?? "medium",
      due_date: supportsDueDate ? (t.due_date ?? null) : null,
      sort_order: supportsSortOrder ? (t.sort_order ?? 0) : 0,
      description: supportsDescription ? (t.description ?? null) : undefined,
      assignee: t.assignee_id ? (profileMap.get(t.assignee_id) ?? null) : null,
    }))
  );

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
      supportsDueDate={supportsDueDate}
      supportsSortOrder={supportsSortOrder}
      supportsDescription={supportsDescription}
    />
  );
}
