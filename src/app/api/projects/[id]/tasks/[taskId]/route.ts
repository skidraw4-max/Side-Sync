import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STATUSES = new Set(["todo", "doing", "done"]);
const PRIORITIES = new Set(["high", "medium", "low"]);

/**
 * PATCH /api/projects/[id]/tasks/[taskId]
 * — 프로젝트 팀장 또는 수락된 멤버만 해당 프로젝트의 태스크 수정 (RLS·클라이언트 이슈 대비)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: projectId, taskId } = await params;
  if (!projectId || !taskId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, team_leader_id")
    .eq("id", projectId)
    .single();

  const p = project as { id: string; team_leader_id: string | null } | null;
  if (!p) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const isLeader = p.team_leader_id === user.id;
  const { data: accepted } = await supabase
    .from("applications")
    .select("id")
    .eq("project_id", projectId)
    .eq("applicant_id", user.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (!isLeader && !accepted) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { data: taskRow } = await supabase
    .from("tasks")
    .select("id, project_id")
    .eq("id", taskId)
    .single();

  const tr = taskRow as { id: string; project_id: string } | null;
  if (!tr || tr.project_id !== projectId) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {
    updated_at:
      typeof body.updated_at === "string" ? body.updated_at : new Date().toISOString(),
  };

  if (typeof body.status === "string") {
    if (!STATUSES.has(body.status)) {
      return NextResponse.json({ error: "유효하지 않은 상태입니다." }, { status: 400 });
    }
    patch.status = body.status;
  }

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) {
      return NextResponse.json({ error: "제목이 비어 있습니다." }, { status: 400 });
    }
    patch.title = t;
  }

  if (typeof body.priority === "string") {
    if (!PRIORITIES.has(body.priority)) {
      return NextResponse.json({ error: "유효하지 않은 우선순위입니다." }, { status: 400 });
    }
    patch.priority = body.priority;
  }

  if ("assignee_id" in body) {
    const aid = body.assignee_id;
    if (aid === null || aid === "") {
      patch.assignee_id = null;
    } else if (typeof aid === "string" && !aid.startsWith("__role_")) {
      patch.assignee_id = aid;
    } else {
      patch.assignee_id = null;
    }
  }

  if (body.due_date === null || body.due_date === "") {
    patch.due_date = null;
  } else if (typeof body.due_date === "string") {
    patch.due_date = body.due_date;
  }

  const { error } = await (supabase as any)
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .eq("project_id", projectId);

  if (error) {
    console.error("[PATCH task]", error);
    return NextResponse.json(
      { error: error.message || "저장에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
