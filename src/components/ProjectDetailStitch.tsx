"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ApplyModal from "./ApplyModal";
import type { RecruitmentStatusRow } from "@/types/database";
import { PROJECT } from "@/lib/constants/contents";

/** role 컬럼이 없을 때 모집 정원(total) 순으로 accepted 명수를 배분 (표시용) */
function distributeFilledGreedy(
  totalAccepted: number,
  entries: { role: string; total: number }[]
): Record<string, number> {
  const byRole: Record<string, number> = {};
  let remaining = totalAccepted;
  for (const e of entries) {
    const take = Math.min(e.total, remaining);
    byRole[e.role] = take;
    remaining -= take;
    if (remaining <= 0) break;
  }
  return byRole;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  mannerTemp: string;
}

interface RoleStatus {
  role: string;
  total: number;
  filled: number;
}

interface ProjectDetailStitchProps {
  projectId: string;
  projectTitle: string;
  projectDescription: string | null;
  techStack: string[];
  mannerTempTarget: string;
  teamLeader: { name: string; role: string; avatarUrl: string | null } | null;
  recruitmentStatus: RecruitmentStatusRow[] | null;
  acceptedApplicants: { applicant_id: string; role: string | null }[];
  profilesMap: Record<string, { full_name: string | null; avatar_url: string | null; manner_temp_target: string | null }>;
  isLeader: boolean;
  hasApplied: boolean;
  visibility?: string;
  durationMonths?: number;
  estLaunch?: string;
  milestones?: { label: string; percent: number; icon: "check" | "sync" | "lock" }[];
}

export default function ProjectDetailStitch({
  projectId,
  projectTitle,
  projectDescription,
  techStack,
  mannerTempTarget,
  teamLeader,
  recruitmentStatus,
  acceptedApplicants,
  profilesMap,
  isLeader,
  hasApplied,
  visibility = "Public",
  durationMonths = 6,
  estLaunch = "Dec 2024",
  milestones = [
    { label: "Architecture", percent: 100, icon: "check" as const },
    { label: "Sync Engine (Current)", percent: 65, icon: "sync" as const },
    { label: "Public Beta", percent: 0, icon: "lock" as const },
  ],
}: ProjectDetailStitchProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  /** 매 렌더마다 새 인스턴스면 realtime useEffect가 무한에 가깝게 재실행됨 */
  const supabase = useMemo(() => createClient(), []);

  const roleEntries = useMemo(() => {
    const rawStatus = recruitmentStatus ?? [];
    if (!Array.isArray(rawStatus)) {
      return [
        { role: "UI Designer", total: 1 },
        { role: "Backend Dev", total: 1 },
        { role: "Frontend Dev", total: 2 },
      ];
    }
    return rawStatus.map((r) => ({
      role: r.role,
      total: "count" in r ? (r as { count: number }).count : 1,
    }));
  }, [recruitmentStatus]);

  /** 서버에서 이미 acceptedApplicants를 내려주므로 클라이언트에서 applications 재조회하지 않음 (400·중복 요청 방지) */
  const { rolesWithFilled, membersCount } = useMemo(() => {
    const apps = acceptedApplicants;
    const byRole: Record<string, number> = {};
    const hasRolePerRow = apps.some((a) => a.role != null && String(a.role).trim() !== "");

    if (hasRolePerRow) {
      apps.forEach((a) => {
        const r = a.role ?? PROJECT.roleGeneral;
        byRole[r] = (byRole[r] ?? 0) + 1;
      });
    } else if (apps.length > 0 && roleEntries.length > 0) {
      Object.assign(byRole, distributeFilledGreedy(apps.length, roleEntries));
    }

    const withFilled = roleEntries.map((e) => ({
      role: e.role,
      total: e.total,
      filled: byRole[e.role] ?? 0,
    }));
    const totalFromSlots = withFilled.reduce((s, r) => s + r.filled, 0);
    const acceptedCount = hasRolePerRow ? totalFromSlots : apps.length;
    return {
      rolesWithFilled: withFilled,
      membersCount: acceptedCount + (teamLeader ? 1 : 0),
    };
  }, [acceptedApplicants, roleEntries, teamLeader]);

  useEffect(() => {
    const members: TeamMember[] = [];
    if (teamLeader) {
      members.push({
        id: "leader",
        name: teamLeader.name,
        role: teamLeader.role,
        avatarUrl: teamLeader.avatarUrl,
        mannerTemp: mannerTempTarget,
      });
    }
    acceptedApplicants.forEach((a) => {
      const p = profilesMap[a.applicant_id];
      if (!p) return;
      members.push({
        id: a.applicant_id,
        name: p.full_name ?? PROJECT.unknownUser,
        role: a.role ?? PROJECT.member,
        avatarUrl: p.avatar_url ?? null,
        mannerTemp: p.manner_temp_target ?? mannerTempTarget,
      });
    });
    setTeamMembers(members);
  }, [teamLeader, acceptedApplicants, profilesMap, mannerTempTarget]);

  /** projects만 구독: applications Realtime은 일부 환경에서 불필요한 REST 트래픽/400을 유발할 수 있어 제외 */
  useEffect(() => {
    const sub = supabase
      .channel(`project-detail-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects", filter: `id=eq.${projectId}` },
        () => window.location.reload()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [projectId, supabase]);

  const totalSlots = rolesWithFilled.reduce((s, r) => s + r.total, 0);

  const showApplyButton = !isLeader && !hasApplied;
  const openRoles = rolesWithFilled.filter((r) => r.filled < r.total);
  const anyOpen = openRoles.length > 0;

  return (
    <>
      <div className="relative">
        {/* Top gradient banner */}
        <div
          className="absolute left-0 right-0 top-0 h-32 -z-10 rounded-b-2xl bg-gradient-to-r from-blue-900 via-indigo-800 to-amber-900/40"
          style={{ background: "linear-gradient(90deg, #1e3a8a 0%, #4338ca 40%, #b45309 100%)" }}
        />

        <main className="px-6 pb-16 pt-8 md:px-12 lg:px-24">
          <nav className="mb-6 flex flex-wrap items-center gap-x-1 text-sm text-gray-500">
            <Link href="/" className="whitespace-nowrap hover:text-gray-700">
              {PROJECT.navHome}
            </Link>
            <span className="mx-1">›</span>
            <Link href="/projects" className="whitespace-nowrap hover:text-gray-700">
              {PROJECT.navProjects}
            </Link>
            <span className="mx-1">›</span>
            <span className="min-w-0 break-words text-gray-900">{projectTitle}</span>
          </nav>

          <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:gap-10">
            {/* Left: main content */}
            <div className="flex-1 space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-md md:p-8">
                <span className="inline-block whitespace-nowrap rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold tracking-wide text-white">
                  {PROJECT.activeRecruitmentBadge}
                </span>
                <h1 className="mt-4 text-2xl font-bold text-gray-900 md:text-3xl">
                  {PROJECT.projectTitlePrefix}: {projectTitle}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-6">
                  {teamLeader && (
                    <div className="flex items-center gap-3">
                      {teamLeader.avatarUrl ? (
                        <img
                          src={teamLeader.avatarUrl}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-base font-semibold text-gray-600">
                          {teamLeader.name[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{teamLeader.name}</p>
                        <p className="text-sm text-gray-500">{teamLeader.role}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="text-sm font-medium">
                      {PROJECT.recruitmentHeadcountLabel} {membersCount}/{totalSlots || 5}명
                    </span>
                  </div>
                </div>

                <section className="mt-8">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {PROJECT.overview}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    {projectDescription ?? PROJECT.defaultDescriptionFallback}
                  </p>
                </section>

                <section className="mt-8">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {PROJECT.requiredTechStack}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(techStack.length ? techStack : ["React", "Node.js", "Figma", "Tailwind CSS", "OpenAI API"]).map((tech, i) => (
                      <span
                        key={tech}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                          i < 3 ? "bg-[#2563EB] text-white" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="mt-8">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {PROJECT.projectMilestones}
                  </h3>
                  <div className="mt-4 space-y-4">
                    {milestones.map((m, i) => (
                      <div key={m.label} className="flex items-center gap-4">
                        {m.icon === "check" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </div>
                        )}
                        {m.icon === "sync" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#2563EB] bg-blue-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                              <path d="M21 12a9 9 0 1 1-2-2.69" />
                              <path d="M21 3v6h-6" />
                            </svg>
                          </div>
                        )}
                        {m.icon === "lock" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {PROJECT.milestonePhasePrefix} {i + 1}: {m.label}
                          </p>
                          {m.percent < 100 && m.percent > 0 && (
                            <p className="text-xs text-gray-500">
                              {PROJECT.milestoneProgressLabel} ({m.percent}%)
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Team members & Manner temp */}
              {teamMembers.length > 0 && (
                <div className="rounded-xl bg-white p-6 shadow-md md:p-8">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {PROJECT.teamMembersHeading}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {teamMembers.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center gap-3">
                          {m.avatarUrl ? (
                            <img src={m.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                              {m.name[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-500">{m.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{PROJECT.mannerShort}</p>
                          <p className="font-semibold text-[#2563EB]">{m.mannerTemp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: fixed sidebar */}
            <aside className="w-full shrink-0 lg:w-80">
              <div className="sticky top-24 space-y-4">
                {/* Recruitment Status Card */}
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {PROJECT.recruitmentStatusCard}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {rolesWithFilled.map((r) => {
                      const status =
                        r.filled >= r.total
                          ? PROJECT.roleJoined
                          : r.filled > 0
                            ? `${r.filled}/${r.total}`
                            : PROJECT.roleOpen;
                      const isJoined = r.filled >= r.total;
                      return (
                        <li key={r.role} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{r.role}</span>
                          <span
                            className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isJoined
                                ? "bg-[#2563EB] text-white"
                                : "border border-gray-300 bg-white text-gray-700"
                            }`}
                          >
                            {status}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {showApplyButton && anyOpen ? (
                    <button
                      type="button"
                      onClick={() => setShowApplyModal(true)}
                      className="mt-5 w-full whitespace-nowrap rounded-xl bg-[#2563EB] px-3 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                    >
                      {PROJECT.apply}
                    </button>
                  ) : hasApplied ? (
                    <div className="mt-5 w-full rounded-xl border border-gray-200 py-3.5 text-center text-sm font-medium text-gray-600">
                      {PROJECT.applyComplete}
                    </div>
                  ) : null}
                  <p className="mt-3 text-xs text-gray-500">{PROJECT.avgResponseTime}</p>
                </div>

                {/* Project Info Card */}
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {PROJECT.projectInfoCard}
                  </h3>
                  <dl className="mt-4 space-y-3">
                    <div className="flex justify-between gap-3">
                      <dt className="shrink-0 text-sm text-gray-500">
                        {PROJECT.visibilityLabel}
                      </dt>
                      <dd className="min-w-0 text-right font-semibold text-gray-900">
                        {visibility === "Public"
                          ? PROJECT.visibilityPublic
                          : visibility === "Private"
                            ? PROJECT.visibilityPrivate
                            : visibility}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="shrink-0 text-sm text-gray-500">
                        {PROJECT.durationLabel}
                      </dt>
                      <dd className="font-semibold text-gray-900">
                        {durationMonths} {PROJECT.monthsUnit}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="shrink-0 text-sm text-gray-500">
                        {PROJECT.estLaunchLabel}
                      </dt>
                      <dd className="min-w-0 break-words text-right font-semibold text-gray-900">
                        {estLaunch}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        projectId={projectId}
        projectTitle={projectTitle}
        roles={rolesWithFilled}
        onSubmitSuccess={() => setShowApplyModal(false)}
      />
    </>
  );
}
