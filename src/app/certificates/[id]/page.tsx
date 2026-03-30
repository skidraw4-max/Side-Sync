import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  certificateIssuanceNumber,
  signCertificateToken,
  verifyCertificateToken,
} from "@/lib/certificate-token";
import { ensureCertificatePublicCode } from "@/lib/certificate-public-code";
import {
  buildLinkedInAddCertificationUrl,
  normalizePublicCertificateCodeForLinkedIn,
} from "@/lib/certificate-linkedin-cert-id";
import CertificateClient from "./certificate-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ t?: string }>;
}

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params, searchParams }: PageProps) {
  const { id: projectId } = await params;
  const sp = searchParams ? await searchParams : {};
  const rawToken = typeof sp.t === "string" ? sp.t.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tokenPayload = rawToken ? verifyCertificateToken(rawToken) : null;
  if (rawToken && !tokenPayload) {
    notFound();
  }
  if (tokenPayload && tokenPayload.projectId !== projectId) {
    notFound();
  }

  let viewerUserId: string | null = null;
  if (tokenPayload) {
    viewerUserId = tokenPayload.userId;
  } else if (user) {
    viewerUserId = user.id;
  } else {
    const next = `/certificates/${projectId}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (user && tokenPayload && user.id !== tokenPayload.userId) {
    notFound();
  }

  const admin = createAdminClient();
  const db = admin ?? supabase;

  const { data: projectRaw, error: projectErr } = await db
    .from("projects")
    .select("id, title, status, team_leader_id, created_at, updated_at")
    .eq("id", projectId)
    .maybeSingle();

  if (projectErr || !projectRaw) {
    notFound();
  }

  const project = projectRaw as {
    id: string;
    title: string;
    status: string | null;
    team_leader_id: string | null;
    created_at: string;
    updated_at: string;
  };

  if (project.status !== "completed") {
    notFound();
  }

  const { data: appRaw } = await db
    .from("applications")
    .select("status, role, created_at, updated_at")
    .eq("project_id", projectId)
    .eq("applicant_id", viewerUserId)
    .maybeSingle();

  const app = appRaw as
    | { status: string; role: string | null; created_at: string; updated_at: string }
    | null;

  const isLeader = project.team_leader_id === viewerUserId;
  const isAcceptedMember = app?.status === "accepted";

  if (!isLeader && !isAcceptedMember) {
    notFound();
  }

  if (tokenPayload && !admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-slate-700">
        <p className="font-semibold text-slate-900">링크로만 조회할 수 없습니다</p>
        <p className="mt-2">
          서버에 서비스 롤 키가 설정되어 있지 않아, 확인 링크 없이는 로그인 후 본인 계정으로만 열람할 수
          있습니다.
        </p>
        <p className="mt-4">
          <a href={`/login?next=${encodeURIComponent(`/certificates/${projectId}?t=${encodeURIComponent(rawToken)}`)}`} className="text-blue-600 underline">
            로그인하기
          </a>
        </p>
      </div>
    );
  }

  const { data: profileRaw } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", viewerUserId)
    .maybeSingle();

  const profile = profileRaw as { full_name: string | null } | null;
  const participantName = profile?.full_name?.trim() || "참여자";

  const periodStart =
    isAcceptedMember && app
      ? app.created_at
      : isLeader
        ? project.created_at
        : app?.created_at ?? project.created_at;
  const periodEnd = project.updated_at || project.created_at;

  const periodLabel = `${format(new Date(periodStart), "yyyy년 M월 d일", { locale: ko })} ~ ${format(new Date(periodEnd), "yyyy년 M월 d일", { locale: ko })}`;
  const issuedAtLabel = format(new Date(), "yyyy년 M월 d일", { locale: ko });
  const issuanceNumber = certificateIssuanceNumber(projectId, viewerUserId);
  const roleLabel = app?.role?.trim() || (isLeader ? "프로젝트 리더" : null);

  const rawPublicCode = await ensureCertificatePublicCode(db, projectId, viewerUserId);
  const certificatePublicCode = normalizePublicCertificateCodeForLinkedIn(rawPublicCode);
  if (rawPublicCode && !certificatePublicCode) {
    console.warn(
      "[certificates] project_certificate_codes.code 가 짧은 코드 형식이 아닙니다. LinkedIn certId에는 사용하지 않습니다.",
      String(rawPublicCode).slice(0, 24) + "…"
    );
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "sidesync.io";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const verifySiteOrigin = `${proto}://${host}`;

  let shareUrl: string | null = null;
  if (user && user.id === viewerUserId && !rawToken) {
    const token = signCertificateToken(projectId, viewerUserId);
    shareUrl = `${verifySiteOrigin}/certificates/${projectId}?t=${encodeURIComponent(token)}`;
  }

  const linkedInAddCertificationHref = buildLinkedInAddCertificationUrl({
    verifySiteOrigin,
    projectTitle: project.title,
    certificatePublicCode,
  });

  return (
    <div className="min-h-screen bg-slate-200/80 print:bg-white">
      <CertificateClient
        projectTitle={project.title}
        participantName={participantName}
        roleLabel={roleLabel}
        periodLabel={periodLabel}
        issuanceNumber={issuanceNumber}
        issuedAtLabel={issuedAtLabel}
        shareUrl={shareUrl}
        certificatePublicCode={certificatePublicCode}
        verifySiteOrigin={verifySiteOrigin}
        linkedInAddCertificationHref={linkedInAddCertificationHref}
      />
    </div>
  );
}
