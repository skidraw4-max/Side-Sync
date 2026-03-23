"use client";

import Link from "next/link";

interface ManageApplicantsSidebarProps {
  projectId: string;
  projectTitle: string;
  teamLeaderName: string;
}

const SIDEBAR_ITEMS = [
  { label: "Overview", href: "#", icon: "layout" },
  { label: "Active Projects", href: "#", icon: "folder" },
  { label: "Applicants", href: "applicants", icon: "users", active: true },
  { label: "Pending Invites", href: "#", icon: "mail" },
  { label: "Archive", href: "#", icon: "archive" },
];

export default function ManageApplicantsSidebar({
  projectId,
  projectTitle,
  teamLeaderName,
}: ManageApplicantsSidebarProps) {
  const baseHref = `/projects/${projectId}/manage`;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-slate-900">{projectTitle}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Lead: {teamLeaderName}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = item.active ?? item.label === "Applicants";
          const href = item.href === "applicants" ? baseHref : item.href;
          return (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-l-2 border-[#2563EB] bg-blue-50/80 text-[#2563EB]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.icon === "layout" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              )}
              {item.icon === "folder" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              )}
              {item.icon === "users" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )}
              {item.icon === "mail" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              )}
              {item.icon === "archive" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 8v13H3V8" />
                  <path d="M1 3h22v5H1z" />
                  <path d="M10 12h4" />
                </svg>
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <Link
          href={`/projects/${projectId}/manage`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New Opening
        </Link>
        <a
          href="#"
          className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <span>?</span>
          Help Center
        </a>
      </div>
    </aside>
  );
}
