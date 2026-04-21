import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { projectTaskAccessDenied } from "@/lib/api/project-task-access";
import { KANBAN_PRIORITY_SET } from "@/lib/kanban/constants";
import { generateTaskWikiDraftMarkdown } from "@/lib/wiki-task-ai";

/**
 * POST /api/projects/[id]/tasks
 * — 팀장·수락 멤버만 태스크 생성 (클라이언트 직접 insert 대체)
 * — DB 함수 `create_task_with_wiki`로 업무와 연결 위키를 한 트랜잭션에서 생성
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "제목이 비어 있습니다." }, { status: 400 });
  }

  const priority = typeof body.priority === "string" ? body.priority : "";
  if (!KANBAN_PRIORITY_SET.has(priority)) {
    return NextResponse.json({ error: "유효하지 않은 우선순위입니다." }, { status: 400 });
  }

  const category =
    typeof body.category === "string" && body.category.trim() ? body.category.trim() : "GENERAL";

  let assignee_id: string | null = null;
  if ("assignee_id" in body) {
    const aid = body.assignee_id;
    if (aid === null || aid === "") assignee_id = null;
    else if (typeof aid === "string" && !aid.startsWith("__role_")) assignee_id = aid;
  }

  let sort_order: number | undefined;
  if (body.sort_order !== undefined && body.sort_order !== null) {
    const n = typeof body.sort_order === "number" ? body.sort_order : Number(body.sort_order);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: "유효하지 않은 sort_order입니다." }, { status: 400 });
    }
    sort_order = n;
  }

  let due_date: string | undefined;
  if (typeof body.due_date === "string" && body.due_date.trim()) {
    due_date = body.due_date.trim();
  }

  let description: string | null | undefined;
  if ("description" in body) {
    if (body.description === null) {
      description = null;
    } else if (typeof body.description === "string") {
      const d = body.description.trim();
      description = d.length === 0 ? null : d.slice(0, 8000);
    }
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

  if (!assignee_id) {
    return NextResponse.json(
      { error: "요청 단계에서는 담당자를 지정해 주세요." },
      { status: 400 }
    );
  }
  if (due_date === undefined) {
    return NextResponse.json(
      { error: "요청 단계에서는 마감일을 지정해 주세요." },
      { status: 400 }
    );
  }

  /* RPC 인자 타입 — Database.Functions와 Postgrest GenericFunction 추론이 맞지 않을 때가 있어 완화 */
  const { data: rpcData, error } = await (supabase as any).rpc("create_task_with_wiki", {
    p_project_id: projectId,
    p_title: title,
    p_category: category,
    p_priority: priority,
    p_assignee_id: assignee_id,
    p_requested_by: user.id,
    p_sort_order: sort_order ?? null,
    p_due_date: due_date,
    p_description: description ?? null,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "업무를 등록하지 못했습니다." },
      { status: 400 }
    );
  }

  const payload = rpcData as { task?: unknown; wiki?: unknown } | null;
  if (!payload?.task) {
    return NextResponse.json(
      { error: "업무를 등록하지 못했습니다." },
      { status: 400 }
    );
  }

  const taskRow = payload.task as { id: string };
  let wikiOut = payload.wiki;
  let wikiAiApplied = false;

  if (description?.trim()) {
    const draft = await generateTaskWikiDraftMarkdown(title, description);
    if (draft) {
      const { data: updatedWiki, error: wikiUpErr } = await (supabase as any)
        .from("task_wiki_pages")
        .update({ body: draft })
        .eq("task_id", taskRow.id)
        .select("id, task_id, project_id, title, body, created_at, updated_at")
        .maybeSingle();

      if (!wikiUpErr && updatedWiki) {
        wikiOut = updatedWiki;
        wikiAiApplied = true;
      }
    }
  }

  return NextResponse.json({
    task: payload.task,
    wiki: wikiOut,
    wiki_ai_applied: wikiAiApplied,
  });
}
