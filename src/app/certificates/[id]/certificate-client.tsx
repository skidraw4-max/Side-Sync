"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogoMark } from "@/components/BrandLogo";
import { Printer, FileDown, Loader2, CircleHelp } from "lucide-react";
import { normalizePublicCertificateCodeForLinkedIn } from "@/lib/certificate-linkedin-cert-id";

/** 미니멀 B&W: 흰 배경·검정 테두리, 호버 시 반전 */
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-md border border-black bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-black";

const btnOutlineIcon =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black bg-white text-black transition-colors hover:bg-black hover:text-white";

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
          className="text-sm font-medium text-[#111] underline-offset-4 hover:underline"
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
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] border border-[#ddd] bg-white p-3 text-left text-[#111]"
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
        <div className="no-print mb-4 border border-[#ddd] bg-white px-4 py-3 text-xs text-[#111]">
          <p className="font-semibold">본인 확인용 조회 링크</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#111]">
            아래 링크를 저장해 두면 로그인 없이도 동일 증명서를 다시 열 수 있습니다. 링크가 있으면 누구나
            열람할 수 있으니 타인과 공유하지 마세요.
          </p>
          <p className="mt-2 break-all font-mono text-[11px] text-[#111]">{shareUrl}</p>
          {linkedInCertId ? (
            <p className="mt-3 border-t border-[#ddd] pt-3 text-[11px] text-[#111]">
              <span className="font-semibold">공개 검증 코드</span> (링크드인 식별번호·누구나 검증 가능):{" "}
              <span className="font-mono">{linkedInCertId}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {!shareUrl && linkedInCertId ? (
        <div className="no-print mb-4 border border-[#ddd] bg-white px-4 py-3 text-xs text-[#111]">
          <p className="font-semibold">공개 검증</p>
          <p className="mt-1 font-mono text-[11px]">{linkedInCertId}</p>
          <p className="mt-1 break-all text-[11px]">
            {verifySiteOrigin.replace(/\/$/, "")}/verify/{linkedInCertId}
          </p>
        </div>
      ) : null}

      <div
        ref={sheetRef}
        className="certificate-sheet border border-[#ddd] bg-white px-8 py-10 md:px-12 md:py-14 print:border-0 print:shadow-none"
      >
        <div className="flex flex-col items-center border-b border-black pb-6">
          <BrandLogoMark
            size={56}
            priority
            className="rounded-xl grayscale contrast-[1.05]"
          />
          <h1 className="mt-4 text-center text-2xl font-bold tracking-[0.2em] text-black md:text-3xl">
            활 동 확 인 서
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-[#111]">
            Certificate of Participation
          </p>
          <p className="mt-1 text-center text-xs text-[#111]">Side-Sync · 사이드 프로젝트 협업 플랫폼</p>
        </div>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-[#111]">
          <p className="text-center text-base md:text-lg">
            본 문서는 아래 인원이 Side-Sync에 등록된 프로젝트에 참여했음을 확인합니다.
          </p>

          <table className="mx-auto w-full max-w-lg border-collapse text-left">
            <tbody>
              <tr className="border-b border-[#ddd]">
                <th className="w-[140px] py-3 pr-4 align-top text-sm font-semibold text-black">성명</th>
                <td className="py-3 text-lg font-semibold text-black">{participantName}</td>
              </tr>
              <tr className="border-b border-[#ddd]">
                <th className="py-3 pr-4 align-top text-sm font-semibold text-black">프로젝트명</th>
                <td className="py-3 font-medium text-black">{projectTitle}</td>
              </tr>
              {roleLabel ? (
                <tr className="border-b border-[#ddd]">
                  <th className="py-3 pr-4 align-top text-sm font-semibold text-black">역할·포지션</th>
                  <td className="py-3 text-[#111]">{roleLabel}</td>
                </tr>
              ) : null}
              <tr className="border-b border-[#ddd]">
                <th className="py-3 pr-4 align-top text-sm font-semibold text-black">참여 기간</th>
                <td className="py-3 text-[#111]">{periodLabel}</td>
              </tr>
              <tr className="border-b border-[#ddd]">
                <th className="py-3 pr-4 align-top text-sm font-semibold text-black">발급 번호</th>
                <td className="py-3 font-mono text-sm font-semibold tracking-wide text-black">
                  {issuanceNumber}
                </td>
              </tr>
              <tr>
                <th className="py-3 pr-4 align-top text-sm font-semibold text-black">발급 일자</th>
                <td className="py-3 text-[#111]">{issuedAtLabel}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-14 flex justify-center">
          <div className="text-center">
            <div className="mx-auto h-px w-48 bg-black" />
            <p className="mt-3 text-sm font-semibold text-black">발급 기관</p>
            <p className="text-lg font-bold text-black">Side-Sync</p>
          </div>
        </div>

        <p className="mt-12 border-t border-[#ddd] pt-6 text-center text-xs leading-relaxed text-[#111]">
          본 증명서는 Side-Sync 내 활동 기록을 바탕으로 발급되었으며, 법적 효력은 없습니다.
        </p>
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
