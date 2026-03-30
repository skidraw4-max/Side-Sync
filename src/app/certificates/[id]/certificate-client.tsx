"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { BrandLogoMark } from "@/components/BrandLogo";
import { Printer, FileDown, Loader2 } from "lucide-react";

export interface CertificateClientProps {
  projectTitle: string;
  participantName: string;
  roleLabel: string | null;
  periodLabel: string;
  issuanceNumber: string;
  issuedAtLabel: string;
  shareUrl: string | null;
}

export default function CertificateClient({
  projectTitle,
  participantName,
  roleLabel,
  periodLabel,
  issuanceNumber,
  issuedAtLabel,
  shareUrl,
}: CertificateClientProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/projects"
          className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
        >
          ← 내 프로젝트
        </Link>
        <div className="flex flex-wrap gap-2">
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
