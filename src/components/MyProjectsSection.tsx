"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useServerHydratedSession } from "@/contexts/AuthSessionContext";
import { useMyProjects } from "@/hooks/useMyProjects";
import ProjectCard from "@/components/ProjectCard";
import EmptyState from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/Skeleton";

export default function MyProjectsSection() {
  const session = useServerHydratedSession();
  const [userId, setUserId] = useState<string | null>(() => session?.user?.id ?? null);
  const { data: projects, isLoading } = useMyProjects(userId ?? "");

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
      return;
    }
    void createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, [session]);

  if (!userId) return null;

  return (
    <section className="px-6 md:px-12 lg:px-24">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">참여 중인 프로젝트</h2>
        <p className="mt-1 text-sm text-gray-500">
          내가 리드하거나 참여 중인 프로젝트입니다.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && projects && projects.length === 0 && (
        <EmptyState
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          title="아직 참여 중인 프로젝트가 없어요"
          description="멋진 프로젝트에 지원하거나 직접 만들어보세요!"
          actions={[
            { label: "프로젝트 탐색하기", href: "/dashboard", primary: true },
            { label: "새 프로젝트 만들기", href: "/projects/create", primary: false },
          ]}
        />
      )}

      {!isLoading && projects && projects.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.slice(0, 6).map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              title={project.title}
              techStack={project.techStack}
              mannerTemperature={project.mannerTemperature}
              description={project.description}
              gradient={project.gradient}
              showWorkspaceLink
            />
          ))}
        </div>
      )}
      {!isLoading && projects && projects.length > 0 && (
        <Link
          href="/projects"
          className="mt-6 inline-flex items-center gap-1 text-[#2563EB] font-medium hover:underline"
        >
          전체 보기
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      )}
    </section>
  );
}
