"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/Skeleton";

/** 모집 중 — 메가폰 스피커 실루엣 */
function IconRecruiting({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10v4a1 1 0 001 1h2l4 4V5l-4 4H5a1 1 0 00-1 1zM15.5 12a5.5 5.5 0 00-3-4.9v9.8a5.5 5.5 0 003-4.9zM18 5.2v13.6c2-1.2 3.4-3.5 3.4-6.8S20 6.4 18 5.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconInProgress({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 4v2M12 18v2M4 12h2M18 12h2M6.34 6.34l1.41 1.41M16.24 16.24l1.42 1.42M17.66 6.34l-1.41 1.41M7.76 16.24l-1.42 1.42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCompleted({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="4" className="fill-emerald-500" />
      <path
        d="M8 12l2.5 2.5L16 9"
        className="stroke-white"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface BentoLiveStatsProps {
  scrollTargetId?: string;
}

/**
 * Live Stats: 시안과 동일 라벨·아이콘·숫자 색 (12px 라운드 카드, 소프트 섀도)
 */
export default function BentoLiveStats({ scrollTargetId = "home-project-cards" }: BentoLiveStatsProps) {
  const [loading, setLoading] = useState(true);
  const [recruiting, setRecruiting] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stats/projects", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as {
          recruiting?: number;
          inProgress?: number;
          completed?: number;
        };
        if (!cancelled) {
          setRecruiting(Number(data.recruiting) || 0);
          setInProgress(Number(data.inProgress) || 0);
          setCompleted(Number(data.completed) || 0);
        }
      } catch {
        if (!cancelled) {
          setRecruiting(154);
          setInProgress(87);
          setCompleted(129);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollToCards = () => {
    if (typeof document === "undefined") return;
    document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <article
      className="flex h-full flex-col rounded-xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.08)]"
      aria-labelledby="bento-livestats-heading"
    >
      <h2
        id="bento-livestats-heading"
        className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900 md:text-sm"
      >
        Live Stats
      </h2>
      {loading ? (
        <div className="mt-6 flex flex-1 flex-col gap-4" aria-busy>
          {[1, 2, 3].map((k) => (
            <div key={k} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" rounded="lg" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-40" rounded="md" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="mt-6 flex flex-1 flex-col gap-6">
          <li>
            <button
              type="button"
              onClick={scrollToCards}
              className="flex w-full items-center gap-3 rounded-xl text-left transition hover:bg-amber-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <IconRecruiting className="h-6 w-6" />
              </span>
              <p className="flex flex-wrap items-baseline gap-x-1.5 text-base leading-none">
                <span className="font-semibold text-slate-800">Recruiting:</span>
                <span className="text-3xl font-bold tabular-nums text-[#1e3a5f]" data-stat="recruiting">
                  {recruiting}
                </span>
              </p>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={scrollToCards}
              className="flex w-full items-center gap-3 rounded-xl text-left transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                <IconInProgress className="h-6 w-6" />
              </span>
              <p className="flex flex-wrap items-baseline gap-x-1.5 text-base leading-none">
                <span className="font-semibold text-slate-800">In Progress:</span>
                <span className="text-3xl font-bold tabular-nums text-[#2563eb]" data-stat="inProgress">
                  {inProgress}
                </span>
              </p>
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={scrollToCards}
              className="flex w-full items-center gap-3 rounded-xl text-left transition hover:bg-emerald-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <IconCompleted className="h-9 w-9" />
              </span>
              <p className="flex flex-wrap items-baseline gap-x-1.5 text-base leading-none">
                <span className="font-semibold text-slate-800">Completed:</span>
                <span className="text-3xl font-bold tabular-nums text-emerald-600" data-stat="completed">
                  {completed}
                </span>
              </p>
            </button>
          </li>
        </ul>
      )}
    </article>
  );
}
