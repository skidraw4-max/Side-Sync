import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isPublicCertificateCodeForLinkedIn } from "@/lib/certificate-linkedin-cert-id";

/** LinkedIn 식별번호·공개 검증 URL용 (예: ss-a1b2c3d4e5f6) */
const PREFIX = "ss-";

export function generateCertificatePublicCode(): string {
  return `${PREFIX}${randomBytes(6).toString("hex")}`;
}

export function isCertificatePublicCodeFormat(code: string): boolean {
  return isPublicCertificateCodeForLinkedIn(code);
}

/**
 * 프로젝트·사용자별 공개 코드 1행 보장 (INSERT 충돌 시 재시도 / 재조회)
 * service_role 또는 본인 세션 클라이언트에서 호출
 */
export async function ensureCertificatePublicCode(
  db: SupabaseClient,
  projectId: string,
  userId: string
): Promise<string | null> {
  const pid = projectId.trim();
  const uid = userId.trim();
  if (!pid || !uid) return null;

  const { data: existing, error: selErr } = await db
    .from("project_certificate_codes")
    .select("code")
    .eq("project_id", pid)
    .eq("user_id", uid)
    .maybeSingle();

  if (!selErr && existing && typeof (existing as { code?: string }).code === "string") {
    return (existing as { code: string }).code;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCertificatePublicCode().toLowerCase();
    const { error: insErr } = await db.from("project_certificate_codes").insert({
      project_id: pid,
      user_id: uid,
      code,
    });

    if (!insErr) return code;

    if (insErr.code === "23505") {
      const { data: row } = await db
        .from("project_certificate_codes")
        .select("code")
        .eq("project_id", pid)
        .eq("user_id", uid)
        .maybeSingle();
      if (row && typeof (row as { code?: string }).code === "string") {
        return (row as { code: string }).code;
      }
      continue;
    }

    console.error("[ensureCertificatePublicCode] insert:", insErr);
    return null;
  }

  return null;
}

export async function resolveCertificateByPublicCode(
  db: SupabaseClient,
  rawCode: string
): Promise<{ projectId: string; userId: string } | null> {
  const code = rawCode.trim().toLowerCase();
  if (!isCertificatePublicCodeFormat(code)) return null;

  const { data, error } = await db
    .from("project_certificate_codes")
    .select("project_id, user_id")
    .eq("code", code)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as { project_id?: string; user_id?: string };
  const projectId = row.project_id;
  const userId = row.user_id;
  if (!projectId || !userId) return null;
  return { projectId, userId };
}
