import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
  description:
    "참여 중인 사이드 프로젝트, 지원 현황, 팀 알림을 Side-Sync 대시보드에서 한눈에 관리하세요.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
