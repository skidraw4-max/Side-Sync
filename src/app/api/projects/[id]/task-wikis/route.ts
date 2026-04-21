import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { projectTaskAccessDenied } from "@/lib/api/project-task-access";
import type { TaskWikiListEntry } from "@/types/kanban";

/**
 * GET /api/projects/[id]/task-wikis
 * — 프로젝트에 속한 연결 위키 목록(칸반 단계별 그룹화는 클라이언트에서)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const denied = await projectTaskAccessDenied(supabase, projectId, user.id);
  if (denied) return denied;

  const { data, error } = await (supabase as any)
    .from("task_wiki_pages")
    .select("id, title, task_id, associated_status")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message || "위키 목록을 불러오지 못했습니다.", wikis: [] as TaskWikiListEntry[] },
      { status: 400 }
    );
  }

  return NextResponse.json({ wikis: (data ?? []) as TaskWikiListEntry[] });
}
