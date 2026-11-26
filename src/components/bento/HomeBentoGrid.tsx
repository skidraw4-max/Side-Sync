import BentoProfileOnboarding from "@/components/bento/BentoProfileOnboarding";
import BentoTrendingProjects from "@/components/bento/BentoTrendingProjects";
import BentoWageBenchmarks from "@/components/bento/BentoWageBenchmarks";
import BentoLiveStats from "@/components/bento/BentoLiveStats";
import BentoWorkspaceKanban from "@/components/bento/BentoWorkspaceKanban";
import BentoStartProject from "@/components/bento/BentoStartProject";
import BentoHowItWorks from "@/components/bento/BentoHowItWorks";
import BentoTrustSafety from "@/components/bento/BentoTrustSafety";

/**
 * 메인 벤토: 좌우폭 `max-w-6xl` 통일
 * - 1행: Welcome | Live Stats (2열)
 * - 2행: 추천 시프트 (전폭)
 * - 3행: 공수·인건비 관리 (전폭, 추천 시프트 하단)
 * - 4행: 참고 시세 | 고용주 CTA (2열)
 */
export default function HomeBentoGrid() {
  return (
    <section
      id="home-project-cards"
      className="scroll-mt-24 border-t border-slate-200/80 bg-[#e8ecf1] px-4 py-4 md:px-8 md:py-5 lg:px-12"
      aria-label="Side-Sync 단기 일자리와 공수 관리"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:gap-5 lg:gap-5">
        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2 lg:gap-5">
          <BentoProfileOnboarding />
          <BentoLiveStats />
        </div>
        <BentoTrendingProjects />
        <BentoWorkspaceKanban />
        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2 lg:gap-5">
          <BentoWageBenchmarks />
          <BentoStartProject />
        </div>
        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2 lg:gap-5">
          <BentoHowItWorks />
          <BentoTrustSafety />
        </div>
      </div>
    </section>
  );
}
