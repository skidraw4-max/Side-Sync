import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프로필 수정",
  description:
    "표시 이름, 소개, 기술 스택 등 Side-Sync 프로필 정보를 수정해 팀 매칭과 증명서에 반영되도록 하세요.",
};

export default function ProfileEditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
