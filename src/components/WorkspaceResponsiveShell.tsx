"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import WorkspaceSidebarNav from "./WorkspaceSidebarNav";

interface Channel {
  id: string;
  slug: string;
  name: string;
}

interface WorkspaceResponsiveShellProps {
  projectId: string;
  projectTitle: string;
  profile: { full_name: string | null; avatar_url: string | null } | null;
  isLeader: boolean;
  projectStatus: string;
  channels: Channel[];
  children: React.ReactNode;
}

export default function WorkspaceResponsiveShell({
  projectId,
  projectTitle,
  profile,
  isLeader,
  projectStatus,
  channels,
  children,
}: WorkspaceResponsiveShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile: hamburger + overlay */}
      <div className="fixed left-0 top-28 z-40 flex h-14 w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          className="flex rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="메뉴 열기"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </button>
        <span className="truncate text-sm font-medium text-gray-900">{projectTitle || "Workspace"}</span>
        <div className="w-10" /> {/* spacer for centering */}
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          aria-hidden
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen min-h-0 w-56 shrink-0 flex-col border-r border-gray-200 bg-[#FAFAFA] shadow-xl transition-transform duration-200 sm:relative sm:shadow-none ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-end border-b border-gray-200 px-4 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="메뉴 닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* overflow는 사이드바 내부 nav에만 두어 '프로젝트 종료' 등 하단 고정 UI가 잘리지 않게 함 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <WorkspaceSidebarNav
          projectId={projectId}
          projectTitle={projectTitle}
          profile={profile}
          isLeader={isLeader}
          projectStatus={projectStatus}
          channels={channels}
        />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col pt-14 sm:pt-0">{children}</main>
    </div>
  );
}
