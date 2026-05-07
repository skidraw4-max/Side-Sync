"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useProjects, type ProjectWithId } from "@/hooks/useProjects";

const PAGE_SIZE = 4;

function CompactTrendingCard({ project }: { project: ProjectWithId }) {
  const tags = project.techStack.slice(0, 4);
  return (
    <div className="flex flex-col rounded-xl bg-white p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.12)] ring-1 ring-slate-200/90">
      <h3 className="text-sm font-bold leading-snug text-slate-900">{project.title}</h3>
      <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Key Skills</p>
      <div className="mt-1.5 flex min-h-[1.75rem] flex-wrap gap-1.5">
        {tags.length > 0 ? (
          tags.map((s) => (
            <span
              key={s}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
            >
              {s}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        )}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-600">Team Size: 0/0</p>
      <Link
        href={project.id ? `/projects/${project.id}` : "/explore"}
        className="mt-auto rounded-xl bg-[#1e3a8a] px-3 py-2.5 text-center text-xs font-bold text-white shadow-sm transition hover:bg-[#1e40af] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-800"
      >
        View Details
      </Link>
    </div>
  );
}

/**
 * 벤토: 트렌딩 프로젝트 — 전폭 행에서 4열 카드(뷰포트 넓을 때 한 줄), 페이지당 4건
 */
export default function BentoTrendingProjects() {
  const { data: projects, isLoading, isError } = useProjects("");
  const [page, setPage] = useState(0);

  const list = projects ?? [];
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages - 1);
  const pageSlice = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return list.slice(start, start + PAGE_SIZE);
  }, [list, safePage]);

  return (
    <article
      className="flex h-full flex-col rounded-xl bg-gradient-to-br from-[#1d4ed8] via-[#1e40af] to-[#172554] p-6 text-white shadow-[0_4px_24px_rgba(15,23,42,0.2)] ring-1 ring-white/10"
      aria-labelledby="bento-trending-heading"
    >
      <h2
        id="bento-trending-heading"
        className="text-xs font-bold uppercase tracking-[0.18em] text-white md:text-sm"
      >
        Trending Projects
      </h2>
      <p className="mt-2 text-sm text-white/85">
        Few<span className="font-semibold text-white">*</span> sample cards for active projects.
      </p>

      {isLoading && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-40 animate-pulse rounded-xl bg-white/20 md:h-44" />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-4 text-sm text-red-200">프로젝트를 불러오지 못했습니다.</p>
      )}

      {!isLoading && !isError && pageSlice.length === 0 && (
        <p className="mt-6 text-sm text-white/85">표시할 프로젝트가 없습니다.</p>
      )}

      {!isLoading && !isError && pageSlice.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {pageSlice.map((p) => (
              <CompactTrendingCard key={p.id} project={p} />
            ))}
          </div>
          {list.length > PAGE_SIZE ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 border-t border-white/15 pt-4">
              <button
                type="button"
                disabled={safePage <= 0}
                onClick={() => setPage((x) => Math.max(0, x - 1))}
                className="rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition enabled:hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                이전
              </button>
              <span className="text-xs tabular-nums text-white/90">
                {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((x) => Math.min(totalPages - 1, x + 1))}
                className="rounded-xl border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition enabled:hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                다음
              </button>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
