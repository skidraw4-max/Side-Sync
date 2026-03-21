import Link from "next/link";
import { BrandLogoMark } from "@/components/BrandLogo";
import AdBanner from "@/components/AdBanner";
import { ADSENSE_CLIENT_ID, ADSENSE_SLOTS } from "@/lib/ads-config";

interface WorkspaceSidebarProps {
  activeItem?: "notice" | "kanban" | "files";
}

export default function WorkspaceSidebar({ activeItem = "files" }: WorkspaceSidebarProps) {
  const navItems = [
    { id: "notice" as const, label: "Notice", href: "/workspace/notices", icon: "bell" },
    { id: "kanban" as const, label: "Kanban", href: "/projects/1/workspace", icon: "chart" },
    { id: "files" as const, label: "Files", href: "/workspace/files", icon: "folder" },
  ];

  return (
    <aside className="flex min-h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white p-6">
      <Link href="/workspace/files" className="flex items-center gap-2">
        <BrandLogoMark size={32} />
        <span className="font-semibold text-gray-800">Side-Sync Workspace</span>
      </Link>

      <nav className="mt-10 space-y-1">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#2563EB]/10 text-[#2563EB]"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {item.icon === "bell" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              )}
              {item.icon === "chart" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              )}
              {item.icon === "folder" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              )}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] py-3 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Project
        </button>
        <div className="mt-6 flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">Alex Kim</p>
            <p className="text-xs text-gray-500">PROJECT LEAD</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-400">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <AdBanner
          adSlotId={ADSENSE_SLOTS.workspaceSidebar}
          adClientId={ADSENSE_CLIENT_ID || undefined}
          className="max-w-full"
        />
      </div>
    </aside>
  );
}
