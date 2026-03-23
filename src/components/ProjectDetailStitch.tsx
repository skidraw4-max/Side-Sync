"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ApplyModal from "./ApplyModal";
import type { RecruitmentStatusRow } from "@/types/database";
import { PROJECT } from "@/lib/constants/contents";
import { getEffectiveRecruitmentSlots } from "@/lib/project-application-positions";

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
  /** 포지션명 → 승인 대기(pending) 인원 수 */
  pendingCountsByPosition: Record<string, number>;
  profilesMap: Record<string, { full_name: string | null; avatar_url: string | null; manner_temp_target: string | null }>;
  isLeader: boolean;
  /** 비로그인 guest — 참여 신청은 로그인 후 가능 */
  viewerApplicationStatus: "guest" | "none" | "pending" | "accepted" | "rejected";
  /** Realtime·router.refresh용 (로그인 시 본인 id) */
  viewerId: string | null;
  visibility?: string;
  durationMonths?: number;
  estLaunch?: string;
  milestones?: { label: string; percent: number; icon: "check" | "sync" | "lock" }[];
  /** 알림 링크 `?apply=1` 로 진입 시 지원 모달 자동 오픈 */
  autoOpenApplyModal?: boolean;
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
  pendingCountsByPosition,
  profilesMap,
  isLeader,
  viewerApplicationStatus,
  viewerId,
  visibility = "Public",
  durationMonths = 6,
  estLaunch = "Dec 2024",
  milestones = [
    { label: "Architecture", percent: 100, icon: "check" as const },
    { label: "Sync Engine (Current)", percent: 65, icon: "sync" as const },
    { label: "Public Beta", percent: 0, icon: "lock" as const },
  ],
  autoOpenApplyModal = false,
}: ProjectDetailStitchProps) {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const applyIntentHandled = useRef(false);
  /** 매 렌더마다 새 인스턴스면 realtime useEffect가 무한에 가깝게 재실행됨 */
  const supabase = useMemo(() => createClient(), []);

  /**
   * 직군별 모집 설정(recruitment_status)만 사용 — 상세 모집인원·참여신청 모달·정원이 동일합니다.
   */
  const roleEntries = useMemo(() => {
    return getEffectiveRecruitmentSlots(recruitmentStatus);
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

  /** 합류+지원 중이 정원 미만인 직군만 신청 가능 */
  const openRoles = useMemo(() => {
    return rolesWithFilled.filter((r) => {
      const pending = pendingCountsByPosition[r.role] ?? 0;
      return r.filled + pending < r.total;
    });
  }, [rolesWithFilled, pendingCountsByPosition]);

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

  /** 프로젝트 메타 변경 시 전체 새로고침 */
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

  /** 본인 지원서 상태(수락/거절 등) 변경 시 서버 컴포넌트 데이터 갱신 */
  useEffect(() => {
    if (!viewerId || isLeader) return;
    const sub = supabase
      .channel(`project-detail-apps-${projectId}-${viewerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { applicant_id?: string } | undefined;
          if (row?.applicant_id === viewerId) {
            router.refresh();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, [projectId, viewerId, isLeader, supabase, router]);

  const totalSlots = rolesWithFilled.reduce((s, r) => s + r.total, 0);

  /** 합류+지원 중 기준으로 아직 자리가 있는지 (참여하기 노출 조건) */
  const recruitmentHasVacancy = openRoles.length > 0;

  /** AI 알림 등에서 ?apply=1 진입 시 모달 오픈 (1회) */
  useEffect(() => {
    if (!autoOpenApplyModal || applyIntentHandled.current) return;
    if (isLeader || !recruitmentHasVacancy) return;
    if (viewerApplicationStatus === "pending" || viewerApplicationStatus === "accepted") return;

    applyIntentHandled.current = true;

    if (viewerApplicationStatus === "guest") {
      const next = encodeURIComponent(`/projects/${projectId}?apply=1`);
      router.replace(`/login?next=${next}`);
      return;
    }

    if (viewerApplicationStatus === "none" || viewerApplicationStatus === "rejected") {
      setShowApplyModal(true);
      router.replace(`/projects/${projectId}`, { scroll: false });
    }
  }, [
    autoOpenApplyModal,
    recruitmentHasVacancy,
    isLeader,
    projectId,
    router,
    viewerApplicationStatus,
  ]);

  const showLoginToApply =
    !isLeader && recruitmentHasVacancy && viewerApplicationStatus === "guest";

  const showApplyButtonLoggedIn =
    !isLeader &&
    recruitmentHasVacancy &&
    (viewerApplicationStatus === "none" || viewerApplicationStatus === "rejected");

  const showPendingState = !isLeader && viewerApplicationStatus === "pending";
  const showMemberWorkspace = !isLeader && viewerApplicationStatus === "accepted";
  const showRejectedHint =
    !isLeader && viewerApplicationStatus === "rejected" && recruitmentHasVacancy;

  const loginNextWithApply = encodeURIComponent(`/projects/${projectId}?apply=1`);

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
                  {techStack.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {techStack.map((tech, i) => (
                        <span
                          key={`${tech}-${i}`}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                            i < 3 ? "bg-[#2563EB] text-white" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">{PROJECT.techStackEmptyHint}</p>
                  )}
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
                      const pendingN = pendingCountsByPosition[r.role] ?? 0;
                      const activeN = r.filled + pendingN;
                      const status =
                        activeN >= r.total
                          ? PROJECT.roleJoined
                          : activeN > 0
                            ? `${activeN}/${r.total}`
                            : PROJECT.roleOpen;
                      const isJoined = activeN >= r.total;
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
                  <p className="mt-4 text-xs text-gray-500">{PROJECT.avgResponseTime}</p>
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

                {/* 참여 CTA: 모집 현황·프로젝트 정보 카드 아래 (비리더) */}
                {!isLeader && (
                  <div className="rounded-xl border border-[#2563EB]/15 bg-gradient-to-b from-white to-blue-50/40 p-6 shadow-md">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      참여
                    </h3>
                    <div className="mt-4 space-y-3">
                      {showMemberWorkspace ? (
                        <Link
                          href={`/projects/${projectId}/workspace`}
                          className="flex w-full items-center justify-center whitespace-nowrap rounded-xl bg-[#2563EB] px-3 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                        >
                          {PROJECT.goToWorkspaceBoard}
                        </Link>
                      ) : showPendingState ? (
                        <div className="w-full rounded-xl border border-amber-200 bg-amber-50 py-3.5 text-center text-sm font-semibold text-amber-900">
                          {PROJECT.approvalPending}
                        </div>
                      ) : showLoginToApply ? (
                        <Link
                          href={`/login?next=${loginNextWithApply}`}
                          className="flex w-full items-center justify-center whitespace-nowrap rounded-xl bg-[#2563EB] px-3 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                        >
                          로그인 후 참여 신청
                        </Link>
                      ) : showApplyButtonLoggedIn ? (
                        <button
                          type="button"
                          onClick={() => setShowApplyModal(true)}
                          className="w-full whitespace-nowrap rounded-xl bg-[#2563EB] px-3 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
                        >
                          {PROJECT.applyParticipate}
                        </button>
                      ) : !recruitmentHasVacancy &&
                        (viewerApplicationStatus === "guest" ||
                          viewerApplicationStatus === "none" ||
                          viewerApplicationStatus === "rejected") ? (
                        <div className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 text-center text-sm font-medium text-gray-600">
                          {PROJECT.applyClosed}
                        </div>
                      ) : null}
                      {showRejectedHint && (
                        <p className="text-xs text-gray-500">{PROJECT.rejectedApplyHint}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>

          {/* 포지션별 현황: 합류 + 지원 중 / 정원 */}
          {rolesWithFilled.length > 0 && (
            <section
              className="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-md md:mt-12 md:p-8"
              aria-labelledby="position-status-heading"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h2
                  id="position-status-heading"
                  className="text-lg font-bold text-gray-900 md:text-xl"
                >
                  {PROJECT.positionStatusSection}
                </h2>
                <p className="text-xs text-gray-500">{PROJECT.positionStatusRatioHint}</p>
              </div>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rolesWithFilled.map((slot) => {
                  const pending = pendingCountsByPosition[slot.role] ?? 0;
                  const joined = slot.filled;
                  const total = slot.total;
                  const active = joined + pending;
                  const isFull = active >= total;
                  return (
                    <li
                      key={slot.role}
                      className={`rounded-xl border px-4 py-4 ${
                        isFull ? "border-emerald-200 bg-emerald-50/60" : "border-gray-100 bg-gray-50/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900">{slot.role}</p>
                        {isFull && (
                          <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs">
                            {PROJECT.positionStatusFullBadge}
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-2xl font-bold tabular-nums text-[#2563EB]">
                        {active}
                        <span className="text-lg font-semibold text-gray-400">/{total}</span>
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                        <span>
                          {PROJECT.positionStatusJoined}{" "}
                          <strong className="text-gray-900">{joined}</strong>
                        </span>
                        <span>
                          {PROJECT.positionStatusPendingApply}{" "}
                          <strong className="text-amber-800">{pending}</strong>
                        </span>
                        <span>
                          {PROJECT.positionStatusCapacity}{" "}
                          <strong className="text-gray-900">{total}</strong>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </main>
      </div>

      {/* 비리더 하단 고정 CTA */}
      {!isLeader && (
        <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-white/95 px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-sm md:px-12 lg:px-24">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              {showMemberWorkspace
                ? "팀 워크스페이스에서 태스크와 채팅을 이용할 수 있습니다."
                : showPendingState
                  ? "리더가 검토 중입니다. 알림으로 결과를 안내해 드립니다."
                  : showApplyButtonLoggedIn
                    ? "프로젝트에 참여하려면 신청서를 제출해 주세요."
                    : showLoginToApply
                      ? "로그인 후 참여 신청이 가능합니다."
                      : !recruitmentHasVacancy
                        ? "현재 모집 정원이 모두 찼습니다."
                        : null}
            </p>
            <div className="flex shrink-0 gap-2">
              {showMemberWorkspace && (
                <Link
                  href={`/projects/${projectId}/workspace`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] sm:w-auto"
                >
                  {PROJECT.goToWorkspaceBoard}
                </Link>
              )}
              {showPendingState && (
                <span className="inline-flex w-full items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-900 sm:w-auto">
                  {PROJECT.approvalPending}
                </span>
              )}
              {showApplyButtonLoggedIn && (
                <button
                  type="button"
                  onClick={() => setShowApplyModal(true)}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] sm:w-auto"
                >
                  {PROJECT.applyParticipate}
                </button>
              )}
              {showLoginToApply && (
                <Link
                  href={`/login?next=${loginNextWithApply}`}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] sm:w-auto"
                >
                  로그인 후 참여 신청
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <ApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        projectId={projectId}
        projectTitle={projectTitle}
        roles={openRoles}
        onSubmitSuccess={() => {
          setShowApplyModal(false);
          router.refresh();
        }}
      />
    </>
  );
}
