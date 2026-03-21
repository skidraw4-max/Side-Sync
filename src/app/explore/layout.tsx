import type { Metadata } from "next";

/** Explore는 홈과 동일 콘텐츠를 노출하되, 검색엔진에는 홈을 대표 URL로 인식시킵니다. */
export const metadata: Metadata = {
  alternates: {
    canonical: "https://sidesync.io/",
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
