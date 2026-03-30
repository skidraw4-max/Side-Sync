import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type MannerBonusReason = "accept_bonus" | "completed_bonus";

const DELTA: Record<MannerBonusReason, number> = {
  accept_bonus: 0.5,
  completed_bonus: 1.0,
};

/**
 * 서비스 롤 클라이언트로만 호출. manner_temp_logs UNIQUE로 동일 프로젝트·사유 중복 상승 방지.
 * (Supabase 제네릭이 신규 테이블 insert/update를 never로 두는 경우가 있어 any 경유)
 */
export async function grantMannerTempBonus(
  admin: SupabaseClient<Database>,
  userId: string,
  projectId: string,
  reason: MannerBonusReason
): Promise<void> {
  const delta = DELTA[reason];
  const db = admin as unknown as {
    from: (table: string) => {
      insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string } | null }>;
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          maybeSingle: () => Promise<{
            data: unknown;
            error: { message?: string } | null;
          }>;
        };
      };
      update: (patch: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<{ error: { message?: string } | null }>;
      };
    };
  };

  const { error: insertError } = await db.from("manner_temp_logs").insert({
    user_id: userId,
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

  const { data: prof, error: selErr } = await db.from("profiles").select("manner_temp").eq("id", userId).maybeSingle();

  if (selErr) {
    console.warn("[manner_temp] profile select:", selErr.message);
    return;
  }

  const row = prof as { manner_temp?: number | null } | null;
  const current = typeof row?.manner_temp === "number" && Number.isFinite(row.manner_temp) ? row.manner_temp : 36.5;
  const next = Math.round(Math.min(99.9, Math.max(0, current + delta)) * 10) / 10;

  const { error: updErr } = await db.from("profiles").update({
    manner_temp: next,
    manner_temp_target: `${next}°C`,
    updated_at: new Date().toISOString(),
  }).eq("id", userId);

  if (updErr) {
    console.warn("[manner_temp] profile update:", updErr.message);
  }
}
