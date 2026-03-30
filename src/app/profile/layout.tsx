import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프로필",
  description:
    "Side-Sync 프로필에서 기술 스택, 소개, 매너 온도를 관리하고 참여·모집 중인 프로젝트를 확인하세요.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
