"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

interface ProjectSubNavProps {
  projectId: string;
}

const linkBase =
  "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors";

export default function ProjectSubNav({ projectId }: ProjectSubNavProps) {
  const pathname = usePathname() ?? "";
  const base = `/projects/${projectId}`;

  const items: { href: string; label: string; match: (p: string) => boolean }[] = [
    {
      href: base,
      label: "개요",
      match: (p) => p === base || p === `${base}/`,
    },
    {
      href: `${base}/manage`,
      label: "팀 관리",
      match: (p) => p.startsWith(`${base}/manage`),
    },
    {
      href: `${base}/edit`,
      label: "프로젝트 수정",
      match: (p) => p.startsWith(`${base}/edit`),
    },
    {
      href: `${base}/workspace/tasks`,
      label: "워크스페이스",
      match: (p) => p.includes(`${base}/workspace`),
    },
    {
      href: `${base}/evaluate`,
      label: "상호 평가",
      match: (p) => p.startsWith(`${base}/evaluate`),
    },
  ];

  return (
    <nav
      aria-label="프로젝트 메뉴"
      className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-4 py-2 md:px-8 lg:px-12"
    >
      {items.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              linkBase,
              active ? "bg-blue-50 text-[#2563EB]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
