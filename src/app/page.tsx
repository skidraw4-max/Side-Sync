import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ProjectStats from "@/components/main/ProjectStats";
import FeatureCards from "@/components/FeatureCards";
import HomeSeoOverview from "@/components/HomeSeoOverview";
import HomeProjectsAndTrending from "@/components/HomeProjectsAndTrending";
import Footer from "@/components/Footer";
import AdBanner from "@/components/AdBanner";
import { ADSENSE_CLIENT_ID, ADSENSE_SLOTS } from "@/lib/ads-config";

export const metadata: Metadata = {
  title: {
    absolute: "Side-Sync | 사이드 프로젝트 탐색·팀 빌딩·링크드인 활동 확인서",
  },
  description:
    "Side-Sync는 사이드 프로젝트를 모집·탐색하고, 지원과 수락으로 팀을 구성하며, 전용 워크스페이스에서 협업하고, 완주 시 링크드인에 등록 가능한 활동 확인서까지 제공하는 팀 빌딩 플랫폼입니다.",
  alternates: {
    canonical: "https://sidesync.io",
  },
  openGraph: {
    title: "Side-Sync | 사이드 프로젝트 탐색·팀 빌딩·링크드인 활동 확인서",
    description:
      "프로젝트 탐색, 팀 빌딩, 워크스페이스 협업, 링크드인 연동 증명서까지 한곳에서. 지금 Side-Sync에서 팀을 만나 보세요.",
    url: "https://sidesync.io",
    siteName: "Side-Sync",
    locale: "ko_KR",
    images: [{ url: "/images/og-image.png" }],
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <Hero />
        <section
          className="border-t border-slate-200/90 bg-white px-6 py-8 md:px-12 md:py-10 lg:px-24"
          aria-label="프로젝트 현황"
        >
          <div className="mx-auto flex max-w-5xl justify-center">
            <ProjectStats />
          </div>
        </section>
        <FeatureCards />
        <HomeSeoOverview />
        <HomeProjectsAndTrending />
      </main>
      <div className="mx-auto max-w-4xl px-4 pb-6">
        <AdBanner
          adSlotId={ADSENSE_SLOTS.homeFooter}
          adClientId={ADSENSE_CLIENT_ID || undefined}
          className="w-full"
        />
      </div>
      <Footer />
    </div>
  );
}
