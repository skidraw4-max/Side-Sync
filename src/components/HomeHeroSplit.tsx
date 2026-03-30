import Link from "next/link";

/**
 * 랜딩 히어로 — 좌측 타이포 + 우측 다크 테크 비주얼 (참고 레이아웃 비율).
 */
export default function HomeHeroSplit() {
  return (
    <section
      className="border-b border-gray-100 bg-white px-6 py-14 md:px-10 md:py-16 lg:px-16 lg:py-20 xl:px-24"
      aria-labelledby="home-hero-heading"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:gap-20">
        <div className="min-w-0 lg:pr-4">
          <h1
            id="home-hero-heading"
            className="text-[2rem] font-bold leading-[1.12] tracking-tight text-gray-900 sm:text-[2.375rem] md:text-5xl lg:text-[3.25rem] xl:text-6xl"
          >
            함께 만드는{" "}
            <span className="text-[#2563EB]">디지털 미래</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-500 md:mt-6 md:text-lg md:leading-relaxed">
            Side-Sync는 아이디어를 실행으로 옮길 <strong className="font-medium text-gray-700">빌더</strong>
            들을 연결합니다. 검증된 모집 공고, 실시간 지원 흐름, 전용 워크스페이스로 사이드
            프로젝트를 안전하게 완주할 수 있도록 돕습니다.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              href="/signup"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-lg bg-[#2563EB] px-7 py-3 text-center text-base font-semibold text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              프로젝트 시작하기
            </Link>
            <Link
              href="/about"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-lg border border-gray-200 bg-white px-7 py-3 text-center text-base font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50"
            >
              서비스 소개
            </Link>
          </div>
        </div>

        <div className="relative min-h-[240px] w-full sm:min-h-[280px] lg:min-h-[340px]">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0c1929] shadow-xl lg:aspect-auto lg:h-full lg:min-h-[320px]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:28px_28px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-8 top-1/2 h-[120%] w-[70%] -translate-y-1/2 rounded-full bg-[#2563EB]/25 blur-[80px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-1/2 h-1/2 w-[90%] -translate-x-1/2 rounded-t-full bg-gradient-to-t from-[#2563EB]/20 to-transparent"
              aria-hidden
            />
            {/* 추상 워크스페이스 프레임 */}
            <div className="absolute inset-6 flex flex-col gap-3 sm:inset-8">
              <div className="h-3 w-2/5 rounded bg-white/10" />
              <div className="flex flex-1 gap-3">
                <div className="w-[42%] rounded-lg border border-white/10 bg-white/[0.06] backdrop-blur-sm" />
                <div className="flex flex-1 flex-col gap-3">
                  <div className="h-1/3 rounded-lg border border-white/10 bg-white/[0.05]" />
                  <div className="flex flex-1 gap-2">
                    <div className="flex-1 rounded-lg border border-white/10 bg-[#2563EB]/15" />
                    <div className="w-1/3 rounded-lg border border-white/10 bg-white/[0.04]" />
                  </div>
                </div>
              </div>
              <div className="h-2 w-3/4 rounded bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
