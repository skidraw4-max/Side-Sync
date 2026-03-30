import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WorkspaceResponsiveShell from "@/components/WorkspaceResponsiveShell";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: projectRaw },
    { data: acceptedApp },
    { data: channels },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, team_leader_id, status")
      .eq("id", projectId)
      .single(),
    supabase
      .from("applications")
      .select("id")
      .eq("project_id", projectId)
      .eq("applicant_id", user.id)
      .eq("status", "accepted")
      .maybeSingle(),
    supabase
      .from("chat_channels")
      .select("id, name, slug")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
  ]);

  const project = projectRaw as {
    id: string;
    title: string;
    team_leader_id: string | null;
    status?: string | null;
  } | null;
  const channelsTyped = (channels ?? []) as Array<{ id: string; name: string; slug: string }>;

  let channelsList = channelsTyped;
  if (channelsList.length === 0 && project) {
    const { error } = await (supabase as any).from("chat_channels").insert([
      { project_id: projectId, name: "General", slug: "general", description: "General project discussion" },
      { project_id: projectId, name: "Design Sync", slug: "design-sync", description: "Syncing visual components and brand guidelines" },
      { project_id: projectId, name: "Development", slug: "development", description: "Code and implementation discussion" },
    ]);
    if (!error) {
      const { data: inserted } = await (supabase as any)
        .from("chat_channels")
        .select("id, name, slug")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      channelsList = (inserted ?? []) as Array<{ id: string; name: string; slug: string }>;
    }
  }

  const leaderId =
    project?.team_leader_id != null && String(project.team_leader_id).trim() !== ""
      ? String(project.team_leader_id).trim()
      : null;
  const isLeader = leaderId !== null && leaderId === user.id;
  const isAccepted = !!acceptedApp;

  if (!project || (!isLeader && !isAccepted)) {
    redirect("/projects");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  const statusRaw = project?.status;
  const projectStatusForShell =
    typeof statusRaw === "string" && statusRaw.trim() !== "" ? statusRaw.trim() : "hiring";

  if (process.env.NODE_ENV === "development") {
    console.log("[workspace/layout] sidebar props", {
      projectId,
      isLeader,
      projectStatusForShell,
      team_leader_id_present: Boolean(leaderId),
    });
  }

  return (
    <WorkspaceResponsiveShell
      projectId={projectId}
      projectTitle={project.title}
      profile={profile}
      isLeader={isLeader}
      projectStatus={projectStatusForShell}
      channels={channelsList.map((c) => ({ id: c.id, slug: c.slug, name: c.name }))}
    >
      {children}
    </WorkspaceResponsiveShell>
  );
}
