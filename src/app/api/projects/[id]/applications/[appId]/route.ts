import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  applicationPositionKey,
  fetchApplicationCountsByPosition,
  getApplySlotsFromTechStack,
} from "@/lib/project-application-positions";

type ProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "title" | "team_leader_id" | "recruitment_status" | "tech_stack"
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

  let body: { status?: "accepted" | "rejected"; rejectReason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "accepted" && status !== "rejected") {
    return NextResponse.json({ error: "status must be 'accepted' or 'rejected'" }, { status: 400 });
  }

  const rejectReason =
    typeof body.rejectReason === "string" ? body.rejectReason.trim() : "";
  if (status === "rejected" && !rejectReason) {
    return NextResponse.json({ error: "거절 사유를 입력해주세요." }, { status: 400 });
  }

  const { data } = await supabase
    .from("projects")
    .select("id, title, team_leader_id, recruitment_status, tech_stack")
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
    .select("*")
    .eq("id", appId)
    .eq("project_id", projectId)
    .single();

  const raw = appData as Record<string, unknown> | null;
  const application = raw
    ? ({
        id: String(raw.id),
        applicant_id: String(raw.applicant_id),
        status: raw.status as ApplicationRow["status"],
        role: typeof raw.role === "string" ? raw.role : null,
        tech_stack: typeof raw.tech_stack === "string" ? raw.tech_stack : null,
      } as ApplicationRow & { tech_stack: string | null })
    : null;
  if (!application) {
    return NextResponse.json({ error: "지원서를 찾을 수 없습니다." }, { status: 404 });
  }

  // 수락 시: 해당 포지션(tech_stack·role) 합류 인원이 정원을 넘지 않는지 검증 (필수 기술 스택 슬롯 기준)
  if (status === "accepted") {
    const positionKey = applicationPositionKey(application);
    const techArr = Array.isArray(project.tech_stack) ? (project.tech_stack as string[]) : [];
    const slots = getApplySlotsFromTechStack(techArr, project.recruitment_status);
    const slot = slots.find((s) => s.role === positionKey);
    if (!slot) {
      return NextResponse.json(
        { error: "지원 포지션이 프로젝트 필수 기술 스택·모집 설정과 일치하지 않습니다." },
        { status: 400 }
      );
    }
    const statsClient = createAdminClient() ?? supabase;
    const { accepted } = await fetchApplicationCountsByPosition(statsClient, projectId);
    const filled = accepted[positionKey] ?? 0;
    if (filled >= slot.total) {
      return NextResponse.json(
        { error: "해당 포지션 모집이 완료되었습니다." },
        { status: 400 }
      );
    }
  }

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "rejected") {
    updatePayload.rejection_reason = rejectReason;
  }

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

  if (status === "rejected" && application.applicant_id) {
    const admin = createAdminClient();
    if (admin) {
      // @ts-expect-error Supabase admin client infers never for insert with custom Database type
      await admin.from("notifications").insert({
        user_id: application.applicant_id,
        title: "프로젝트 지원 결과",
        message: `사유: ${rejectReason}`,
        link: `/projects/${projectId}`,
      });
    }
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
