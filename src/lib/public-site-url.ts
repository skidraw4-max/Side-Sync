/**
 * OAuth·세션 콜백 후 리다이렉트에 사용할 공개 오리진.
 *
 * 프로덕션에서 `redirectTo`가 만료된 preview `*.vercel.app`를 가리키면
 * Vercel에서 DEPLOYMENT_NOT_FOUND(404)가 날 수 있음 → 캐노니컬 도메인으로 고정.
 *
 * 다른 도메인에 배포할 때는 Vercel에 `NEXT_PUBLIC_SITE_URL`을 설정하세요.
 */
const PRODUCTION_FALLBACK_ORIGIN = "https://sidesync.io";

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, "");
}

/** 서버: Request 기준 (콜백 라우트 등) */
export function getPublicSiteOriginFromRequest(request: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
    ? normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    : "";
  if (fromEnv) return fromEnv;

  const forwardedRaw = request.headers.get("x-forwarded-host");
  const forwardedHost = forwardedRaw?.split(",")[0]?.trim()?.split(":")[0];
  const forwardedProto =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const url = new URL(request.url);
  if (process.env.NODE_ENV === "production" && url.hostname.endsWith(".vercel.app")) {
    return PRODUCTION_FALLBACK_ORIGIN;
  }

  return url.origin;
}

/** 클라이언트: OAuth redirectTo 베이스 */
export function getOAuthRedirectOrigin(): string {
  if (typeof window === "undefined") {
    return "";
  }
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
    ? normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    : "";
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    const { hostname } = window.location;
    if (hostname.endsWith(".vercel.app")) {
      return PRODUCTION_FALLBACK_ORIGIN;
    }
  }

  return window.location.origin;
}
