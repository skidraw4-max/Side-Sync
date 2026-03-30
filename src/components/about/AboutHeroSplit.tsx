import Image from "next/image";
import Link from "next/link";

/** About 히어로 — 좌 타이포 + 우 테크 비주얼 이미지 */
export default function AboutHeroSplit() {
  return (
    <section
      className="border-b border-gray-100 bg-white px-6 py-14 md:px-10 md:py-16 lg:px-16 lg:py-20 xl:px-24"
      aria-labelledby="about-hero-heading"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
        <div className="min-w-0 lg:pr-4">
          <h1
            id="about-hero-heading"
            className="text-[2rem] font-bold leading-[1.12] tracking-tight text-gray-900 sm:text-[2.375rem] md:text-5xl lg:text-[3.25rem] xl:text-6xl"
          >
            Building the{" "}
            <span className="text-[#2563EB]">Future</span>
            <br className="hidden sm:block" /> Together
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-500 md:mt-6 md:text-lg md:leading-relaxed">
            Side-Sync는 재능이 흩어지지 않도록 연결합니다. 검증된 모집·실시간 매칭·안전한
            워크스페이스로 사이드 프로젝트를 완주하고, 그 경험을 커리어로 남기세요.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/signup"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-lg bg-[#2563EB] px-7 py-3 text-center text-base font-semibold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              Start a Project
            </Link>
            <Link
              href="/announcements"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-lg border border-gray-200 bg-white px-7 py-3 text-center text-base font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
            >
              View Roadmap
            </Link>
          </div>
        </div>

        <div className="relative min-h-[240px] w-full sm:min-h-[280px] lg:min-h-[340px] lg:h-full">
          <div className="relative aspect-[4/3] h-full min-h-[240px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-slate-950 shadow-xl sm:min-h-[280px] lg:aspect-auto lg:min-h-[320px]">
            <Image
              src="/about/hero-workstation.png"
              alt="데이터 시각화와 협업 워크스테이션을 담은 테크 일러스트"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
