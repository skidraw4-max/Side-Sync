import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
import { certificateIssuanceNumber, verifyCertificateToken } from "@/lib/certificate-token";
import { decodeCertificateVerifyCode } from "@/lib/certificate-verify-code";
import { isCertificatePublicCodeFormat, resolveCertificateByPublicCode } from "@/lib/certificate-public-code";

export type CertificateVerifyPayload = {
  projectId: string;
  userId: string;
  projectTitle: string;
  participantName: string;
  issuanceNumber: string;
};

/**
 * /verify/[code] 페이지·OG 메타·opengraph-image 에서 공통 사용
 * @param existingAdmin 이미 확보한 클라이언트(페이지 등); 없으면 내부에서 생성
 */
export async function loadCertificateVerifyPayload(
  rawCode: string,
  existingAdmin?: AdminClient | null
): Promise<CertificateVerifyPayload | null> {
  const code = rawCode.trim();
  if (!code) return null;

  const admin = existingAdmin ?? createAdminClient();
  if (!admin) return null;

  let projectId: string;
  let userId: string;

  const token = decodeCertificateVerifyCode(code);
  const fromToken = token ? verifyCertificateToken(token) : null;
  if (fromToken) {
    projectId = fromToken.projectId;
    userId = fromToken.userId;
  } else {
    if (!isCertificatePublicCodeFormat(code)) return null;
    const resolved = await resolveCertificateByPublicCode(admin, code);
    if (!resolved) return null;
    projectId = resolved.projectId;
    userId = resolved.userId;
  }

  const { data: projectRaw } = await admin
    .from("projects")
    .select("id, title, status, team_leader_id")
    .eq("id", projectId)
    .maybeSingle();

  const project = projectRaw as {
    id: string;
    title: string;
    status: string | null;
    team_leader_id: string | null;
  } | null;

  if (!project || project.status !== "completed") return null;

  const { data: appRaw } = await admin
    .from("applications")
    .select("status")
    .eq("project_id", projectId)
    .eq("applicant_id", userId)
    .maybeSingle();

  const app = appRaw as { status: string } | null;
  const isLeader = project.team_leader_id === userId;
  const isAccepted = app?.status === "accepted";
  if (!isLeader && !isAccepted) return null;

  const { data: profileRaw } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const profile = profileRaw as { full_name: string | null } | null;
  const participantName = profile?.full_name?.trim() || "참여자";
  const issuanceNumber = certificateIssuanceNumber(projectId, userId);

  return {
    projectId,
    userId,
    projectTitle: project.title,
    participantName,
    issuanceNumber,
  };
}
