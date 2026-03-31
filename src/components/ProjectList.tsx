"use client";

import ProjectCard from "./ProjectCard";
import EmptyState from "./EmptyState";
import { ProjectCardSkeleton } from "./Skeleton";
import { useMyProjects } from "@/hooks/useMyProjects";

interface ProjectListProps {
  userId: string;
}

export default function ProjectList({ userId }: ProjectListProps) {
  const { data: projects, isLoading, isError, error } = useMyProjects(userId);

  return (
    <section className="px-6 md:px-12 lg:px-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">내 프로젝트</h1>
        <p className="mt-1 text-sm text-gray-500">
          리더이거나 참여 중인 프로젝트 목록입니다.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-6 xl:gap-7">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
              recruitmentState={project.recruitmentState}
              completedPostAction={project.completedPostAction ?? null}
              showWorkspaceLink
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
          title="참여 중인 프로젝트가 없습니다"
          description="새 프로젝트를 만들거나 기존 프로젝트에 지원해보세요."
          actions={[
            { label: "프로젝트 탐색하기", href: "/dashboard", primary: true },
            { label: "새 프로젝트 만들기", href: "/projects/create", primary: false },
          ]}
        />
      )}
    </section>
  );
}
