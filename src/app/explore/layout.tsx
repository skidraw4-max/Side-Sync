import type { Metadata } from "next";

/** Explore는 홈과 동일 콘텐츠를 노출하되, 검색엔진에는 홈을 대표 URL로 인식시킵니다. */
export const metadata: Metadata = {
  title: "프로젝트 탐색",
  description:
    "Side-Sync에서 모집 중인 사이드 프로젝트를 탐색하고, 기술 스택·역할에 맞는 팀을 찾아 지원하세요. 팀 빌딩과 링크드인 활동 확인서 안내는 홈과 동일하게 제공됩니다.",
  alternates: {
    canonical: "https://sidesync.io/",
  },
  openGraph: {
    title: "프로젝트 탐색 | Side-Sync",
    description:
      "모집 중인 사이드 프로젝트를 한곳에서 찾아보고 지원하세요. 대표 URL은 sidesync.io 입니다.",
    url: "https://sidesync.io",
    siteName: "Side-Sync",
    locale: "ko_KR",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
