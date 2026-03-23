import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database, RecruitmentStatusRow } from "@/types/database";

type PatchProjectBody = {
  title?: string;
  description?: string | null;
  goal?: string | null;
  tech_stack?: string[];
  recruitment_status?: RecruitmentStatusRow[] | null;
};

/**
 * PATCH /api/projects/[id] — 팀 리더만 프로젝트 수정
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: "Project ID required" }, { status: 400 });
  }

  let body: PatchProjectBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title =
    typeof body.title === "string" ? body.title.trim() : undefined;
  if (title !== undefined && !title) {
    return NextResponse.json({ error: "프로젝트 제목을 입력해주세요." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: project, error: fetchErr } = await supabase
    .from("projects")
    .select("id, team_leader_id")
    .eq("id", projectId)
    .single();

  if (fetchErr || !project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const row = project as { id: string; team_leader_id: string | null };
  if (row.team_leader_id !== user.id) {
    return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
  }

  const patch: Database["public"]["Tables"]["projects"]["Update"] = {};

  if (title !== undefined) patch.title = title;
  if (body.description !== undefined) {
    patch.description =
      typeof body.description === "string" ? body.description.trim() || null : null;
  }
  if (body.goal !== undefined) {
    patch.goal = typeof body.goal === "string" ? body.goal.trim() || null : null;
  }
  if (Array.isArray(body.tech_stack)) {
    patch.tech_stack = body.tech_stack;
  }
  if (body.recruitment_status !== undefined) {
    patch.recruitment_status =
      Array.isArray(body.recruitment_status) && body.recruitment_status.length > 0
        ? body.recruitment_status
        : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없습니다." }, { status: 400 });
  }

  // updated_at은 일부 환경에서 projects 테이블에 없어 PostgREST 스키마 캐시 오류가 날 수 있어 제외합니다.
  // 필요 시 DB에 컬럼 추가 후 트리거로 갱신하세요.
  const { error: updateErr } = await (supabase as any)
    .from("projects")
    .update(patch)
    .eq("id", projectId);

  if (updateErr) {
    console.error("[api/projects PATCH]", updateErr);
    return NextResponse.json(
      { error: updateErr.message || "저장에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: projectId });
}
