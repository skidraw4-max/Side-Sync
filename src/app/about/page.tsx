import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AboutHeroSplit from "@/components/about/AboutHeroSplit";
import AboutFeatureStrip from "@/components/about/AboutFeatureStrip";
import AboutOriginStory from "@/components/about/AboutOriginStory";
import AboutStatsStrip from "@/components/about/AboutStatsStrip";
import AboutLiveProjects from "@/components/about/AboutLiveProjects";

export const metadata: Metadata = {
  title: "소개",
  description:
    "Side-Sync는 사이드 프로젝트 탐색·팀 매칭·검증된 워크스페이스·활동 확인서로 완주 경험을 커리어로 연결합니다. 팀 빌딩, 실시간 지원, 링크드인 연동 증명서까지 한 흐름으로 안내합니다.",
  openGraph: {
    title: "소개 | Side-Sync",
    description:
      "여러분의 완주가 커리어가 되는 곳. 검증된 프로젝트, 실시간 팀 매칭, 활발한 커뮤니티와 Live Ecosystem 프로젝트를 만나 보세요.",
    url: "https://sidesync.io/about",
    siteName: "Side-Sync",
    locale: "ko_KR",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <AboutHeroSplit />
        <AboutFeatureStrip />
        <AboutOriginStory />
        <AboutStatsStrip />
        <AboutLiveProjects />
      </main>
      <Footer />
    </div>
  );
}
