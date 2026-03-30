"use client";

import ProjectCard from "./ProjectCard";
import EmptyState from "./EmptyState";
import { ProjectCardSkeleton } from "./Skeleton";
import { useProjects } from "@/hooks/useProjects";

export interface TrendingProjectsProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}

export default function TrendingProjects({ searchQuery, onSearchQueryChange }: TrendingProjectsProps) {
  const { data: projects, isLoading, isError, error } = useProjects(searchQuery);
  const hasActiveSearch = searchQuery.trim().length > 0;

  return (
    <section className="px-6 md:px-12 lg:px-24">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold text-gray-900">Trending Projects</h2>
          <p className="mt-1 text-sm text-gray-500">
            Discover what the community is building right now.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:min-w-[320px]">
          <label className="sr-only" htmlFor="trending-project-search">
            프로젝트 검색
          </label>
          <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:min-w-[240px]">
            <div className="flex flex-1 items-center gap-2 px-3 py-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="shrink-0 text-gray-400"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="trending-project-search"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="검색어 입력..."
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>
          <a
            href="/projects"
            className="flex shrink-0 items-center gap-1 text-[#2563EB] font-medium hover:underline"
          >
            View all projects
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6 xl:gap-7">
          {[1, 2, 3].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">
            프로젝트를 불러올 수 없습니다.{" "}
            {error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."}
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Supabase 연결 설정(.env.local)을 확인해 주세요.
          </p>
        </div>
      )}

      {!isLoading && !isError && projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6 xl:gap-7">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              techStack={project.techStack}
              mannerTemperature={project.mannerTemperature}
              description={project.description}
              gradient={project.gradient}
              showWorkspaceLink={project.showWorkspaceLink}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && projects && projects.length === 0 && hasActiveSearch && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/80 px-6 py-12 text-center">
          <p className="text-lg font-medium text-gray-900">검색 결과가 없습니다</p>
          <p className="mt-2 text-sm text-gray-600">
            다른 검색어로 시도하거나 전체 프로젝트 목록을 다시 확인해 보세요.
          </p>
          <button
            type="button"
            onClick={() => onSearchQueryChange("")}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
          >
            전체 목록 보기
          </button>
        </div>
      )}

      {!isLoading && !isError && projects && projects.length === 0 && !hasActiveSearch && (
        <EmptyState
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          }
          title="등록된 프로젝트가 없습니다"
          description="아직 커뮤니티에서 진행 중인 프로젝트가 없어요. 첫 프로젝트를 만들어보세요!"
          actions={[
            { label: "프로젝트 만들기", href: "/projects/create", primary: true },
          ]}
        />
      )}
    </section>
  );
}
