import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectBoardClient from "./project-board-client";
import BoardAccessDeniedRedirect from "./redirect-no-access";

interface BoardPageProps {
  params: Promise<{ id: string }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <BoardAccessDeniedRedirect projectId={projectId} />;
  }

  const [{ data: project }, { data: acceptedApp }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, team_leader_id")
      .eq("id", projectId)
      .single(),
    supabase
      .from("applications")
      .select("id")
      .eq("project_id", projectId)
      .eq("applicant_id", user.id)
      .eq("status", "accepted")
      .maybeSingle(),
  ]);

  const projectTyped = project as { id: string; title: string; team_leader_id: string | null } | null;
  const hasAccess = !!projectTyped && (projectTyped.team_leader_id === user.id || !!acceptedApp);

  if (!hasAccess) {
    return <BoardAccessDeniedRedirect projectId={projectId} />;
  }

  return (
    <ProjectBoardClient
      projectId={projectId}
      projectTitle={projectTyped.title}
      currentUserId={user.id}
      isLeader={projectTyped.team_leader_id === user.id}
    />
  );
}
