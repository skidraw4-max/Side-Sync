"use client";

import ProjectCard from "./ProjectCard";
import EmptyState from "./EmptyState";
import { ProjectCardSkeleton } from "./Skeleton";
import { useProjects } from "@/hooks/useProjects";

export default function TrendingProjects() {
  const { data: projects, isLoading, isError, error } = useProjects();

  return (
    <section className="px-6 md:px-12 lg:px-24">
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Trending Projects
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Discover what the community is building right now.
          </p>
        </div>
        <a
          href="#"
          className="mt-4 flex items-center gap-1 text-[#2563EB] font-medium hover:underline sm:mt-0"
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

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              techStack={project.techStack}
              mannerTemperature={project.mannerTemperature}
              description={project.description}
              gradient={project.gradient}
            />
          ))}
        </div>
      )}

      {!isLoading && !isError && projects && projects.length === 0 && (
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
