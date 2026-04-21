"use client";

import Link from "next/link";
import { WORKSPACE } from "@/lib/constants/contents";
import type { KanbanColumnWikiItem } from "@/types/kanban";

export interface KanbanWikiListProps {
  projectId: string;
  /** 해당 칸반 컬럼(단계)에 속한 위키만 전달 */
  items: KanbanColumnWikiItem[];
}

/**
 * 칸반 컬럼 하단: 단계별 연결 위키 링크 목록
 */
export default function KanbanWikiList({ projectId, items }: KanbanWikiListProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-3">
      <p className="mb-2 text-xs font-semibold text-gray-600">{WORKSPACE.kanbanWikiListHeading}</p>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-800 marker:text-[#2563EB]">
        {items.map((w) => (
          <li key={w.id} className="leading-snug">
            <Link
              href={`/projects/${projectId}/workspace/wiki/${w.id}`}
              className="rounded-sm text-gray-800 outline-none transition-colors hover:text-[#2563EB] hover:underline focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
            >
              {w.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
