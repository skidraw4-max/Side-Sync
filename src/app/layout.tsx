import type { Metadata } from "next";
import "@fontsource/pretendard";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import Providers from "@/components/Providers";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  metadataBase: new URL("https://sidesync.io"),
  title: {
    default: "Side-Sync | 사이드 프로젝트 탐색·팀 빌딩·링크드인 활동 확인서",
    template: "%s | Side-Sync",
  },
  description:
    "사이드 프로젝트 모집 탐색, 지원·수락 기반 팀 빌딩, 워크스페이스 협업, 완주 후 링크드인 연동 활동 확인서까지. Side-Sync에서 아이디어를 팀과 함께 완성하세요.",
  keywords: [
    "사이드 프로젝트",
    "팀 빌딩",
    "프로젝트 탐색",
    "개발자 매칭",
    "디자이너 찾기",
    "AI 팀 빌딩",
    "협업 툴",
    "프로젝트 관리",
    "링크드인 증명서",
    "활동 확인서",
  ],
  /** apex 도메인을 대표 URL로 고정 (www·미러 URL과의 혼선 방지) */
  alternates: {
    canonical: "https://sidesync.io",
  },
  openGraph: {
    title: "Side-Sync | 사이드 프로젝트 탐색·팀 빌딩·링크드인 활동 확인서",
    description:
      "프로젝트 탐색, 팀 빌딩, 워크스페이스 협업, 링크드인 연동 활동 확인서까지 한곳에서.",
    url: "https://sidesync.io",
    siteName: "Side-Sync",
    locale: "ko_KR",
    images: [{ url: "/images/og-image.png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="ko">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2237287742271246"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased font-sans">
        <Providers initialSession={session}>{children}</Providers>
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        ) : null}
      </body>
    </html>
  );
}
