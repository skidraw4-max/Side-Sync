import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectDetailHeader from "@/components/ProjectDetailHeader";
import ProjectDetailStitch from "@/components/ProjectDetailStitch";
import Footer from "@/components/Footer";
import { getDemoProjectById } from "@/lib/demo-projects";
import { fetchAcceptedApplicationsForProject, fetchProjectDetailById } from "@/lib/supabase-project-queries";
import type { RecruitmentStatusRow } from "@/types/database";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

/** 쿠키 기반 세션으로 매 요청 조회 (목록→상세 이동 시 캐시로 인한 404 방지) */
export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const demo = getDemoProjectById(id);
  if (demo) {
    const defaultMilestones = [
      { label: "Architecture", percent: 100, icon: "check" as const },
      { label: "Sync Engine (Current)", percent: 65, icon: "sync" as const },
      { label: "Public Beta", percent: 0, icon: "lock" as const },
    ];
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <ProjectDetailHeader />
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-center text-sm text-amber-900 md:px-12 lg:px-24">
          <span className="font-medium">샘플 프로젝트</span>
          <span className="text-amber-800">
            {" "}
            — 실제 DB에 등록된 프로젝트가 없을 때 표시되는 예시입니다. 프로젝트를 생성하면 여기에 표시됩니다.
          </span>
        </div>
        <ProjectDetailStitch
          projectId={id}
          projectTitle={demo.title}
          projectDescription={demo.description}
          techStack={demo.techStack}
          mannerTempTarget={demo.mannerTemperature}
          teamLeader={{
            name: "Side-Sync",
            role: "Demo · 샘플 리드",
            avatarUrl: null,
          }}
          recruitmentStatus={null}
          acceptedApplicants={[]}
          profilesMap={{}}
          isLeader={false}
          hasApplied={false}
          visibility="Public"
          durationMonths={6}
          estLaunch="TBD"
          milestones={defaultMilestones}
        />
        <Footer variant="stitch" />
      </div>
    );
  }

  const projectRaw = await fetchProjectDetailById(supabase, id);

  if (!projectRaw) {
    notFound();
  }

  const project = projectRaw as {
    id: string;
    title: string;
    description: string | null;
    goal: string | null;
    tech_stack: unknown;
    team_leader_id: string | null;
    recruitment_status: unknown;
    manner_temp_target: string | null;
    visibility: string | null;
    duration_months: number | null;
    est_launch: string | null;
    created_at: string;
  };

  const isLeader = !!user && user.id === project.team_leader_id;

  // 팀장 프로필
  let teamLeader: { name: string; role: string; avatarUrl: string | null } | null = null;
  if (project.team_leader_id) {
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", project.team_leader_id)
      .single();
    const profile = profileRaw as { full_name: string | null; role: string | null; avatar_url: string | null } | null;
    if (profile) {
      teamLeader = {
        name: profile.full_name ?? "Unknown",
        role: profile.role ?? "Project Lead",
        avatarUrl: profile.avatar_url,
      };
    }
  }

  // accepted 지원자 (role 컬럼 없는 DB는 applicant_id만 조회)
  const acceptedApplicantsRaw = await fetchAcceptedApplicationsForProject(supabase, id);
  const acceptedApplicants = acceptedApplicantsRaw.map((a) => ({ applicant_id: a.applicant_id, role: a.role ?? null }));
  const applicantIds = [...new Set(acceptedApplicantsRaw.map((a) => a.applicant_id))];
  if (project.team_leader_id && !applicantIds.includes(project.team_leader_id)) {
    applicantIds.push(project.team_leader_id);
  }

  // 프로필 맵 (applicant_id / team_leader_id -> profile)
  const profilesMap: Record<string, { full_name: string | null; avatar_url: string | null; manner_temp_target: string | null }> = {};
  if (applicantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, manner_temp_target")
      .in("id", applicantIds);
    ((profiles ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null; manner_temp_target: string | null }>).forEach((p) => {
      profilesMap[p.id] = {
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        manner_temp_target: p.manner_temp_target,
      };
    });
  }

  // 현재 사용자 지원 여부
  let hasApplied = false;
  if (user) {
    const { data: myApp } = await supabase
      .from("applications")
      .select("id")
      .eq("project_id", id)
      .eq("applicant_id", user.id)
      .maybeSingle();
    hasApplied = !!myApp;
  }

  // 마일스톤 (recruitment_status 기반)
  const rawStatus = project.recruitment_status as RecruitmentStatusRow[] | null;
  const defaultMilestones = [
    { label: "Architecture", percent: 100, icon: "check" as const },
    { label: "Sync Engine (Current)", percent: 65, icon: "sync" as const },
    { label: "Public Beta", percent: 0, icon: "lock" as const },
  ];
  const milestones =
    Array.isArray(rawStatus) && rawStatus.length > 0
      ? rawStatus.map((r, i) => ({
          label: r.role,
          percent: i === 0 ? 100 : i === 1 ? 65 : 0,
          icon: (i === 0 ? "check" : i === 1 ? "sync" : "lock") as "check" | "sync" | "lock",
        }))
      : defaultMilestones;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <ProjectDetailHeader />

      {isLeader && (
        <div className="flex items-center justify-between gap-4 bg-[#2563EB] px-6 py-3 md:px-12 lg:px-24">
          <div className="flex items-center gap-2 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-sm font-medium">You are the leader of this project</span>
          </div>
          <Link
            href={`/projects/${id}/manage`}
            className="rounded border border-white/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
          >
            EDIT PROJECT
          </Link>
        </div>
      )}

      <ProjectDetailStitch
        projectId={id}
        projectTitle={project.title}
        projectDescription={project.description}
        techStack={Array.isArray(project.tech_stack) ? project.tech_stack : []}
        mannerTempTarget={project.manner_temp_target ?? "36.5°C"}
        teamLeader={teamLeader}
        recruitmentStatus={rawStatus}
        acceptedApplicants={acceptedApplicants}
        profilesMap={profilesMap}
        isLeader={isLeader}
        hasApplied={hasApplied}
        visibility={(project as { visibility?: string }).visibility ?? "Public"}
        durationMonths={(project as { duration_months?: number }).duration_months ?? 6}
        estLaunch={(project as { est_launch?: string }).est_launch ?? "Dec 2024"}
        milestones={milestones}
      />

      <Footer variant="stitch" />
    </div>
  );
}
