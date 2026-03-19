"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface Channel {
  id: string;
  slug: string;
  name: string;
}

export default function WorkspaceSidebarNav({
  projectId,
  projectTitle,
  profile,
  isLeader,
  projectStatus = "active",
  channels = [],
}: {
  projectId: string;
  projectTitle?: string;
  profile: { full_name: string | null; avatar_url: string | null } | null;
  isLeader: boolean;
  projectStatus?: string;
  channels?: Channel[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [endingProject, setEndingProject] = useState(false);
  const currentChannelSlug = searchParams?.get("channel") ?? "general";
  const isChatPage = pathname?.includes("/workspace/chat");

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "#", icon: "grid" },
    { label: "Tasks", href: `/projects/${projectId}/workspace/tasks`, icon: "checklist" },
    { label: "Chat", href: `/projects/${projectId}/workspace/chat`, icon: "chat" },
    { label: "Notices", href: `/projects/${projectId}/workspace/notices`, icon: "megaphone" },
    { label: "Files", href: "#", icon: "folder" },
    { label: "Settings", href: "#", icon: "gear" },
  ];

  const handleEndProject = async () => {
    if (!confirm("프로젝트를 종료하시겠습니까? 종료 후 모든 팀원에게 상호 평가가 요청됩니다.")) return;
    setEndingProject(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/end`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "종료에 실패했습니다.");
      router.push(`/projects/${projectId}/evaluate`);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "프로젝트 종료에 실패했습니다.");
    } finally {
      setEndingProject(false);
    }
  };

  const isActive = (href: string) => {
    if (href === "#") return false;
    const noticesHref = `/projects/${projectId}/workspace/notices`;
    const tasksHref = `/projects/${projectId}/workspace/tasks`;
    const chatHref = `/projects/${projectId}/workspace/chat`;
    if (pathname.startsWith(noticesHref)) return href === noticesHref;
    if (pathname.startsWith(tasksHref)) return href === tasksHref;
    if (pathname.startsWith(chatHref)) return href === chatHref;
    if (pathname === `/projects/${projectId}/workspace`) return href === tasksHref;
    return false;
  };

  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-[#FAFAFA]">
      <Link href="/" className="flex items-center gap-2 p-5 hover:opacity-90 transition-opacity">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <path d="M16 3h5v5" />
            <path d="M8 21H3v-5" />
            <path d="M21 3l-7 7" />
            <path d="M3 21l7-7" />
          </svg>
        </div>
        <span className="font-semibold text-gray-800">Side-Sync</span>
      </Link>

      {projectTitle && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-white px-3 py-2.5 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
            {(projectTitle[0] ?? "P").toUpperCase()}
          </div>
          <span className="truncate text-sm font-medium text-gray-900">{projectTitle}</span>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-full px-3 py-2.5 text-sm transition-colors ${
              isActive(item.href)
                ? "bg-[#2563EB]/10 font-medium text-[#2563EB]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {item.icon === "grid" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            )}
            {item.icon === "checklist" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            )}
            {item.icon === "chat" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            )}
            {item.icon === "megaphone" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 11 18-5v12L3 14v-3z" />
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
              </svg>
            )}
            {item.icon === "folder" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            )}
            {item.icon === "gear" && (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            )}
            {item.label}
          </Link>
        ))}
      </nav>

      {isLeader && projectStatus === "active" && (
        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={handleEndProject}
            disabled={endingProject}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
            {endingProject ? "처리 중..." : "프로젝트 종료"}
          </button>
        </div>
      )}

      {isChatPage && channels.length > 0 && (
        <div className="px-3 pb-2">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Channels
          </p>
          <div className="space-y-0.5">
            {channels.map((ch) => (
              <Link
                key={ch.id}
                href={`/projects/${projectId}/workspace/chat?channel=${ch.slug}`}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors ${
                  currentChannelSlug === ch.slug
                    ? "bg-[#2563EB]/10 font-medium text-[#2563EB]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-gray-400">#</span>
                {ch.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100" aria-label="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
              {(profile?.full_name?.[0] ?? "?").toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {profile?.full_name ?? "User"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {isLeader ? "Project Lead" : "Member"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
