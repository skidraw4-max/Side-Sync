import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadCertificateVerifyPayload } from "@/lib/certificate-verify-load";

interface PageProps {
  params: Promise<{ code: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code: codeParam } = await params;
  const code = codeParam?.trim() ?? "";
  const data = await loadCertificateVerifyPayload(code);

  const title = data
    ? `${data.participantName}님 참여 확인`
    : "프로젝트 참여 확인";
  const description = data
    ? `${data.participantName}님의 Side-Sync 사이드 프로젝트 완주·참여를 확인합니다.`
    : "Side-Sync에서 발급한 공개 검증 코드로 프로젝트 참여 사실을 확인하는 페이지입니다.";

  const verifyPath = `/verify/${encodeURIComponent(code)}`;

  return {
    title,
    description,
    alternates: {
      canonical: verifyPath,
    },
    openGraph: {
      title,
      description,
      url: verifyPath,
      siteName: "Side-Sync",
      type: "website",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CertificateVerifyPage({ params }: PageProps) {
  const { code: codeParam } = await params;
  const code = codeParam?.trim() ?? "";

  const admin = createAdminClient();
  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-sm text-slate-600">
        <p className="font-medium text-slate-900">확인 페이지를 불러올 수 없습니다</p>
        <p className="mt-2">서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 필요합니다.</p>
      </div>
    );
  }

  const payload = await loadCertificateVerifyPayload(code, admin);
  if (!payload) {
    notFound();
  }

  const { projectTitle, participantName, issuanceNumber } = payload;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-12">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-[#0A66C2]">
          Side-Sync
        </p>
        <h1 className="mt-2 text-center text-xl font-bold text-slate-900">참여 확인서 검증</h1>
        <p className="mt-1 text-center text-sm text-slate-500">
          아래 정보는 발급 시점의 Side-Sync 기록을 기준으로 합니다.
        </p>
        <dl className="mt-8 space-y-4 text-sm">
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
            <dt className="text-slate-500">프로젝트</dt>
            <dd className="font-semibold text-slate-900">{projectTitle}</dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
            <dt className="text-slate-500">성명</dt>
            <dd className="font-semibold text-slate-900">{participantName}</dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
            <dt className="text-slate-500">발급 번호</dt>
            <dd className="font-mono text-sm font-semibold text-slate-900">{issuanceNumber}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-slate-500">검증 시각</dt>
            <dd className="text-slate-800">
              {format(new Date(), "yyyy년 M월 d일 HH:mm", { locale: ko })}
            </dd>
          </div>
        </dl>
        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          본 페이지는 Side-Sync 내 활동 기록을 바탕으로 한 확인용이며, 법적 효력은 없습니다.
        </p>
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-[#0A66C2] hover:underline">
            Side-Sync 홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
