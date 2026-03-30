import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "온보딩",
  description:
    "Side-Sync 신규 가입 후 프로필과 관심 분야를 설정해 맞춤 프로젝트 추천과 팀 매칭을 시작하세요.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
