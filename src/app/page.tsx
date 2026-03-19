import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MyProjectsSection from "@/components/MyProjectsSection";
import TrendingProjects from "@/components/TrendingProjects";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        <Hero />
        {/* 참여 중인 프로젝트 (로그인 시) */}
        <div className="mt-24">
          <MyProjectsSection />
        </div>
        {/* 히어로(태그 필터)와 카드 섹션 간 간격: 96px (이미지와 동일) */}
        <div className="mt-24">
          <TrendingProjects />
        </div>
      </main>
      <Footer />
    </div>
  );
}
