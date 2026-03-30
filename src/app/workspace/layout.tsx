import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "워크스페이스",
  description:
    "Side-Sync 워크스페이스 영역에서 팀 파일·공지 등 협업 도구를 이용합니다. 실제 협업은 프로젝트별 워크스페이스에서 진행됩니다.",
  robots: { index: false, follow: true },
};

/**
 * `/workspace/*` 세그먼트 공통 레이아웃.
 * 왼쪽 사이드바·광고는 `WorkspaceSidebar`(예: files 페이지) 등에서 구성합니다.
 */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return children;
}
