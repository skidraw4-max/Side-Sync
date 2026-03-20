"use client";

import { Briefcase, UserPlus, Zap } from "lucide-react";

const features = [
  {
    icon: UserPlus,
    title: "AI 파트너 매칭",
    description:
      "프로필·기술 스택·매너 온도를 반영해 나에게 맞는 동료를 AI가 추천합니다.",
  },
  {
    icon: Briefcase,
    title: "전용 워크스페이스",
    description:
      "칸반, 채팅, 공지까지 한 공간에서 관리하며 팀과 속도를 맞춰 나갑니다.",
  },
  {
    icon: Zap,
    title: "상호 평가 및 성장",
    description:
      "프로젝트 종료 후 피드백과 인사이트로 다음 협업과 성장을 이어 갑니다.",
  },
];

export default function FeatureCards() {
  return (
    <section className="border-t border-slate-100 bg-white px-6 py-16 md:px-12 md:py-20 lg:px-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-10 lg:gap-12">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-3xl border border-slate-100 bg-white p-10 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </div>
            <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900">{title}</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-600">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
