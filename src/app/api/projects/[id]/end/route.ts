import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantMannerTempBonus } from "@/lib/manner-temp-grant";

type ProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "title" | "team_leader_id"
>;

/**
 * POST: 프로젝트 종료 (팀장 전용)
 * - projects.status → 'completed' (hiring | ongoing 에서만)
 * - 팀원 전원에게 "상호 평가를 완료해주세요" 알림 전송
 * - UPDATE는 서비스 롤이 있으면 RLS와 무관하게 적용(팀장 여부는 위에서 검증)
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

  const { data } = await supabase
    .from("projects")
    .select("id, title, team_leader_id")
    .eq("id", projectId)
    .single();

  const project = data as ProjectRow | null;
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

  const currentStatus = (projectWithStatus as { status?: string } | null)?.status;
  if (currentStatus === "completed") {
    return NextResponse.json(
      { error: "이미 종료된 프로젝트입니다." },
      { status: 400 }
    );
  }

  const patch = {
    status: "completed" as const,
    updated_at: new Date().toISOString(),
  };

  const admin = createAdminClient();
  const updater = admin ?? supabase;
  // Supabase 클라이언트가 union 시 update payload를 never로 추론할 수 있음
  const { error: updateError } = await updater
    .from("projects")
    // @ts-expect-error — projects.update() payload inference
    .update(patch)
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
  const apps = (acceptedApps ?? []) as Array<{ applicant_id: string }>;
  apps.forEach((a) => teamMemberIds.add(a.applicant_id));

  if (teamMemberIds.size > 0) {
    if (admin) {
      for (const memberId of teamMemberIds) {
        // @ts-expect-error Supabase admin client infers never for insert
        await admin.from("notifications").insert({
          user_id: memberId,
          title: "상호 평가를 완료해주세요",
          message: `${project.title} 프로젝트가 종료되었습니다. 팀원들에게 평가를 남겨주세요.`,
          link: `/projects/${projectId}/evaluate`,
        });
      }

      for (const memberId of teamMemberIds) {
        await grantMannerTempBonus(admin, memberId, projectId, "completed_bonus");
      }
    } else {
      console.warn(
        "[projects/end] SUPABASE_SERVICE_ROLE_KEY 없음 — 완료 알림·완료 보너스 매너 온도가 적용되지 않았습니다."
      );
    }
  }

  return NextResponse.json({ ok: true, status: "completed" });
}
