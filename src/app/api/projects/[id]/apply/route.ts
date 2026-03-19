import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

type ProjectRow = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "team_leader_id"
>;

/**
 * POST: 프로젝트 지원 신청
 * - applications 테이블에 저장 (applicant_id, project_id, message, role, status: pending)
 * - 팀장에게 notifications 테이블에 "새로운 지원자가 있습니다!" 알림 생성
 */
export async function POST(
  request: Request,
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

  let body: { motivation?: string; role?: string; agreeShareProfile?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const motivation = typeof body.motivation === "string" ? body.motivation.trim() : "";
  if (!motivation) {
    return NextResponse.json({ error: "지원 동기를 입력해주세요." }, { status: 400 });
  }

  if (!body.agreeShareProfile) {
    return NextResponse.json(
      { error: "프로필·포트폴리오 공유에 동의해주세요." },
      { status: 400 }
    );
  }

  const role = typeof body.role === "string" ? body.role.trim() : null;

  // 프로젝트 및 팀장 조회
  const { data, error: projectError } = await supabase
    .from("projects")
    .select("id, team_leader_id")
    .eq("id", projectId)
    .single();

  const project = data as ProjectRow | null;
  if (projectError || !project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (project.team_leader_id === user.id) {
    return NextResponse.json(
      { error: "팀장 본인은 지원할 수 없습니다." },
      { status: 403 }
    );
  }

  // 이미 지원했는지 확인
  const { data: existing } = await supabase
    .from("applications")
    .select("id")
    .eq("project_id", projectId)
    .eq("applicant_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "이미 지원했습니다." },
      { status: 409 }
    );
  }

  // applications 삽입
  const insertPayload: {
    project_id: string;
    applicant_id: string;
    message: string;
    status: "pending";
    role?: string;
  } = {
    project_id: projectId,
    applicant_id: user.id,
    message: motivation,
    status: "pending",
  };
  if (role) insertPayload.role = role;

  // @ts-expect-error Supabase client incorrectly infers 'never' for applications.insert()
  const { error: insertError } = await supabase.from("applications").insert(insertPayload);

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message || "지원 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  // 팀장에게 알림 생성 (Admin 클라이언트로 RLS 우회)
  if (project.team_leader_id) {
    const admin = createAdminClient();
    if (admin) {
      // @ts-expect-error Supabase admin client infers never for insert with custom Database type
      await admin.from("notifications").insert({
        user_id: project.team_leader_id,
        title: "새로운 지원자가 있습니다!",
        message: "프로젝트에 새로운 지원 요청이 들어왔습니다. 지원자를 검토해보세요.",
        link: `/projects/${projectId}/manage`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
