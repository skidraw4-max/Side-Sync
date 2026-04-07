"use client";

import Link from "next/link";
import ProjectStats from "@/components/main/ProjectStats";

/**
 * 메인 랜딩 히어로 — 타이트한 세로 여백, 강한 타이포, CTA, 은은한 그라데이션·그리드
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-10 md:px-12 md:py-12 lg:px-24">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-emerald-50/40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(16,185,129,0.14),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(226_232_240/0.45)_1px,transparent_1px),linear-gradient(to_bottom,rgb(226_232_240/0.45)_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
        <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-6xl lg:text-7xl">
          사이드 프로젝트가{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            경력
          </span>
          이 되는{" "}
          <span className="text-emerald-600">순간</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 md:mt-5 md:text-lg md:leading-relaxed">
          나만의 <span className="font-semibold text-slate-800">아이디어</span>를 구체화할{" "}
          <span className="font-semibold text-slate-800">최적의 파트너</span>를 만나고,{" "}
          <span className="font-semibold text-slate-800">전용 협업 툴</span>로 실현해 보세요.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-slate-900 px-8 py-3 text-base font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:bg-slate-800 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 md:mt-7 md:min-h-[3.25rem] md:px-10 md:text-lg"
        >
          프로젝트 시작하기
        </Link>
        <ProjectStats />
      </div>
    </section>
  );
}
