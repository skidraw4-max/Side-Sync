import { createHmac, timingSafeEqual } from "crypto";

const VERSION = "v1";

function getSecret(): string {
  const fromEnv = process.env.CERTIFICATE_TOKEN_SECRET?.trim();
  if (fromEnv && fromEnv.length >= 16) return fromEnv;
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (sr && sr.length >= 32) return sr.slice(0, 48);
  return "side-sync-dev-certificate-token-secret-change-me";
}

/** 조회용 서명 토큰 (URL `t` 파라미터). payload: v1|projectId|userId */
export function signCertificateToken(projectId: string, userId: string): string {
  const secret = getSecret();
  const payload = `${VERSION}|${projectId}|${userId}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
  const enc = Buffer.from(payload, "utf8").toString("base64url");
  return `${enc}.${sig}`;
}

export function verifyCertificateToken(token: string): { projectId: string; userId: string } | null {
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [enc, sig] = parts;
  if (!enc || !sig || sig.length !== 32) return null;
  let payload: string;
  try {
    payload = Buffer.from(enc, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expectedSig = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
  try {
    if (!timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expectedSig, "utf8"))) return null;
  } catch {
    return null;
  }
  const segs = payload.split("|");
  if (segs.length !== 3 || segs[0] !== VERSION) return null;
  const [, projectId, userId] = segs;
  if (!projectId || !userId) return null;
  return { projectId, userId };
}

/** 증명서에 인쇄되는 고정 발급 번호 (동일 프로젝트·동일 사용자면 항상 동일) */
export function certificateIssuanceNumber(projectId: string, userId: string): string {
  const secret = getSecret();
  const raw = createHmac("sha256", secret).update(`cert:${projectId}:${userId}`).digest("hex");
  return `SS-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`.toUpperCase();
}
