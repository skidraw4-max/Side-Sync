import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { projectTaskAccessDenied } from "@/lib/api/project-task-access";
import { generateTaskWikiDraftMarkdown } from "@/lib/wiki-task-ai";

function templateWikiBody(taskTitle: string, description: string | null): string {
  const t = taskTitle.trim();
  const desc = (description ?? "").trim();
  const overview = desc || "(설명 없음)";
  return `# ${t}\n\n## 개요\n${overview}`;
}

function wikiTitleForTask(taskTitle: string): string {
  return `${taskTitle.trim()} — 위키`;
}

/**
 * GET /api/projects/[id]/tasks/[taskId]/wiki
 * — 해당 업무에 연결된 task_wiki_pages 행 (없으면 wiki: null)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: projectId, taskId } = await params;
  if (!projectId || !taskId) {
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

  const { data: taskRow, error: taskErr } = await supabase
    .from("tasks")
    .select("id, project_id")
    .eq("id", taskId)
    .maybeSingle();

  const tr = taskRow as { id: string; project_id: string } | null;
  if (taskErr || !tr || tr.project_id !== projectId) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다." }, { status: 404 });
  }

  /* task_wiki_pages — Database 스키마에 Relationships가 없는 테이블과 혼용 시 insert 타입이 never로 막히는 경우가 있어 완화 */
  const { data: wiki, error: wikiErr } = await (supabase as any)
    .from("task_wiki_pages")
    .select("id, task_id, project_id, title, body, created_at, updated_at")
    .eq("task_id", taskId)
    .maybeSingle();

  if (wikiErr) {
    return NextResponse.json(
      { error: wikiErr.message || "위키를 불러오지 못했습니다." },
      { status: 400 }
    );
  }

  return NextResponse.json({ wiki: wiki ?? null });
}

/**
 * POST /api/projects/[id]/tasks/[taskId]/wiki
 * — 연결 위키가 없을 때 생성. `generate_ai`: true이면 설명 기반 AI 초안 시도(Gemini).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: projectId, taskId } = await params;
  if (!projectId || !taskId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    }
  } catch {
    body = {};
  }

  const generateAi = body.generate_ai === true;

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

  const { data: taskRow, error: taskErr } = await supabase
    .from("tasks")
    .select("id, project_id, title, description")
    .eq("id", taskId)
    .single();

  const tr = taskRow as {
    id: string;
    project_id: string;
    title: string;
    description: string | null;
  } | null;

  if (taskErr || !tr || tr.project_id !== projectId) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: existing } = await (supabase as any)
    .from("task_wiki_pages")
    .select("id")
    .eq("task_id", taskId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "이미 위키가 있습니다." }, { status: 409 });
  }

  let wikiBody = templateWikiBody(tr.title, tr.description);
  let aiApplied = false;
  if (generateAi && tr.description?.trim()) {
    const draft = await generateTaskWikiDraftMarkdown(tr.title, tr.description);
    if (draft) {
      wikiBody = draft;
      aiApplied = true;
    }
  }

  const { data: inserted, error: insErr } = await (supabase as any)
    .from("task_wiki_pages")
    .insert({
      task_id: taskId,
      project_id: projectId,
      title: wikiTitleForTask(tr.title),
      body: wikiBody,
    })
    .select("id, task_id, project_id, title, body, created_at, updated_at")
    .single();

  if (insErr) {
    return NextResponse.json(
      { error: insErr.message || "위키를 만들지 못했습니다." },
      { status: 400 }
    );
  }

  return NextResponse.json({ wiki: inserted, wiki_ai_applied: aiApplied });
}

/**
 * PATCH /api/projects/[id]/tasks/[taskId]/wiki
 * — 본문·제목 수정
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

  const denied = await projectTaskAccessDenied(supabase, projectId, user.id);
  if (denied) return denied;

  const { data: taskRow, error: taskErr } = await supabase
    .from("tasks")
    .select("id, project_id")
    .eq("id", taskId)
    .maybeSingle();

  const tr = taskRow as { id: string; project_id: string } | null;
  if (taskErr || !tr || tr.project_id !== projectId) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다." }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) {
      return NextResponse.json({ error: "제목이 비어 있습니다." }, { status: 400 });
    }
    patch.title = t.slice(0, 500);
  }
  if (typeof body.body === "string") {
    patch.body = body.body.slice(0, 64000);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "수정할 내용이 없습니다." }, { status: 400 });
  }

  const { data: updated, error: upErr } = await (supabase as any)
    .from("task_wiki_pages")
    .update(patch)
    .eq("task_id", taskId)
    .select("id, task_id, project_id, title, body, created_at, updated_at")
    .maybeSingle();

  if (upErr) {
    return NextResponse.json(
      { error: upErr.message || "위키를 저장하지 못했습니다." },
      { status: 400 }
    );
  }

  if (!updated) {
    return NextResponse.json({ error: "위키를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ wiki: updated });
}
