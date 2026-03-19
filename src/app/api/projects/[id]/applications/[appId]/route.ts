import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type ProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "title" | "team_leader_id" | "recruitment_status"
>;

type ApplicationRow = Pick<
  Database["public"]["Tables"]["applications"]["Row"],
  "id" | "applicant_id" | "status" | "role"
>;

/**
 * PATCH: 지원 상태 변경 (수락/거절)
 * - applications.status 업데이트
 * - 수락 시 지원자에게 "축하합니다! 프로젝트 팀원으로 수락되었습니다." 알림 생성
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id: projectId, appId } = await params;
  if (!projectId || !appId) {
    return NextResponse.json({ error: "Project ID and Application ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: { status?: "accepted" | "rejected" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "accepted" && status !== "rejected") {
    return NextResponse.json({ error: "status must be 'accepted' or 'rejected'" }, { status: 400 });
  }

  const { data } = await supabase
    .from("projects")
    .select("id, title, team_leader_id, recruitment_status")
    .eq("id", projectId)
    .single();

  const project = data as ProjectRow | null;

  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (project.team_leader_id !== user.id) {
    return NextResponse.json({ error: "팀장만 수락/거절할 수 있습니다." }, { status: 403 });
  }

  const { data: appData } = await supabase
    .from("applications")
    .select("id, applicant_id, status, role")
    .eq("id", appId)
    .eq("project_id", projectId)
    .single();

  const application = appData as ApplicationRow | null;
  if (!application) {
    return NextResponse.json({ error: "지원서를 찾을 수 없습니다." }, { status: 404 });
  }

  // 수락 시: 해당 역할 모집 인원이 다 찼는지 검증
  if (status === "accepted") {
    const rawStatus = project.recruitment_status as Array<{ role: string; count?: number; total?: number }> | null;
    const appRole = (application as { role?: string | null }).role?.trim() || null;
    if (appRole && Array.isArray(rawStatus) && rawStatus.length > 0) {
      const roleEntry = rawStatus.find((r) => r.role === appRole || r.role?.trim() === appRole);
      if (roleEntry) {
        const total = roleEntry.total ?? roleEntry.count ?? 1;
        const { count: filled } = await supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId)
          .eq("status", "accepted")
          .eq("role", appRole);
        if ((filled ?? 0) >= total) {
          return NextResponse.json(
            { error: "해당 포지션 모집이 완료되었습니다." },
            { status: 400 }
          );
        }
      }
    }
  }

  const updatePayload = {
    status,
    updated_at: new Date().toISOString(),
  };
  const { error: updateError } = await supabase
    .from("applications")
    // @ts-expect-error Supabase client incorrectly infers 'never' for applications.update()
    .update(updatePayload)
    .eq("id", appId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "상태 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }

  if (status === "accepted" && application.applicant_id) {
    const admin = createAdminClient();
    if (admin) {
      // 지원자에게 알림
      // @ts-expect-error Supabase admin client infers never for insert with custom Database type
      await admin.from("notifications").insert({
        user_id: application.applicant_id,
        title: "축하합니다! 프로젝트 팀원으로 수락되었습니다.",
        message: `${project.title} 프로젝트의 팀원으로 수락되었습니다. 워크스페이스에서 협업을 시작해보세요!`,
        link: `/projects/${projectId}/workspace`,
      });

      // 채팅방에 "OOO님이 새로운 팀원으로 합류했습니다!" 시스템 메시지
      const { data: profileData } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", application.applicant_id)
        .single();
      const profile = profileData as { full_name: string | null } | null;
      const memberName = profile?.full_name?.trim() || "새 팀원";
      const systemContent = `${memberName}님이 새로운 팀원으로 합류했습니다! 환영해주세요! 🎉`;

      let channelId: string | null = null;
      const { data: generalChannelData } = await admin
        .from("chat_channels")
        .select("id")
        .eq("project_id", projectId)
        .eq("slug", "general")
        .maybeSingle();
      const generalChannel = generalChannelData as { id: string } | null;

      if (generalChannel) {
        channelId = generalChannel.id;
      } else {
        const { data: newChannelData } = await admin
          .from("chat_channels")
          // @ts-expect-error Supabase admin client infers never for insert
          .insert({
            project_id: projectId,
            name: "General",
            slug: "general",
            description: "General project discussion",
          })
          .select("id")
          .single();
        const newChannel = newChannelData as { id?: string } | null;
        channelId = newChannel?.id ?? null;
      }

      // @ts-expect-error Supabase admin client infers never for insert with custom Database type
      await admin.from("chat_messages").insert({
        project_id: projectId,
        channel_id: channelId,
        author_id: user.id,
        content: systemContent,
      });
    }
  }

  return NextResponse.json({ ok: true, status });
}
