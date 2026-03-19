import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface WorkspacePageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: project },
    { data: acceptedApp },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("team_leader_id")
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

  const isAcceptedMember = !!acceptedApp;
  const projectTyped = project as { team_leader_id: string | null } | null;

  // 팀장도 아니고, 수락된 팀원도 아니라면?
  if (!projectTyped || (user.id !== projectTyped.team_leader_id && !isAcceptedMember)) {
    redirect(`/projects/${projectId}?error=no-access`);
  }

  redirect(`/projects/${projectId}/workspace/tasks`);
}
