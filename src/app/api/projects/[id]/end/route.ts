import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST: 프로젝트 종료 (팀장 전용)
 * - projects.status → 'completed'
 * - 팀원 전원에게 "상호 평가를 완료해주세요" 알림 전송
 */
export async function POST(
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

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, team_leader_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (project.team_leader_id !== user.id) {
    return NextResponse.json(
      { error: "팀장만 프로젝트를 종료할 수 있습니다." },
      { status: 403 }
    );
  }

  const { data: projectWithStatus } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .single();

  if ((projectWithStatus as { status?: string })?.status === "completed") {
    return NextResponse.json(
      { error: "이미 종료된 프로젝트입니다." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("projects")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "상태 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }

  // 팀원 목록: 팀장 + accepted 지원자
  const teamMemberIds = new Set<string>();
  if (project.team_leader_id) {
    teamMemberIds.add(project.team_leader_id);
  }
  const { data: acceptedApps } = await supabase
    .from("applications")
    .select("applicant_id")
    .eq("project_id", projectId)
    .eq("status", "accepted");
  (acceptedApps ?? []).forEach((a) => teamMemberIds.add(a.applicant_id));

  const admin = createAdminClient();
  if (admin && teamMemberIds.size > 0) {
    for (const memberId of teamMemberIds) {
      await admin.from("notifications").insert({
        user_id: memberId,
        title: "상호 평가를 완료해주세요",
        message: `${project.title} 프로젝트가 종료되었습니다. 팀원들에게 평가를 남겨주세요.`,
        link: `/projects/${projectId}/evaluate`,
      });
    }
  }

  return NextResponse.json({ ok: true, status: "completed" });
}
