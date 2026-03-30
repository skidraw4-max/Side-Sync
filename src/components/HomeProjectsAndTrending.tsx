"use client";

import { useRef, useState } from "react";
import MyProjectsSection from "@/components/MyProjectsSection";
import TrendingProjects from "@/components/TrendingProjects";

export default function HomeProjectsAndTrending() {
  const [searchQuery, setSearchQuery] = useState("");
  const trendingRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div className="mt-0">
        <MyProjectsSection />
      </div>
      <div ref={trendingRef} id="trending-projects" className="scroll-mt-24">
        <TrendingProjects
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          sectionTitle="Live Ecosystem Projects"
          sectionDescription="커뮤니티에서 지금 진행 중인 프로젝트를 카드로 살펴보고, 지원과 협업을 시작해 보세요."
          viewAllLabel="전체 프로젝트 보기"
          viewAllHref="/projects"
        />
      </div>
    </>
  );
}
