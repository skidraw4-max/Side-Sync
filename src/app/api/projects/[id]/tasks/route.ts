import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { projectTaskAccessDenied } from "@/lib/api/project-task-access";
import { KANBAN_PRIORITY_SET } from "@/lib/kanban/constants";

function isMissingSortOrderColumn(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("sort_order") &&
    (lower.includes("does not exist") ||
      lower.includes("not exist") ||
      lower.includes("could not find") ||
      lower.includes("schema cache"))
  );
}

function isMissingDueDateColumn(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("due_date") &&
    (lower.includes("does not exist") ||
      lower.includes("not exist") ||
      lower.includes("could not find") ||
      lower.includes("schema cache"))
  );
}

function isMissingDescriptionColumn(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("description") &&
    (lower.includes("does not exist") ||
      lower.includes("not exist") ||
      lower.includes("could not find") ||
      lower.includes("schema cache"))
  );
}

function isMissingRequestedByColumn(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes("requested_by") &&
    (lower.includes("does not exist") ||
      lower.includes("not exist") ||
      lower.includes("could not find") ||
      lower.includes("schema cache"))
  );
}

function selectForInsertRow(row: Record<string, unknown>): string {
  const parts = ["id", "title", "category", "priority", "status", "assignee_id"];
  if ("requested_by" in row) parts.push("requested_by");
  if ("sort_order" in row) parts.push("sort_order");
  if ("due_date" in row) parts.push("due_date");
  if ("description" in row) parts.push("description");
  return parts.join(", ");
}

/**
 * POST /api/projects/[id]/tasks
 * — 팀장·수락 멤버만 태스크 생성 (클라이언트 직접 insert 대체)
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

  /** 신규 업무는 항상 요청 단계로 등록 */
  const status = "requested" as const;

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

  const insertRow = async (row: Record<string, unknown>) =>
    (supabase as any)
      .from("tasks")
      .insert(row)
      .select(selectForInsertRow(row))
      .single();

  let row: Record<string, unknown> = {
    project_id: projectId,
    title,
    category,
    priority,
    status,
    assignee_id,
    requested_by: user.id,
  };
  if (sort_order !== undefined) row.sort_order = sort_order;
  if (due_date !== undefined) row.due_date = due_date;
  if (description !== undefined) row.description = description;

  let { data: inserted, error } = await insertRow(row);

  if (error && sort_order !== undefined && isMissingSortOrderColumn(error.message)) {
    const { sort_order: _so, ...withoutSort } = row;
    row = withoutSort;
    const retry = await insertRow(row);
    inserted = retry.data;
    error = retry.error;
  }

  if (error && due_date !== undefined && isMissingDueDateColumn(error.message)) {
    const { due_date: _dd, ...withoutDue } = row;
    row = withoutDue;
    const retry = await insertRow(row);
    inserted = retry.data;
    error = retry.error;
  }

  if (error && description !== undefined && isMissingDescriptionColumn(error.message)) {
    const { description: _desc, ...withoutDesc } = row;
    row = withoutDesc;
    const retry = await insertRow(row);
    inserted = retry.data;
    error = retry.error;
  }

  if (error && isMissingRequestedByColumn(error.message)) {
    const { requested_by: _rb, ...withoutRb } = row;
    row = withoutRb;
    const retry = await insertRow(row);
    inserted = retry.data;
    error = retry.error;
  }

  if (error && assignee_id) {
    row = { ...row, assignee_id: null };
    const retry = await insertRow(row);
    inserted = retry.data;
    error = retry.error;
  }

  if (error) {
    return NextResponse.json(
      { error: error.message || "업무를 등록하지 못했습니다." },
      { status: 400 }
    );
  }

  return NextResponse.json({ task: inserted });
}
