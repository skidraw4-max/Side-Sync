import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ChatRoom from "./ChatRoom";

interface ChatPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ channel?: string }>;
}

const DEFAULT_CHANNELS = [
  { name: "General", slug: "general", description: "General project discussion" },
  { name: "Design Sync", slug: "design-sync", description: "Syncing visual components and brand guidelines" },
  { name: "Development", slug: "development", description: "Code and implementation discussion" },
] as const;

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { id: projectId } = await params;
  const { channel: channelSlug } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: project },
    { data: channels },
    { data: acceptedApps },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, team_leader_id")
      .eq("id", projectId)
      .single(),
    supabase
      .from("chat_channels")
      .select("id, name, slug, description")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("applications")
      .select("applicant_id")
      .eq("project_id", projectId)
      .eq("status", "accepted"),
  ]);

  const projectTyped = project as { id: string; title: string; team_leader_id: string | null } | null;
  type ChannelRow = { id: string; name: string; slug: string; description: string | null };
  let channelsList: ChannelRow[] = ((channels ?? []) as ChannelRow[]);
  if (channelsList.length === 0 && projectTyped) {
    const admin = createAdminClient();
    if (admin) {
      try {
        for (const ch of DEFAULT_CHANNELS) {
          const { error } = await (admin as any).from("chat_channels").insert({
            project_id: projectId,
            name: ch.name,
            slug: ch.slug,
            description: ch.description,
          }).select("id").limit(1).maybeSingle();
          if (error && error.code !== "23505") {
            // 중복 키(23505) 외 오류만 기록 - 민감 정보 노출 방지
          }
        }
        const { data: created } = await (admin as any)
          .from("chat_channels")
          .select("id, name, slug, description")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true });
        channelsList = (created ?? channelsList) as Array<{ id: string; name: string; slug: string; description: string | null }>;
      } catch {
        channelsList = (channels ?? []) as ChannelRow[];
      }
    } else {
      const { data: created } = await (supabase as any).rpc("ensure_project_channels", { p_project_id: projectId });
      if (Array.isArray(created) && created.length > 0) {
        channelsList = created.map((c: { id: string; name: string; slug: string; description: string | null }) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
        }));
      } else {
        const { data: refetched } = await (supabase as any)
          .from("chat_channels")
          .select("id, name, slug, description")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true });
        channelsList = (refetched ?? channelsList) as ChannelRow[];
      }
    }
  }
  const activeChannel = channelsList.find(
    (c) => c.slug === (channelSlug ?? "general")
  ) ?? channelsList[0];
  const channelId = activeChannel?.id ?? null;

  let messagesQuery = supabase
    .from("chat_messages")
    .select("id, project_id, channel_id, author_id, content, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (channelId) {
    const isGeneral = activeChannel?.slug === "general";
    if (isGeneral) {
      messagesQuery = messagesQuery.or(`channel_id.eq.${channelId},channel_id.is.null`);
    } else {
      messagesQuery = messagesQuery.eq("channel_id", channelId);
    }
  } else {
    messagesQuery = messagesQuery.is("channel_id", null);
  }

  const { data: messages } = await messagesQuery;
  const messagesTyped = (messages ?? []) as Array<{
    id: string;
    project_id: string;
    channel_id: string | null;
    author_id: string;
    content: string;
    created_at: string;
  }>;

  const acceptedAppsTyped = (acceptedApps ?? []) as Array<{ applicant_id: string }>;
  const teamMemberIds = new Set<string>();
  if (projectTyped?.team_leader_id) teamMemberIds.add(projectTyped.team_leader_id);
  acceptedAppsTyped.forEach((a) => teamMemberIds.add(a.applicant_id));

  const authorIds = [...new Set(messagesTyped.map((m) => m.author_id))];
  const allIds = new Set([...teamMemberIds, ...authorIds]);
  const { data: profiles } =
    allIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, role")
          .in("id", Array.from(allIds))
      : { data: [] };

  const profilesTyped = (profiles ?? []) as Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
  }>;
  const profileMap = new Map(
    profilesTyped.map((p) => [
      p.id,
      { fullName: p.full_name, avatarUrl: p.avatar_url, role: p.role },
    ])
  );

  const messagesWithAuthor = messagesTyped.map((m) => ({
    ...m,
    author: profileMap.get(m.author_id) ?? {
      fullName: null,
      avatarUrl: null,
      role: null,
    },
  }));

  const channelsForRoom = channelsList.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
  }));

  const teamMembers = profilesTyped
    .filter((p) => teamMemberIds.has(p.id))
    .map((p) => ({
      id: p.id,
      fullName: p.full_name,
      avatarUrl: p.avatar_url,
      role: p.role,
    }));

  const currentUserProfile = user
    ? profileMap.get(user.id) ?? { fullName: null, avatarUrl: null, role: null }
    : null;

  return (
    <ChatRoom
      projectId={projectId}
      projectTitle={projectTyped?.title ?? "Project"}
      activeChannel={activeChannel ? { id: activeChannel.id, name: activeChannel.name, slug: activeChannel.slug, description: activeChannel.description } : null}
      channels={channelsForRoom}
      initialMessages={messagesWithAuthor}
      teamMembers={teamMembers}
      currentUserProfile={currentUserProfile}
    />
  );
}
