import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { mannerTempTargetForDb } from "@/lib/manner-temp-db";

export type MannerBonusReason = "accept_bonus" | "completed_bonus";

const DELTA: Record<MannerBonusReason, number> = {
  accept_bonus: 0.5,
  completed_bonus: 1.0,
};

/**
 * 서비스 롤 클라이언트로만 호출. manner_temp_logs UNIQUE로 동일 프로젝트·사유 중복 상승 방지.
 * PostgREST는 UPDATE가 0행이어도 error가 null일 수 있으므로 .select()로 반환 행을 반드시 확인합니다.
 */
export async function grantMannerTempBonus(
  admin: SupabaseClient<Database>,
  userId: string,
  projectId: string,
  reason: MannerBonusReason
): Promise<void> {
  const uid = typeof userId === "string" ? userId.trim() : "";
  if (!uid) {
    console.warn("[manner_temp] grant skipped: empty userId");
    return;
  }

  const delta = DELTA[reason];
  const db = admin as unknown as {
    from: (t: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string } | null }>;
    };
  };

  const { error: insertError } = await db.from("manner_temp_logs").insert({
    user_id: uid,
    project_id: projectId,
    reason,
  });

  if (insertError) {
    const msg = insertError.message?.toLowerCase() ?? "";
    if (insertError.code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
      return;
    }
    console.warn("[manner_temp] log insert:", insertError.message);
    return;
  }

  const c = admin as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: unknown;
            error: { message?: string; code?: string } | null;
          }>;
        };
      };
      update: (patch: Record<string, unknown>) => {
        eq: (col: string, val: string) => {
          select: (cols: string) => Promise<{
            data: unknown;
            error: { message?: string; code?: string } | null;
          }>;
        };
      };
    };
  };

  const { data: prof, error: selErr } = await c
    .from("profiles")
    .select("id, manner_temp")
    .eq("id", uid)
    .maybeSingle();

  if (selErr) {
    console.warn("[manner_temp] profile select:", selErr.message, { userId: uid });
    return;
  }

  const row = prof as { id?: string; manner_temp?: number | null } | null;
  if (!row?.id) {
    console.warn("[manner_temp] no profiles row for userId (select returned empty):", { userId: uid });
    return;
  }

  if (row.id !== uid) {
    console.warn("[manner_temp] profile id mismatch after select:", { userId: uid, returnedId: row.id });
  }

  const current = typeof row.manner_temp === "number" && Number.isFinite(row.manner_temp) ? row.manner_temp : 36.5;
  const next = Math.round(Math.min(99.9, Math.max(0, current + delta)) * 10) / 10;
  const updatedAt = new Date().toISOString();

  const { data: afterMain, error: updErr } = await c
    .from("profiles")
    .update({
      manner_temp: next,
      manner_temp_target: mannerTempTargetForDb(next),
      updated_at: updatedAt,
    })
    .eq("id", uid)
    .select("id, manner_temp, manner_temp_target, updated_at");

  const rowsMain = Array.isArray(afterMain) ? afterMain : afterMain ? [afterMain] : [];

  console.log("[DEBUG] Update Result:", {
    next,
    updErr,
    userId: uid,
    returnedRowCount: rowsMain.length,
    returnedRows: rowsMain,
  });

  if (!updErr && rowsMain.length === 0) {
    console.warn(
      "[manner_temp] profile update matched 0 rows (PostgREST often omits error). eq id:",
      uid,
      "length:",
      uid.length
    );

    const touchAt = new Date().toISOString();
    const { data: touchData, error: touchErr } = await c
      .from("profiles")
      .update({ updated_at: touchAt })
      .eq("id", uid)
      .select("id, updated_at");

    const touchRows = Array.isArray(touchData) ? touchData : touchData ? [touchData] : [];
    console.log("[DEBUG] Post-update updated_at-only touch:", {
      touchErr,
      touchReturnedCount: touchRows.length,
      touchRows,
    });

    if (!touchErr && touchRows.length === 0) {
      console.warn(
        "[manner_temp] updated_at-only touch also matched 0 rows — 클라이언트가 SUPABASE_SERVICE_ROLE_KEY(service_role)인지, Supabase에서 service_role이 RLS를 우회하는지 확인하세요."
      );
    }
  }

  if (updErr) {
    console.warn("[manner_temp] profile update:", updErr.message);
  }
}
