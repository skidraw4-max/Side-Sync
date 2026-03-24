import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { APPLICATION_STATUS } from "@/lib/application-status";

/**
 * POST: 지원자 본인만 — pending 지원을 canceled 로 변경 (물리 삭제 없음)
 * applicant_id = auth.uid() 조건은 서버에서 검증 + RLS
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id: projectId, appId } = await params;
  if (!projectId?.trim() || !appId?.trim()) {
    return NextResponse.json({ error: "Project ID and Application ID required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const admin = createAdminClient();
  const db = admin ?? supabase;

  const { data: row, error: selErr } = await db
    .from("applications")
    .select("id, status, applicant_id, project_id")
    .eq("id", appId)
    .eq("project_id", projectId)
    .eq("applicant_id", user.id)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }

  const app = row as { id: string; status: string; applicant_id: string; project_id: string } | null;
  if (!app) {
    return NextResponse.json({ error: "지원서를 찾을 수 없습니다." }, { status: 404 });
  }

  if (app.applicant_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (app.status !== APPLICATION_STATUS.PENDING) {
    return NextResponse.json(
      { error: "대기 중인 지원만 취소할 수 있습니다." },
      { status: 400 }
    );
  }

  const { error: upErr } = await db
    .from("applications")
    // @ts-expect-error Supabase client infers never for applications.update
    .update({ status: APPLICATION_STATUS.CANCELED })
    .eq("id", appId)
    .eq("applicant_id", user.id)
    .eq("project_id", projectId)
    .eq("status", APPLICATION_STATUS.PENDING);

  if (upErr) {
    return NextResponse.json({ error: upErr.message || "지원 취소에 실패했습니다." }, { status: 500 });
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  return NextResponse.json({ ok: true });
}
