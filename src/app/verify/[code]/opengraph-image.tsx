import { ImageResponse } from "next/og";
import { loadCertificateVerifyPayload } from "@/lib/certificate-verify-load";

export const runtime = "nodejs";
export const alt = "Side-Sync 프로젝트 참여 확인서";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code: codeParam } = await params;
  const code = codeParam?.trim() ?? "";
  const data = await loadCertificateVerifyPayload(code);

  const projectLine = data?.projectTitle ?? "프로젝트 참여 확인";
  const nameLine = data?.participantName ?? "참여자";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          background: "linear-gradient(145deg, #0f172a 0%, #1e3a5f 45%, #0c4a6e 100%)",
          color: "#f8fafc",
          fontFamily:
            'ui-sans-serif, system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              color: "#fff",
            }}
          >
            SS
          </div>
          <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em" }}>Side-Sync</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 600, opacity: 0.85 }}>프로젝트 참여 확인서</div>
          <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.25, maxHeight: 160, overflow: "hidden" }}>
            {projectLine}
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: "#7dd3fc" }}>{nameLine}님의 완주를 확인합니다.</div>
        </div>

        <div style={{ fontSize: 20, opacity: 0.65 }}>sidesync.io · 검증용 공개 페이지</div>
      </div>
    ),
    {
      ...size,
    }
  );
}
