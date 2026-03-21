import type { ReactNode } from "react";

/**
 * `/workspace/*` 세그먼트 공통 레이아웃.
 * 왼쪽 사이드바·광고는 `WorkspaceSidebar`(예: files 페이지) 등에서 구성합니다.
 */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return children;
}
