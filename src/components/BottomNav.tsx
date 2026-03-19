"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "HOME",
    href: "/",
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#2563EB" : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "EXPLORE",
    href: "/projects",
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#2563EB" : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    label: "",
    href: "/projects/create",
    icon: () => null,
    isAdd: true,
  },
  {
    label: "WORKSPACE",
    href: "/projects",
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#2563EB" : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
    ),
  },
  {
    label: "PROFILE",
    href: "/profile",
    icon: (active: boolean) => (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#2563EB" : "#6B7280"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-gray-100 bg-white px-2 pb-safe md:hidden">
      {NAV_ITEMS.map((item) => {
        if (item.isAdd) {
          return (
            <Link
              key="add"
              href={item.href}
              className="flex h-14 w-14 -mt-7 flex-shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg transition-all hover:bg-[#1d4ed8] active:scale-95"
              aria-label="새 프로젝트 만들기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          );
        }

        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 py-2 min-w-[56px]"
          >
            {item.icon(active)}
            <span className={`text-[10px] font-medium uppercase tracking-wider ${active ? "text-[#2563EB]" : "text-gray-500"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
