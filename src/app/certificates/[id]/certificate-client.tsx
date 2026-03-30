"use client";

import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { BrandLogoMark } from "@/components/BrandLogo";
import { Printer, FileDown, Loader2, CircleHelp } from "lucide-react";
import { normalizePublicCertificateCodeForLinkedIn } from "@/lib/certificate-linkedin-cert-id";

const NAVY = "#1e293b";
const certSerif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

/** 역할 라벨에 따라 참여·마일스톤 요약 불릿 생성 */
function getParticipationMilestones(roleLabel: string | null): string[] {
  const label = roleLabel?.trim() ?? "";
  const items: string[] = [];

  if (/기획|plan|pm|기획자|product|제품/i.test(label)) {
    items.push("프로젝트 기획·요구사항 정리 및 범위·일정 조율에 참여하였습니다.");
  }
  if (/디자인|design|ui|ux|figma|그래픽/i.test(label)) {
    items.push("UI/UX 및 시각 디자인 산출·검토를 통한 사용자 경험 기여를 수행하였습니다.");
  }
  if (/개발|dev|engineer|엔지니어|프론트|백엔드|full\s*stack|풀스택|react|node/i.test(label)) {
    items.push("소프트웨어 설계·구현·테스트 및 배포에 따른 기술 산출을 수행하였습니다.");
  }
  if (/리더|leader|팀장|프로젝트\s*리더/i.test(label)) {
    items.push("팀 리더로서 모집·역할 배정 및 워크스페이스 운영을 주도하였습니다.");
  }

  const core: [string, string] = [
    "Side-Sync 워크스페이스(칸반·채팅·공지)를 통한 협업·산출물 관리 프로세스를 이행하였습니다.",
    "플랫폼 기준에 따라 프로젝트 완료(Completed) 처리 및 본 증명서 발급 요건을 충족하였습니다.",
  ];

  if (items.length === 0) {
    return [
      "등록된 프로젝트 내에서 담당 역할에 따른 산출물·협업 활동을 수행하였습니다.",
      ...core,
    ];
  }

  return [...items, ...core];
}

const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-md border border-[#1e293b] bg-white px-4 py-2 text-sm font-medium text-[#1e293b] transition-colors hover:bg-[#1e293b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[#1e293b]";

const btnOutlineIcon =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1e293b] bg-white text-[#1e293b] transition-colors hover:bg-[#1e293b] hover:text-white";

export interface CertificateClientProps {
  projectTitle: string;
  participantName: string;
  roleLabel: string | null;
  periodLabel: string;
  issuanceNumber: string;
  issuedAtLabel: string;
  shareUrl: string | null;
  certificatePublicCode: string | null;
  verifySiteOrigin: string;
  linkedInAddCertificationHref: string | null;
}

function OfficialSeal() {
  return (
    <div
      className="flex h-[5.75rem] w-[5.75rem] shrink-0 flex-col items-center justify-center rounded-full border-[3px] border-[#1e40af] bg-white shadow-[0_2px_12px_rgba(30,64,175,0.22)] ring-2 ring-[#93c5fd]/90 ring-offset-2 ring-offset-white"
      aria-hidden
    >
      <span
        className="text-[0.45rem] font-bold uppercase tracking-[0.22em] text-[#1e293b]"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        Official
      </span>
      <span className="mt-1 text-center text-[0.72rem] font-bold leading-none text-[#1d4ed8]">
        Side-Sync
      </span>
      <span className="mt-1 text-[0.48rem] font-semibold tracking-[0.08em] text-slate-500">
        Platform
      </span>
    </div>
  );
}

export default function CertificateClient({
  projectTitle,
  participantName,
  roleLabel,
  periodLabel,
  issuanceNumber,
  issuedAtLabel,
  shareUrl,
  certificatePublicCode,
  verifySiteOrigin,
  linkedInAddCertificationHref,
}: CertificateClientProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const linkedInHelpRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [linkedInHelpOpen, setLinkedInHelpOpen] = useState(false);

  const linkedInCertId = useMemo(
    () => normalizePublicCertificateCodeForLinkedIn(certificatePublicCode),
    [certificatePublicCode]
  );

  const verifyPageUrl = useMemo(() => {
    if (!linkedInCertId) return null;
    const origin = verifySiteOrigin.replace(/\/$/, "");
    return `${origin}/verify/${linkedInCertId}`;
  }, [linkedInCertId, verifySiteOrigin]);

  const milestones = useMemo(() => getParticipationMilestones(roleLabel), [roleLabel]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePdf = useCallback(async () => {
    const el = sheetRef.current;
    if (!el) return;
    setPdfBusy(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      const drawH = Math.min(imgH, pageH);
      const drawW = (canvas.width * drawH) / canvas.height;
      const offsetX = (pageW - drawW) / 2;
      pdf.addImage(imgData, "PNG", offsetX, 0, drawW, drawH);
      const safeTitle = projectTitle.replace(/[/\\?%*:|"<>]/g, "-").slice(0, 40);
      pdf.save(`Side-Sync-활동확인서-${safeTitle}.pdf`);
    } catch (e) {
      console.error(e);
      window.alert("PDF 저장에 실패했습니다. 인쇄 기능을 이용해 주세요.");
    } finally {
      setPdfBusy(false);
    }
  }, [projectTitle]);

  const handleLinkedInUnavailable = useCallback(() => {
    window.alert(
      "링크드인용 짧은 인증 코드(ss-로 시작하는 15자)를 사용할 수 없습니다. 증명서를 새로고침하거나 DB의 project_certificate_codes 행을 확인해 주세요."
    );
  }, []);

  useEffect(() => {
    if (!linkedInHelpOpen) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const el = linkedInHelpRef.current;
      if (el && !el.contains(e.target as Node)) {
        setLinkedInHelpOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [linkedInHelpOpen]);

  const linkedInBtnInner = (
    <>
      <svg
        className="h-[18px] w-[18px] shrink-0 text-current"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
      링크드인 프로필에 추가하기
    </>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 font-sans text-[#111] print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/projects"
          className="text-sm font-medium text-[#1e293b] underline-offset-4 hover:underline"
        >
          ← 내 프로젝트
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={handlePrint} className={btnOutline}>
            <Printer className="h-4 w-4 shrink-0" aria-hidden />
            인쇄
          </button>
          <button
            type="button"
            onClick={() => void handlePdf()}
            disabled={pdfBusy}
            className={btnOutline}
          >
            {pdfBusy ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <FileDown className="h-4 w-4 shrink-0" aria-hidden />
            )}
            PDF로 저장
          </button>
          <div ref={linkedInHelpRef} className="relative inline-flex items-center gap-1">
            {linkedInAddCertificationHref ? (
              <a
                href={linkedInAddCertificationHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnOutline} font-semibold`}
                aria-label="링크드인 프로필에 자격 증명 추가"
              >
                {linkedInBtnInner}
              </a>
            ) : (
              <button
                type="button"
                onClick={handleLinkedInUnavailable}
                className={`${btnOutline} font-semibold`}
                aria-label="링크드인 프로필에 자격 증명 추가 (준비되지 않음)"
              >
                {linkedInBtnInner}
              </button>
            )}
            <button
              type="button"
              id="linkedin-cert-help-trigger"
              aria-expanded={linkedInHelpOpen}
              aria-controls="linkedin-cert-help-panel"
              onClick={() => setLinkedInHelpOpen((o) => !o)}
              className={btnOutlineIcon}
              title="링크드인 등록이 왜 도움이 되나요?"
            >
              <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
              <span className="sr-only">링크드인에 등록하면 무엇이 좋은가요? 도움말 열기</span>
            </button>
            {linkedInHelpOpen ? (
              <div
                id="linkedin-cert-help-panel"
                role="tooltip"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] border border-slate-200 bg-white p-3 text-left text-[#111] shadow-sm"
              >
                <p className="text-xs font-semibold">링크드인에 등록하면 무엇이 좋은가요?</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-[#111]">
                  <li>내 프로필의 &apos;라이선스 및 자격증&apos; 섹션에 공식적으로 기록됩니다.</li>
                  <li>채용 담당자에게 실무 협업 경험을 데이터로 증명할 수 있습니다.</li>
                  <li>Side-Sync가 보증하는 고유 발급 번호가 포함됩니다.</li>
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {shareUrl ? (
        <div className="no-print mb-4 border border-slate-200 bg-white px-4 py-3 text-xs text-[#111] shadow-sm">
          <p className="font-semibold text-[#1e293b]">본인 확인용 조회 링크</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            아래 링크를 저장해 두면 로그인 없이도 동일 증명서를 다시 열 수 있습니다. 링크가 있으면 누구나
            열람할 수 있으니 타인과 공유하지 마세요.
          </p>
          <p className="mt-2 break-all font-mono text-[11px] text-[#111]">{shareUrl}</p>
          {linkedInCertId ? (
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-700">
              <span className="font-semibold text-[#1e293b]">공개 검증 코드</span> (링크드인 식별번호·누구나
              검증 가능): <span className="font-mono">{linkedInCertId}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {!shareUrl && linkedInCertId ? (
        <div className="no-print mb-4 border border-slate-200 bg-white px-4 py-3 text-xs text-[#111] shadow-sm">
          <p className="font-semibold text-[#1e293b]">공개 검증</p>
          <p className="mt-1 font-mono text-[11px]">{linkedInCertId}</p>
          <p className="mt-1 break-all text-[11px] text-slate-600">
            {verifySiteOrigin.replace(/\/$/, "")}/verify/{linkedInCertId}
          </p>
        </div>
      ) : null}

      {/* 이중 테두리 공식 문서 시트 */}
      <div className="certificate-outer border border-[#1e293b] bg-white p-[3px] shadow-sm print:shadow-none">
        <div
          ref={sheetRef}
          className="certificate-sheet relative overflow-hidden border border-[#1e293b] bg-white px-7 py-10 md:px-11 md:py-12 print:border-[#1e293b]"
        >
          {/* 워터마크 */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            <BrandLogoMark
              size={280}
              priority
              className="rounded-[2rem] opacity-[0.035] grayscale contrast-[1.02]"
            />
          </div>

          <div className="relative z-10">
            <header className="flex flex-col items-center border-b border-[#1e293b]/20 pb-6">
              <BrandLogoMark size={44} priority className="rounded-xl opacity-95" />
              <p
                className={`${certSerif.className} mt-5 text-center text-[1.2rem] font-semibold uppercase leading-tight tracking-[0.12em] text-[#1e293b] sm:text-[1.35rem] md:text-3xl md:tracking-[0.14em]`}
              >
                Project Completion Certificate
              </p>
              <p className="mt-3 text-sm font-semibold tracking-[0.35em] text-slate-800">활 동 확 인 서</p>
              <p className="mt-1.5 text-center text-xs font-medium text-slate-500">
                Side-Sync · 사이드 프로젝트 협업 플랫폼
              </p>
            </header>

            <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-slate-800">
              <p className="text-center text-[15px] text-slate-700 md:text-base">
                본 문서는 아래 인원이 Side-Sync에 등록된 프로젝트에 참여했음을 확인합니다.
              </p>

              <table className="mx-auto w-full max-w-lg border-collapse text-left">
                <tbody>
                  <tr className="border-b border-[#1e293b]/15">
                    <th className="w-[132px] py-2.5 pr-3 align-top text-xs font-bold uppercase tracking-wide text-[#1e293b]">
                      성명
                    </th>
                    <td className="py-2.5 text-lg font-semibold text-slate-900">{participantName}</td>
                  </tr>
                  <tr className="border-b border-[#1e293b]/15">
                    <th className="py-2.5 pr-3 align-top text-xs font-bold uppercase tracking-wide text-[#1e293b]">
                      프로젝트명
                    </th>
                    <td className="py-2.5 font-medium text-slate-900">{projectTitle}</td>
                  </tr>
                  {roleLabel ? (
                    <tr className="border-b border-[#1e293b]/15">
                      <th className="py-2.5 pr-3 align-top text-xs font-bold uppercase tracking-wide text-[#1e293b]">
                        역할·포지션
                      </th>
                      <td className="py-2.5 text-slate-800">{roleLabel}</td>
                    </tr>
                  ) : null}
                  <tr className="border-b border-[#1e293b]/15">
                    <th className="py-2.5 pr-3 align-top text-xs font-bold uppercase tracking-wide text-[#1e293b]">
                      참여 기간
                    </th>
                    <td className="py-2.5 text-slate-800">{periodLabel}</td>
                  </tr>
                  <tr className="border-b border-[#1e293b]/15">
                    <th className="py-2.5 pr-3 align-top text-xs font-bold uppercase tracking-wide text-[#1e293b]">
                      발급 번호
                    </th>
                    <td className="py-2.5 font-mono text-sm font-semibold tracking-wide text-slate-900">
                      {issuanceNumber}
                    </td>
                  </tr>
                  <tr>
                    <th className="py-2.5 pr-3 align-top text-xs font-bold uppercase tracking-wide text-[#1e293b]">
                      발급 일자
                    </th>
                    <td className="py-2.5 text-slate-800">{issuedAtLabel}</td>
                  </tr>
                </tbody>
              </table>

              <section aria-labelledby="cert-participation-heading">
                <h2
                  id="cert-participation-heading"
                  className="text-xs font-bold uppercase tracking-[0.2em] text-[#1e293b]"
                >
                  참여 내용
                </h2>
                <ul className="mt-3 list-none space-y-2.5 pl-0 text-[14px] leading-relaxed text-slate-800">
                  {milestones.map((line) => (
                    <li key={line} className="flex gap-2.5">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#1e293b]" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="relative z-10 mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col items-start gap-2">
                {verifyPageUrl ? (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1e293b]">
                      진위 확인
                    </p>
                    <div className="rounded-lg border border-[#1e293b]/15 bg-white p-2 shadow-sm">
                      <QRCode
                        value={verifyPageUrl}
                        size={96}
                        level="M"
                        fgColor={NAVY}
                        bgColor="#ffffff"
                        className="h-auto max-w-full"
                      />
                    </div>
                    <p className="max-w-[14rem] break-all font-mono text-[9px] leading-snug text-slate-500">
                      {verifyPageUrl}
                    </p>
                  </>
                ) : (
                  <p className="max-w-xs text-[10px] leading-relaxed text-slate-500">
                    공개 검증 코드가 연결되면 QR과 URL이 표시되어 누구나 진위를 확인할 수 있습니다.
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center gap-2 sm:items-end">
                <OfficialSeal />
                <p className="text-center text-[11px] font-semibold text-[#1e293b] sm:text-right">
                  발급 기관
                  <br />
                  <span className="text-sm">Side-Sync Platform</span>
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-10 space-y-3 border-t border-[#1e293b]/15 pt-6 text-center">
              <p className="text-[10px] leading-relaxed text-slate-500">
                {verifyPageUrl
                  ? "이 증명서는 데이터 위변조 방지 기술로 보호되며, 상기 QR/URL을 통해 진위 확인이 가능합니다."
                  : "이 증명서는 플랫폼 활동 기록 및 발급 번호 체계로 무결성을 유지하며, 공개 검증 코드가 연결된 경우 URL을 통해 진위 확인이 가능합니다."}
              </p>
              <p className="text-xs leading-relaxed text-slate-600">
                본 증명서는 Side-Sync 내 활동 기록을 바탕으로 발급되었으며, 법적 효력은 없습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #fff !important;
          }
          .certificate-sheet {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
