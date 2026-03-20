import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Lightbulb, Shield, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/** Our Mission 섹션 일러스트 (3D 협업·성장 비주얼) */
const ABOUT_HERO_IMAGE = "/about-mission-hero.png";

export const metadata: Metadata = {
  title: "About Us | Side-Sync",
  description:
    "Side-Sync는 개발자·디자이너·기획자를 연결하고, 사이드 프로젝트 팀 빌딩과 협업을 돕는 플랫폼입니다.",
};

const valueCards = [
  {
    icon: Shield,
    title: "Trust",
    description:
      "투명한 프로필과 매너 온도로 서로를 신뢰하고, 안전하게 협업할 수 있는 환경을 만듭니다.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "전용 워크스페이스와 실시간 도구로 아이디어를 빠르게 공유하고 함께 완성해 갑니다.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "AI 추천과 데이터 인사이트로 나에게 맞는 파트너와 프로젝트를 발견할 수 있습니다.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-16">
        {/* 1. Hero — 참고 레이아웃: 배지 + About Us + 서브카피 */}
        <section className="border-b border-gray-100 bg-white px-6 py-11 text-center md:px-12 md:py-14 lg:px-24">
          <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
            OUR STORY
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            About Us
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-500 md:text-xl">
            Connecting Talent, Building the Future
          </p>
        </section>

        {/* 2. Our Mission — 좌측 이미지(기존 Stitch) 유지, 우측 텍스트 */}
        <section className="bg-gray-50/80 px-6 py-11 md:px-12 md:py-16 lg:px-24">
          <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-11">
            {/* 좌측(데스크톱) / 모바일 상단: 기존 Stitch 이미지 유지 */}
            <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-gray-200/80">
              <Image
                src={ABOUT_HERO_IMAGE}
                alt="Side-Sync 팀 협업 일러스트"
                width={900}
                height={680}
                className="h-auto w-full object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="space-y-4 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Our Mission</h2>
              <p className="text-base leading-relaxed text-gray-600 md:text-lg">
                Side-Sync는 비전 있는 개발자, 디자이너, 마케터를 한곳에 모아 사이드 프로젝트가 현실이
                되도록 돕습니다. 아이디어만 가져오세요 — 팀 매칭부터 협업 도구까지 함께합니다.
              </p>
              <Link
                href="/terms"
                className="inline-flex items-center gap-2 text-base font-semibold text-[#2563EB] transition hover:gap-3 hover:underline"
              >
                Read our whitepaper
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* 3. Core Values */}
        <section className="px-6 py-11 md:px-12 md:py-16 lg:px-24">
          <div className="mx-auto max-w-7xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              OUR FOUNDATION
            </p>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
              Built on Core Values
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-7">
              {valueCards.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition hover:shadow-md md:p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 md:text-base">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. 구분선 */}
        <div className="px-6 py-10 md:px-12 md:py-12 lg:px-24" aria-hidden>
          <div className="mx-auto max-w-7xl h-1 rounded-full bg-[#2563EB]" />
        </div>

        {/* 5. CTA */}
        <section className="px-6 py-11 md:px-12 md:py-16 lg:px-24">
          <div className="mx-auto max-w-4xl rounded-3xl bg-gray-100 px-6 py-8 text-center shadow-inner md:px-10 md:py-11">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
              Ready to find your next co-founder?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600">
              Side-Sync 생태계에 합류해 당신의 아이디어에 맞는 팀을 만나 보세요.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/signup"
                className="inline-flex min-w-[200px] items-center justify-center rounded-xl bg-[#2563EB] px-8 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1d4ed8]"
              >
                Join Protocol
              </Link>
              <Link
                href="/projects"
                className="inline-flex min-w-[200px] items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
              >
                Explore Talent
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
