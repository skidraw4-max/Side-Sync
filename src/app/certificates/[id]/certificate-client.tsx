"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandLogoMark } from "@/components/BrandLogo";
import { Printer, FileDown, Loader2, CircleHelp } from "lucide-react";

export interface CertificateClientProps {
  projectTitle: string;
  participantName: string;
  roleLabel: string | null;
  periodLabel: string;
  issuanceNumber: string;
  issuedAtLabel: string;
  shareUrl: string | null;
  /** LinkedIn certUrl / certId 및 /verify/[code] 경로에 사용 */
  verificationCode: string;
}

export default function CertificateClient({
  projectTitle,
  participantName,
  roleLabel,
  periodLabel,
  issuanceNumber,
  issuedAtLabel,
  shareUrl,
  verificationCode,
}: CertificateClientProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const linkedInHelpRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [linkedInHelpOpen, setLinkedInHelpOpen] = useState(false);

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

  const handleLinkedInAdd = useCallback(() => {
    const d = new Date();
    const issueYear = String(d.getFullYear());
    const issueMonth = String(d.getMonth() + 1);
    const certUrl = `https://sidesync.io/verify/${verificationCode}`;
    const name = `[Side-Sync] ${projectTitle} 참여 확인서`;
    const url =
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
      encodeURIComponent(verificationCode);
    window.open(url, "_blank", "noopener,noreferrer");
  }, [projectTitle, verificationCode]);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/projects"
          className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          ← 내 프로젝트
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" aria-hidden />
            인쇄
          </button>
          <button
            type="button"
            onClick={() => void handlePdf()}
            disabled={pdfBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#152a45] disabled:opacity-60"
          >
            {pdfBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <FileDown className="h-4 w-4" aria-hidden />
            )}
            PDF로 저장
          </button>
          <div ref={linkedInHelpRef} className="relative inline-flex items-center gap-1">
            <button
              type="button"
              onClick={handleLinkedInAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#004182]"
              aria-label="링크드인 프로필에 자격 증명 추가"
            >
              <svg
                className="h-[18px] w-[18px] shrink-0 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              링크드인 프로필에 추가하기
            </button>
            <button
              type="button"
              id="linkedin-cert-help-trigger"
              aria-expanded={linkedInHelpOpen}
              aria-controls="linkedin-cert-help-panel"
              onClick={() => setLinkedInHelpOpen((o) => !o)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#0A66C2]/40 bg-white text-[#0A66C2] shadow-sm hover:bg-[#0A66C2]/5"
              title="링크드인 등록이 왜 도움이 되나요?"
            >
              <CircleHelp className="h-4 w-4 shrink-0" aria-hidden />
              <span className="sr-only">링크드인에 등록하면 무엇이 좋은가요? 도움말 열기</span>
            </button>
            {linkedInHelpOpen ? (
              <div
                id="linkedin-cert-help-panel"
                role="tooltip"
                className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg ring-1 ring-black/5"
              >
                <p className="text-xs font-semibold text-slate-900">
                  링크드인에 등록하면 무엇이 좋은가요?
                </p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-slate-600">
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
        <div className="no-print mb-4 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs text-amber-950">
          <p className="font-semibold">본인 확인용 조회 링크</p>
          <p className="mt-1 text-amber-900/90">
            아래 링크를 저장해 두면 로그인 없이도 동일 증명서를 다시 열 수 있습니다. 링크가 있으면 누구나 열람할 수 있으니 타인과 공유하지 마세요.
          </p>
          <p className="mt-2 break-all font-mono text-[11px] text-amber-950">{shareUrl}</p>
        </div>
      ) : null}

      <div
        ref={sheetRef}
        className="certificate-sheet border border-[#c5a572] bg-[#fffef8] px-8 py-10 shadow-lg print:border-0 print:shadow-none md:px-12 md:py-14"
        style={{
          boxShadow: "0 0 0 8px #fffef8, 0 0 0 10px #c5a572",
        }}
      >
        <div className="flex flex-col items-center border-b-2 border-[#1e3a5f]/20 pb-6">
          <BrandLogoMark size={56} priority className="rounded-xl" />
          <h1 className="mt-4 text-center text-2xl font-bold tracking-[0.2em] text-[#1e3a5f] md:text-3xl">
            활 동 확 인 서
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-[#1e3a5f]/80">Certificate of Participation</p>
          <p className="mt-1 text-center text-xs text-slate-500">Side-Sync · 사이드 프로젝트 협업 플랫폼</p>
        </div>

        <div className="mt-10 space-y-6 text-[15px] leading-relaxed text-slate-800">
          <p className="text-center text-base md:text-lg">
            본 문서는 아래 인원이 Side-Sync에 등록된 프로젝트에 참여했음을 확인합니다.
          </p>

          <table className="mx-auto w-full max-w-lg border-collapse text-left">
            <tbody>
              <tr className="border-b border-slate-200">
                <th className="w-[140px] py-3 pr-4 align-top text-sm font-semibold text-slate-600">성명</th>
                <td className="py-3 text-lg font-semibold text-slate-900">{participantName}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 align-top text-sm font-semibold text-slate-600">프로젝트명</th>
                <td className="py-3 font-medium text-slate-900">{projectTitle}</td>
              </tr>
              {roleLabel ? (
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 align-top text-sm font-semibold text-slate-600">역할·포지션</th>
                  <td className="py-3 text-slate-800">{roleLabel}</td>
                </tr>
              ) : null}
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 align-top text-sm font-semibold text-slate-600">참여 기간</th>
                <td className="py-3 text-slate-800">{periodLabel}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <th className="py-3 pr-4 align-top text-sm font-semibold text-slate-600">발급 번호</th>
                <td className="py-3 font-mono text-sm font-semibold tracking-wide text-[#1e3a5f]">
                  {issuanceNumber}
                </td>
              </tr>
              <tr>
                <th className="py-3 pr-4 align-top text-sm font-semibold text-slate-600">발급 일자</th>
                <td className="py-3 text-slate-800">{issuedAtLabel}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-14 flex justify-center">
          <div className="text-center">
            <div className="mx-auto h-px w-48 bg-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-700">발급 기관</p>
            <p className="text-lg font-bold text-[#1e3a5f]">Side-Sync</p>
          </div>
        </div>

        <p className="mt-12 border-t border-slate-200 pt-6 text-center text-xs leading-relaxed text-slate-500">
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
