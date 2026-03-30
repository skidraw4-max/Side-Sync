"use client";

import Link from "next/link";
import { Thermometer } from "lucide-react";
import { cn } from "@/lib/cn";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCardSkeleton } from "@/components/Skeleton";
import type { ProjectRecruitmentState } from "@/lib/project-recruitment-state";

function EcosystemCard({
  id,
  title,
  techStack,
  mannerTemperature,
  gradient,
  recruitmentState,
}: {
  id: string;
  title: string;
  techStack: string[];
  mannerTemperature: string;
  gradient: string;
  recruitmentState: ProjectRecruitmentState;
}) {
  const closed = recruitmentState === "closed" || recruitmentState === "full";

  return (
    <Link
      href={`/projects/${id}${closed ? "" : "?apply=1"}`}
      className="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className={cn("relative h-40 overflow-hidden bg-gradient-to-br sm:h-44", gradient)}>
        <div
          className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_1.5px_1.5px,rgb(255_255_255/0.4)_1px,transparent_0)] [background-size:12px_12px]"
          aria-hidden
        />
        <div className="absolute right-3 top-3 z-10 flex flex-col items-end rounded-xl bg-white px-3 py-2.5 shadow-lg ring-2 ring-[#2563EB]/20">
          <div className="flex items-center gap-1.5">
            <Thermometer
              className="h-4 w-4 shrink-0 text-orange-500"
              strokeWidth={2.25}
              aria-hidden
            />
            <span className="text-base font-bold tabular-nums text-gray-900">{mannerTemperature}</span>
          </div>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            신뢰 지수
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold leading-snug text-gray-900">{title}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {techStack.length > 0 ? (
            techStack.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#2563EB]"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">스택 미등록</span>
          )}
        </div>
        <span className="mt-4 flex w-full items-center justify-center rounded-lg bg-[#2563EB] py-2.5 text-sm font-semibold text-white shadow-md transition group-hover:bg-blue-700">
          Side-Sync에 지원하기
        </span>
      </div>
    </Link>
  );
}

export default function AboutLiveProjects() {
  const { data: projects, isLoading, isError, error } = useProjects("");

  const list = (projects ?? []).slice(0, 6);

  return (
    <section
      className="bg-white px-6 py-16 md:px-10 md:py-20 lg:px-16 lg:py-24 xl:px-24"
      aria-labelledby="about-live-projects-heading"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2
              id="about-live-projects-heading"
              className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl"
            >
              Live Ecosystem Projects
            </h2>
            <p className="mt-1 text-sm text-gray-500 md:text-base">
              지금 모집 중인 프로젝트를 확인하고 팀에 합류해 보세요.
            </p>
          </div>
          <Link
            href="/explore"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#2563EB] hover:underline md:text-base"
          >
            전체 프로젝트 보기
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
            프로젝트를 불러오지 못했습니다.{" "}
            {error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요."}
          </p>
        )}

        {!isLoading && !isError && list.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {list.map((p) => (
              <EcosystemCard
                key={p.id}
                id={p.id}
                title={p.title}
                techStack={p.techStack}
                mannerTemperature={p.mannerTemperature}
                gradient={p.gradient ?? "from-slate-800 via-slate-900 to-blue-950"}
                recruitmentState={p.recruitmentState ?? "recruiting"}
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && list.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            표시할 프로젝트가 없습니다.{" "}
            <Link href="/projects/create" className="font-semibold text-[#2563EB] hover:underline">
              새 프로젝트 만들기
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
