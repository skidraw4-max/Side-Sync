"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/Skeleton";

const SCROLL_TARGET_ID = "home-project-cards";
const COUNT_MS = 900;

export interface ProjectStatsPayload {
  recruiting: number;
  inProgress: number;
  completed: number;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function useAnimatedCounts(target: ProjectStatsPayload | null, enabled: boolean) {
  const [display, setDisplay] = useState<ProjectStatsPayload>({
    recruiting: 0,
    inProgress: 0,
    completed: 0,
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !target) return;

    const start = performance.now();
    const from = { recruiting: 0, inProgress: 0, completed: 0 };

    const tick = (now: number) => {
      const elapsed = now - start;
      const p = easeOutCubic(Math.min(1, elapsed / COUNT_MS));
      setDisplay({
        recruiting: Math.round(from.recruiting + (target.recruiting - from.recruiting) * p),
        inProgress: Math.round(from.inProgress + (target.inProgress - from.inProgress) * p),
        completed: Math.round(from.completed + (target.completed - from.completed) * p),
      });
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, target]);

  return display;
}

function scrollToProjectCards() {
  const el = document.getElementById(SCROLL_TARGET_ID);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ProjectStats() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ProjectStatsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stats/projects", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as ProjectStatsPayload;
        if (!cancelled) {
          setStats({
            recruiting: Number(data.recruiting) || 0,
            inProgress: Number(data.inProgress) || 0,
            completed: Number(data.completed) || 0,
          });
        }
      } catch {
        if (!cancelled) {
          setStats({ recruiting: 0, inProgress: 0, completed: 0 });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const animated = useAnimatedCounts(stats, !isLoading && stats !== null);
  const onStatClick = useCallback(() => {
    scrollToProjectCards();
  }, []);

  if (isLoading) {
    return (
      <div
        className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4 md:mt-9"
        aria-busy
        aria-label="프로젝트 통계 로딩 중"
      >
        {[1, 2, 3].map((k) => (
          <div
            key={k}
            className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-5 py-4 shadow-sm backdrop-blur-sm"
          >
            <Skeleton className="h-3 w-16" rounded="lg" />
            <Skeleton className="h-9 w-14" rounded="lg" />
          </div>
        ))}
      </div>
    );
  }

  const items: { key: keyof ProjectStatsPayload; label: string; value: number }[] = [
    { key: "recruiting", label: "모집 중", value: animated.recruiting },
    { key: "inProgress", label: "진행 중", value: animated.inProgress },
    { key: "completed", label: "완료", value: animated.completed },
  ];

  return (
    <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-4 md:mt-9">
      {items.map(({ key, label, value }) => (
        <button
          key={key}
          type="button"
          onClick={onStatClick}
          className="group flex flex-1 flex-col items-center justify-center rounded-xl border border-slate-200/90 bg-white/70 px-5 py-4 shadow-sm backdrop-blur-sm transition hover:border-[#2563EB]/40 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
        >
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
          <span className="mt-1 text-3xl font-bold tabular-nums text-[#2563EB] transition group-hover:text-[#1d4ed8]">
            {value}
          </span>
          <span className="mt-1 text-[11px] text-slate-400">프로젝트 보기</span>
        </button>
      ))}
    </div>
  );
}
