import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database, RecruitmentStatusRow } from "@/types/database";

type CreateProjectBody = {
  title?: string;
  description?: string | null;
  goal?: string | null;
  tech_stack?: string[];
  recruitment_status?: RecruitmentStatusRow[];
};

/**
 * POST /api/projects — 프로젝트 생성 (서버에서 세션·RLS 일관 적용)
 * 클라이언트 직접 insert가 멈추는 환경(Vercel 등) 대비
 */
export async function POST(request: Request) {
  let body: CreateProjectBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "프로젝트 제목을 입력해주세요." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    console.error("[api/projects POST] getUser:", authError);
    return NextResponse.json(
      { error: `인증 확인 실패: ${authError.message}` },
      { status: 401 }
    );
  }
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const tech_stack = Array.isArray(body.tech_stack) ? body.tech_stack : [];
  const recruitment_status = Array.isArray(body.recruitment_status) ? body.recruitment_status : [];

  const row: Database["public"]["Tables"]["projects"]["Insert"] = {
    title,
    description: typeof body.description === "string" ? body.description.trim() || null : null,
    goal: typeof body.goal === "string" ? body.goal.trim() || null : null,
    tech_stack,
    manner_temp_target: "36.5",
    team_leader_id: user.id,
    recruitment_status: recruitment_status.length > 0 ? recruitment_status : null,
  };

  const { data, error } = await (supabase as any)
    .from("projects")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[api/projects POST] insert:", error);
    return NextResponse.json(
      { error: error.message || "프로젝트 저장에 실패했습니다." },
      { status: 500 }
    );
  }

  const id = (data as { id: string } | null)?.id;
  if (!id) {
    return NextResponse.json({ error: "저장 결과를 확인할 수 없습니다." }, { status: 500 });
  }

  return NextResponse.json({ id });
}
