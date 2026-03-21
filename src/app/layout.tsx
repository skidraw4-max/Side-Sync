import type { Metadata } from "next";
import "@fontsource/pretendard";
import "./globals.css";
import Providers from "@/components/Providers";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  metadataBase: new URL("https://sidesync.io"),
  title:
    "Side-Sync | 아이디어를 현실로 만드는 AI 협업 파트너 매칭",
  description:
    "나만의 아이디어를 구체화할 최적의 파트너를 AI가 찾아드립니다. 전용 협업 툴과 상호 평가 시스템으로 성공적인 사이드 프로젝트를 시작하세요.",
  keywords: [
    "사이드 프로젝트",
    "팀 빌딩",
    "개발자 매칭",
    "디자이너 찾기",
    "AI 팀 빌딩",
    "협업 툴",
    "프로젝트 관리",
  ],
  openGraph: {
    url: "https://sidesync.io",
    siteName: "Side-Sync",
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
      <body className="antialiased font-sans">
        <Providers initialSession={session}>{children}</Providers>
      </body>
    </html>
  );
}
