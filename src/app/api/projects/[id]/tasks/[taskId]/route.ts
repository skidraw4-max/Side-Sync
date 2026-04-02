import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { projectTaskAccessDenied } from "@/lib/api/project-task-access";
import type { KanbanTaskStatus } from "@/lib/kanban/constants";
import { KANBAN_PRIORITY_SET, KANBAN_STATUS_SET } from "@/lib/kanban/constants";
import {
  transitionRequiresStatusComment,
  validateStatusTransition,
} from "@/lib/kanban/task-status-policy";

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

  const denied = await projectTaskAccessDenied(supabase, projectId, user.id);
  if (denied) return denied;

  const { data: taskRow, error: taskErr } = await supabase
    .from("tasks")
    .select("id, project_id, status, assignee_id, requested_by")
    .eq("id", taskId)
    .single();

  const tr = taskRow as {
    id: string;
    project_id: string;
    status: string;
    assignee_id: string | null;
    requested_by: string | null;
  } | null;

  if (taskErr || !tr || tr.project_id !== projectId) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다." }, { status: 404 });
  }

  const { data: projRow } = await supabase
    .from("projects")
    .select("team_leader_id")
    .eq("id", projectId)
    .single();

  const teamLeaderId = (projRow as { team_leader_id: string | null } | null)?.team_leader_id ?? null;

  const currentStatus = tr.status as KanbanTaskStatus;
  const nextStatus =
    typeof body.status === "string" && KANBAN_STATUS_SET.has(body.status)
      ? (body.status as KanbanTaskStatus)
      : null;

  const statusCommentRaw =
    typeof body.status_comment === "string" ? body.status_comment.trim() : "";
  const statusComment = statusCommentRaw ? statusCommentRaw.slice(0, 4000) : "";

  if (nextStatus !== null && nextStatus !== currentStatus) {
    const v = validateStatusTransition({
      from: currentStatus,
      to: nextStatus,
      userId: user.id,
      assigneeId: tr.assignee_id,
      teamLeaderId,
      requestedBy: tr.requested_by,
      statusComment: statusComment || undefined,
    });
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 403 });
    }
  }

  const patch: Record<string, unknown> = {};

  if (nextStatus !== null) {
    patch.status = nextStatus;
  }

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) {
      return NextResponse.json({ error: "제목이 비어 있습니다." }, { status: 400 });
    }
    patch.title = t;
  }

  if (typeof body.priority === "string") {
    if (!KANBAN_PRIORITY_SET.has(body.priority)) {
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

  if (body.sort_order !== undefined && body.sort_order !== null) {
    const n = typeof body.sort_order === "number" ? body.sort_order : Number(body.sort_order);
    if (!Number.isInteger(n) || n < 0) {
      return NextResponse.json({ error: "유효하지 않은 sort_order입니다." }, { status: 400 });
    }
    patch.sort_order = n;
  }

  if ("description" in body) {
    if (body.description === null) {
      patch.description = null;
    } else if (typeof body.description === "string") {
      const d = body.description.trim();
      patch.description = d.length === 0 ? null : d.slice(0, 8000);
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase 환경 변수가 설정되지 않았습니다." }, { status: 500 });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const patchUrl = new URL(`${supabaseUrl}/rest/v1/tasks`);
  patchUrl.searchParams.set("id", `eq.${taskId}`);
  patchUrl.searchParams.set("project_id", `eq.${projectId}`);

  const tryPatch = async (candidate: Record<string, unknown>) => {
    const res = await fetch(patchUrl.toString(), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${session.access_token}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(candidate),
    });

    if (res.ok) return { ok: true as const };
    const text = await res.text().catch(() => "");
    return { ok: false as const, status: res.status, text };
  };

  const missingCol = (lower: string, col: string) =>
    lower.includes(col) &&
    (lower.includes("does not exist") ||
      lower.includes("not exist") ||
      lower.includes("could not find") ||
      lower.includes("schema cache") ||
      (lower.includes("no attribute") && lower.includes(col)));

  let candidate: Record<string, unknown> = { ...patch };
  let lastErr: { status: number; text: string } | null = null;

  for (let attempt = 0; attempt < 24; attempt++) {
    if (Object.keys(candidate).length === 0) break;
    const result = await tryPatch(candidate);
    if (result.ok) {
      if (
        nextStatus !== null &&
        nextStatus !== currentStatus &&
        transitionRequiresStatusComment(currentStatus, nextStatus) &&
        statusComment
      ) {
        const { error: cErr } = await (supabase as any).from("task_comments").insert({
          task_id: taskId,
          project_id: projectId,
          author_id: user.id,
          body: statusComment,
          transition: `to_${nextStatus}`,
        });
        if (cErr) {
          return NextResponse.json(
            { error: cErr.message || "코멘트 저장에 실패했습니다." },
            { status: 400 }
          );
        }
      }
      return NextResponse.json({ ok: true });
    }
    lastErr = { status: result.status, text: result.text };
    const lower = result.text?.toLowerCase?.() ?? "";

    const next = { ...candidate };
    let changed = false;
    if ("due_date" in next && missingCol(lower, "due_date")) {
      delete next.due_date;
      changed = true;
    } else if ("sort_order" in next && missingCol(lower, "sort_order")) {
      delete next.sort_order;
      changed = true;
    } else if ("description" in next && missingCol(lower, "description")) {
      delete next.description;
      changed = true;
    } else if (
      "updated_at" in next &&
      (missingCol(lower, "updated_at") || lower.includes("schema cache"))
    ) {
      delete next.updated_at;
      changed = true;
    } else if (lower.includes("schema cache")) {
      if ("due_date" in next) delete next.due_date;
      else if ("sort_order" in next) delete next.sort_order;
      else if ("description" in next) delete next.description;
      else break;
      changed = true;
    }

    if (!changed) break;
    candidate = next;
  }

  if (!lastErr) {
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json(
    { error: lastErr.text || `저장에 실패했습니다. (HTTP ${lastErr.status})` },
    { status: 500 }
  );
}

/**
 * DELETE /api/projects/[id]/tasks/[taskId]
 * — 팀장·수락 멤버만 삭제 (UI 연동은 추후 가능)
 */
export async function DELETE(
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

  const { data: taskRow } = await supabase
    .from("tasks")
    .select("id, project_id")
    .eq("id", taskId)
    .single();

  const tr = taskRow as { id: string; project_id: string } | null;
  if (!tr || tr.project_id !== projectId) {
    return NextResponse.json({ error: "업무를 찾을 수 없습니다." }, { status: 404 });
  }

  const { error } = await (supabase as any)
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json(
      { error: error.message || "삭제에 실패했습니다." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
