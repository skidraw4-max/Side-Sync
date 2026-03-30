import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프로젝트 만들기",
  description:
    "새 사이드 프로젝트를 등록하고 모집 역할·일정·기술 스택을 작성해 Side-Sync에서 팀원을 모집하세요.",
};

export default function CreateProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
