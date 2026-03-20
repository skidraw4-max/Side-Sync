"use client";

import { useRef, useState } from "react";
import Hero from "@/components/Hero";
import FeatureCards from "@/components/FeatureCards";
import MyProjectsSection from "@/components/MyProjectsSection";
import TrendingProjects from "@/components/TrendingProjects";

export default function HomeExploreSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const trendingRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Hero />
      <FeatureCards />
      <div className="mt-20 md:mt-24">
        <MyProjectsSection />
      </div>
      <div ref={trendingRef} id="trending-projects" className="mt-20 scroll-mt-24 md:mt-24">
        <TrendingProjects searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
      </div>
    </>
  );
}
