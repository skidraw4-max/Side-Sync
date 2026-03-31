import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { coerceMannerTempFromDb } from "@/lib/manner-temp-coerce";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_IDS = 80;

/**
 * 트렌딩·목록 카드용 — 비로그인 RLS로 profiles를 못 읽을 때, 실제 팀 리더 매너만 공개.
 * 요청 id는 반드시 `projects.team_leader_id`에 등장하는 사용자로 한정 (서비스 롤 검증).
 */
export async function POST(request: Request) {
  let body: { ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = Array.isArray(body.ids) ? body.ids : [];
  const ids = [...new Set(raw.filter((x): x is string => typeof x === "string" && UUID_RE.test(x)))].slice(
    0,
    MAX_IDS
  );

  const admin = createAdminClient();
  if (!admin || ids.length === 0) {
    return NextResponse.json({});
  }

  const { data: projectRows, error: projErr } = await admin
    .from("projects")
    .select("team_leader_id")
    .in("team_leader_id", ids);

  if (projErr) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[leader-manner] projects filter:", projErr.message);
    }
    return NextResponse.json({});
  }

  const allowed = new Set(
    (projectRows ?? [])
      .map((p) => (p as { team_leader_id: string | null }).team_leader_id)
      .filter((x): x is string => typeof x === "string" && x.length > 0)
  );

  const filteredIds = ids.filter((id) => allowed.has(id));
  if (filteredIds.length === 0) {
    return NextResponse.json({});
  }

  const { data, error } = await admin
    .from("profiles")
    .select("id, manner_temp, manner_temp_target")
    .in("id", filteredIds);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[leader-manner] profiles select:", error.message);
    }
    return NextResponse.json({});
  }

  const out: Record<string, { manner_temp: number | null; manner_temp_target: string | null }> = {};
  for (const row of data ?? []) {
    const r = row as { id: string; manner_temp: unknown; manner_temp_target: string | null };
    const mt = coerceMannerTempFromDb(r.manner_temp);
    out[r.id] = {
      manner_temp: mt,
      manner_temp_target: r.manner_temp_target ?? null,
    };
  }

  return NextResponse.json(out);
}
