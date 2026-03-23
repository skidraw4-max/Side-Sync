"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

function workspaceSegmentLabel(pathname: string): string {
  if (pathname.includes("/workspace/tasks")) return "태스크";
  if (pathname.includes("/workspace/notices")) return "공지";
  if (pathname.includes("/workspace/chat")) return "채팅";
  if (pathname.endsWith("/workspace") || pathname.endsWith("/workspace/")) return "워크스페이스";
  return "워크스페이스";
}

function buildItems(
  pathname: string | null,
  projectId: string,
  projectTitle: string
): BreadcrumbItem[] {
  if (!pathname) {
    return [{ label: "내 프로젝트", href: "/projects" }];
  }

  const items: BreadcrumbItem[] = [{ label: "내 프로젝트", href: "/projects" }];

  const title = projectTitle.trim() || "프로젝트";
  items.push({ label: title, href: `/projects/${projectId}` });

  if (pathname.includes("/workspace")) {
    items.push({ label: workspaceSegmentLabel(pathname) });
    return items;
  }

  if (pathname.includes("/manage")) {
    items.push({ label: "팀 관리" });
    return items;
  }
  if (pathname.includes("/edit")) {
    items.push({ label: "프로젝트 수정" });
    return items;
  }
  if (pathname.includes("/evaluate")) {
    items.push({ label: "상호 평가" });
    return items;
  }

  // /projects/[id] 상세
  items.push({ label: "프로젝트 상세" });
  return items;
}

interface BreadcrumbProps {
  projectId: string;
  projectTitle: string;
}

export default function Breadcrumb({ projectId, projectTitle }: BreadcrumbProps) {
  const pathname = usePathname();
  const crumbs = buildItems(pathname, projectId, projectTitle);

  return (
    <nav aria-label="breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-600">
      {crumbs.map((item, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && (
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden strokeWidth={2} />
            )}
            {isLast ? (
              <span className="font-semibold text-slate-900">{item.label}</span>
            ) : item.href ? (
              <Link href={item.href} className="transition-colors hover:text-slate-900">
                {item.label}
              </Link>
            ) : (
              <span>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
