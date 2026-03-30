import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "지원자 관리",
  description:
    "내가 팀장으로 진행 중인 프로젝트에 지원한 지원자 목록을 확인하고 수락·거절할 수 있습니다.",
};

export default function DashboardApplicantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
