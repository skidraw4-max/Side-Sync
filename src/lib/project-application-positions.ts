import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** 지원서 행에서 모집 포지션 키 (tech_stack 우선, 없으면 role) */
export function applicationPositionKey(row: {
  tech_stack?: string | null;
  role?: string | null;
}): string {
  const t = row.tech_stack?.trim();
  const r = row.role?.trim();
  return t || r || "General";
}

/** recruitment_status JSON → 슬롯 목록 */
export function parseRecruitmentSlots(recruitment_status: unknown): { role: string; total: number }[] {
  if (!Array.isArray(recruitment_status)) return [];
  return recruitment_status.map((item) => {
    const r = item as { role?: string; count?: number; total?: number };
    const role = typeof r.role === "string" && r.role.trim() ? r.role.trim() : "General";
    const total =
      typeof r.total === "number" && r.total >= 0
        ? r.total
        : typeof r.count === "number" && r.count >= 0
          ? r.count
          : 1;
    return { role, total };
  });
}

/** 포지션별 합류(accepted)·대기(pending) 건수 — RLS 우회 시 service role 클라이언트 권장 */
export async function fetchApplicationCountsByPosition(
  client: SupabaseClient<Database>,
  projectId: string
): Promise<{ accepted: Record<string, number>; pending: Record<string, number> }> {
  const accepted: Record<string, number> = {};
  const pending: Record<string, number> = {};
  const { data, error } = await client
    .from("applications")
    .select("tech_stack, role, status")
    .eq("project_id", projectId)
    .in("status", ["accepted", "pending"]);

  if (error || !data) {
    return { accepted, pending };
  }

  for (const row of data) {
    const r = row as { tech_stack?: string | null; role?: string | null; status?: string };
    const key = applicationPositionKey(r);
    if (r.status === "accepted") {
      accepted[key] = (accepted[key] ?? 0) + 1;
    } else if (r.status === "pending") {
      pending[key] = (pending[key] ?? 0) + 1;
    }
  }
  return { accepted, pending };
}
