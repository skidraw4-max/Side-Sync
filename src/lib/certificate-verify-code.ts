/** LinkedIn certUrl 경로용: 조회 토큰을 URL 세그먼트에 안전하게 넣기 위한 base64url 인코딩 */

export function encodeCertificateVerifyCode(rawToken: string): string {
  return Buffer.from(rawToken, "utf8").toString("base64url");
}

export function decodeCertificateVerifyCode(code: string): string | null {
  try {
    const token = Buffer.from(code, "base64url").toString("utf8");
    return token.length > 0 ? token : null;
  } catch {
    return null;
  }
}
