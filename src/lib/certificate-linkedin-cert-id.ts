/**
 * 링크드인 자격증 식별번호(약 80자 제한) — DB project_certificate_codes.code 형식만 허용.
 * 긴 서명 토큰·base64url 등은 절대 certId로 쓰지 않음 (클라이언트에서도 동일 규칙).
 */

export const LINKEDIN_CERT_ID_PATTERN = /^ss-[a-f0-9]{12}$/i;

export function isPublicCertificateCodeForLinkedIn(value: string): boolean {
  return LINKEDIN_CERT_ID_PATTERN.test(value.trim());
}

/** props·DB 값이 있어도 형식이 맞을 때만 반환. 긴 토큰이 섞여 있으면 null */
export function normalizePublicCertificateCodeForLinkedIn(
  publicCode: string | null | undefined
): string | null {
  if (publicCode == null || typeof publicCode !== "string") return null;
  const s = publicCode.trim();
  if (!s) return null;
  if (!isPublicCertificateCodeForLinkedIn(s)) return null;
  return s.toLowerCase();
}

/**
 * 링크드인 "자격 증명 추가" URL — 서버에서만 조립해 RSC/HTML에 넣으면
 * 클라이언트 번들이 옛날 로직이어도 짧은 certId·certUrl이 보장됨.
 */
export function buildLinkedInAddCertificationUrl(input: {
  verifySiteOrigin: string;
  projectTitle: string;
  /** 이미 normalize 된 ss- 코드 또는 원문(내부에서 검증) */
  certificatePublicCode: string | null | undefined;
}): string | null {
  const certId = normalizePublicCertificateCodeForLinkedIn(input.certificatePublicCode);
  if (!certId) return null;

  const origin = input.verifySiteOrigin.trim().replace(/\/$/, "");
  const certUrl = `${origin}/verify/${certId}`;

  const now = new Date();
  const issueYear = String(now.getFullYear());
  const issueMonth = String(now.getMonth() + 1);
  const name = `[Side-Sync] ${input.projectTitle} 참여 확인서`;

  return (
    "https://www.linkedin.com/profile/add?startTask=" +
    encodeURIComponent("CERTIFICATION_NAME") +
    "&name=" +
    encodeURIComponent(name) +
    "&organizationName=" +
    encodeURIComponent("Side-Sync") +
    "&issueYear=" +
    encodeURIComponent(issueYear) +
    "&issueMonth=" +
    encodeURIComponent(issueMonth) +
    "&certUrl=" +
    encodeURIComponent(certUrl) +
    "&certId=" +
    encodeURIComponent(certId)
  );
}
