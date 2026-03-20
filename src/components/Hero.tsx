"use client";

/**
 * 메인 랜딩 히어로 — SaaS 스타일 (검색·이미지는 Trending 섹션에서 처리)
 * 타이틀: 기존 6xl/7xl/8xl 대비 약 70% 크기(≈30% 축소)
 */
export default function Hero() {
  return (
    <section className="bg-slate-50 px-6 pb-16 pt-12 md:px-12 md:pb-24 md:pt-16 lg:px-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <h1 className="text-[2.625rem] font-black leading-[1.08] tracking-tight text-slate-900 md:text-[3.15rem] lg:text-[4.2rem]">
          아이디어만 준비하세요.
          <br />
          나머지는 <span className="text-blue-600">Side-Sync</span>가 채웁니다.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:mt-7 md:text-lg md:leading-relaxed">
          나만의 <span className="font-semibold text-slate-800">아이디어</span>를 구체화할{" "}
          <span className="font-semibold text-slate-800">최적의 파트너</span>를 만나고,{" "}
          <span className="font-semibold text-slate-800">전용 협업 툴</span>로 실현해 보세요.
        </p>
      </div>
    </section>
  );
}
