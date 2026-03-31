"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import ProfileHeader from "@/components/ProfileHeader";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import MannerTemperatureGauge from "@/components/MannerTemperatureGauge";
import { getMannerHonorFromTemp, getMannerPercentileHint } from "@/lib/manner-temp-display";
import { ProfilePageSkeleton } from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { getMergedAvatarUrl, getMergedDisplayName } from "@/lib/auth-user-display";
import { fetchLedProjectsForUser, fetchProjectsByIds } from "@/lib/supabase-project-queries";
import { normalizeRawProjectStatus } from "@/lib/project-recruitment-state";
import { resolveMannerTempForProfile } from "@/lib/manner-temp-coerce";
import {
  MY_PROFILE_ROW_QUERY_KEY,
  useMyProfileRow,
  type MyProfileBundle,
} from "@/hooks/useMyProfileRow";

interface ProfileData {
  /** DB + OAuth 메타데이터 병합 결과 (표시용) */
  fullName: string;
  avatarUrl: string | null;
  role: string | null;
  occupation: string | null;
  mannerTemp: string;
  /** 칭호·퍼센트 게이지용 숫자 온도 */
  mannerTempValue: number;
  successRate: string | null;
  badges: string[];
}

interface ProjectItem {
  id: string;
  title: string;
  description: string | null;
  gradient: string | null;
  category: string | null;
  iconKind: "globe" | "brain" | "palette";
  role: "LEAD" | "PROJECT MGR" | "CONTRIBUTOR";
  contributorCount: number;
  contributorAvatars: string[];
}

function parseMannerTemp(value: string | null): { display: string; percent: number } {
  if (!value) return { display: "36.5", percent: 36.5 };
  const num = parseFloat(value.replace(/[°C\s]/g, ""));
  const display = Number.isFinite(num) ? num.toFixed(1) : "36.5";
  const percent = Number.isFinite(num) ? Math.min(100, Math.max(0, num)) : 36.5;
  return { display, percent };
}

const ROLE_STYLES: Record<string, string> = {
  LEAD: "bg-sky-100 text-sky-700",
  "PROJECT MGR": "bg-violet-100 text-violet-700",
  CONTRIBUTOR: "bg-gray-100 text-gray-700",
};

const ROLE_LABEL_KO: Record<ProjectItem["role"], string> = {
  LEAD: "리더",
  "PROJECT MGR": "팀장",
  CONTRIBUTOR: "팀원",
};

function buildProfileDataFromBundle(authUser: User, bundle: MyProfileBundle): ProfileData {
  const row = bundle.row;
  const { mannerTempValue, mannerTempString } = resolveMannerTempForProfile(
    row?.manner_temp,
    row?.manner_temp_target
  );
  return {
    fullName: getMergedDisplayName(authUser, row?.full_name),
    avatarUrl: getMergedAvatarUrl(authUser, row?.avatar_url),
    role: row?.role ?? null,
    occupation: row?.occupation?.trim() ? row.occupation.trim() : null,
    mannerTemp: mannerTempString,
    mannerTempValue,
    successRate: row?.success_rate ?? "98%",
    badges: Array.isArray(row?.badges) ? row.badges : [],
  };
}

function projectIconKind(title: string, category: string | null): ProjectItem["iconKind"] {
  const t = `${category ?? ""} ${title}`.toLowerCase();
  if (/design|ui|ux|figma|palette|디자인|브랜딩|그래픽/.test(t)) return "palette";
  if (/ai|ml|llm|gpt|brain|인공지능|머신러닝|데이터\s*과학|딥러닝/.test(t)) return "brain";
  return "globe";
}

function ProjectHeroIcon({ kind }: { kind: ProjectItem["iconKind"] }) {
  const cls = "text-slate-500/90";
  if (kind === "brain") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
      </svg>
    );
  }
  if (kind === "palette") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.648 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={cls}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activityStats, setActivityStats] = useState({ active: 0, completed: 0, leading: 0 });
  const [projectsLoading, setProjectsLoading] = useState(false);
  /** 탭 복귀·다른 페이지에서 평가 후 돌아올 때 프로젝트·프로필 재조회 */
  const [visibilityTick, setVisibilityTick] = useState(0);
  /** 프로필 쿼리가 끝나지 않을 때 스켈레톤에서 벗어나기 */
  const [profileLoadDeadlineExceeded, setProfileLoadDeadlineExceeded] = useState(false);

  const authUserId = authUser?.id;
  const profileQuery = useMyProfileRow(authUserId);

  /** 리마운트 직후에도 React Query 캐시가 있으면 첫 페인트부터 표시 (useEffect 대기 제거) */
  const profileFromQuery = useMemo((): ProfileData | null => {
    if (!authUser || !profileQuery.isSuccess || !profileQuery.data) return null;
    return buildProfileDataFromBundle(authUser, profileQuery.data);
  }, [authUser, profileQuery.isSuccess, profileQuery.data, profileQuery.dataUpdatedAt]);

  const profileFromError = useMemo((): ProfileData | null => {
    if (!authUser || !profileQuery.isError) return null;
    const resolved = resolveMannerTempForProfile(null, null);
    return {
      fullName: getMergedDisplayName(authUser, null),
      avatarUrl: getMergedAvatarUrl(authUser, null),
      role: null,
      occupation: null,
      mannerTemp: resolved.mannerTempString,
      mannerTempValue: resolved.mannerTempValue,
      successRate: "98%",
      badges: [],
    };
  }, [authUser, profileQuery.isError]);

  const profileDeadlineFallback = useMemo((): ProfileData | null => {
    if (!authUser || !profileLoadDeadlineExceeded) return null;
    if (profileQuery.isSuccess || profileQuery.isError) return null;
    const resolved = resolveMannerTempForProfile(null, null);
    return {
      fullName: getMergedDisplayName(authUser, null),
      avatarUrl: getMergedAvatarUrl(authUser, null),
      role: null,
      occupation: null,
      mannerTemp: resolved.mannerTempString,
      mannerTempValue: resolved.mannerTempValue,
      successRate: "98%",
      badges: [],
    };
  }, [authUser, profileLoadDeadlineExceeded, profileQuery.isSuccess, profileQuery.isError]);

  const profile = profileFromQuery ?? profileFromError ?? profileDeadlineFallback ?? null;

  const totalMilestones = useMemo(() => {
    if (profileQuery.isSuccess && profileQuery.data) return profileQuery.data.milestoneCount;
    return 0;
  }, [profileQuery.isSuccess, profileQuery.data, profileQuery.dataUpdatedAt]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void queryClient.invalidateQueries({ queryKey: [MY_PROFILE_ROW_QUERY_KEY] });
        setVisibilityTick((t) => t + 1);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [queryClient]);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    void supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (cancelled) return;
      console.log("[DEBUG] Fetching Profile Start — auth getSession resolved");
      if (sessionError) {
        console.error("[ProfilePage] session error:", sessionError);
        router.push("/login");
        setAuthReady(true);
        return;
      }
      const sessionUser = session?.user;
      if (!sessionUser) {
        router.push("/login");
        setAuthReady(true);
        return;
      }
      const {
        data: { user: jwtUser },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setAuthUser(jwtUser ?? sessionUser);
      setAuthReady(true);
      console.log("[DEBUG] Auth user ready", { userId: (jwtUser ?? sessionUser).id });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
      } else {
        setAuthUser(null);
        router.push("/login");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    if (profileQuery.isSuccess || profileQuery.isError) {
      setProfileLoadDeadlineExceeded(false);
    }
  }, [profileQuery.isSuccess, profileQuery.isError]);

  useEffect(() => {
    if (profileQuery.isError && profileQuery.error) {
      console.error("[ProfilePage] 프로필 조회 실패:", profileQuery.error);
    }
  }, [profileQuery.isError, profileQuery.error]);

  useEffect(() => {
    if (profileQuery.isSuccess && profileQuery.data && authUser) {
      const { mannerTempValue } = resolveMannerTempForProfile(
        profileQuery.data.row?.manner_temp,
        profileQuery.data.row?.manner_temp_target
      );
      console.log("[DEBUG] Profile Data Received — merged into UI state", { mannerTempValue });
    }
  }, [authUser, profileQuery.isSuccess, profileQuery.data, profileQuery.dataUpdatedAt]);

  /** 프로필 쿼리가 성공/실패 없이 멈출 때(네트워크 등) 스켈레톤 탈출 */
  useEffect(() => {
    if (!authUserId) return;
    if (profileQuery.isSuccess || profileQuery.isError) return;

    const t = window.setTimeout(() => {
      console.warn("[DEBUG] Profile load deadline exceeded — rendering defaults");
      setProfileLoadDeadlineExceeded(true);
      setProjectsLoading(false);
    }, 22_000);

    return () => window.clearTimeout(t);
  }, [authUserId, profileQuery.isSuccess, profileQuery.isError]);

  useEffect(() => {
    if (!authUserId) {
      setProjectsLoading(false);
      return;
    }

    let cancelled = false;
    setProjectsLoading(true);
    const uid = authUserId;
    console.log("[DEBUG] Fetching projects list start", { uid });

    async function fetchProjects() {
      try {
        const supabase = createClient();

        const led = await fetchLedProjectsForUser(supabase as any, uid);

        const { data: acceptedApps } = await (supabase as any)
          .from("applications")
          .select("project_id")
          .eq("applicant_id", uid)
          .eq("status", "accepted");

        const memberProjectIds = new Set(((acceptedApps ?? []) as Array<{ project_id: string }>).map((a) => a.project_id));

        const ledIds = new Set(led.map((p) => p.id));
        const memberIdsOnly = Array.from(memberProjectIds).filter((id) => !ledIds.has(id));
        const member = await fetchProjectsByIds(supabase as any, memberIdsOnly);

        type ProjectRow = {
          id: string;
          title: string;
          description: string | null;
          gradient: string | null;
          category: string | null;
          team_leader_id: string | null;
          status: string | null;
        };
        const allProjects: ProjectRow[] = [
          ...led.map((p) => p as ProjectRow),
          ...member.filter((p) => !led.some((l) => l.id === p.id)).map((p) => p as ProjectRow),
        ];

        let activeCount = 0;
        let completedCount = 0;
        for (const p of allProjects) {
          const st = normalizeRawProjectStatus(p.status);
          if (st === "completed") completedCount += 1;
          else if (st === "hiring" || st === "ongoing") activeCount += 1;
        }
        if (!cancelled) {
          setActivityStats({
            active: activeCount,
            completed: completedCount,
            leading: led.length,
          });
        }

        const projectIds = allProjects.map((p) => p.id);
        const allMemberIds = new Set<string>();

        const { data: allApps } =
          projectIds.length > 0
            ? await (supabase as any)
                .from("applications")
                .select("project_id, applicant_id")
                .in("project_id", projectIds)
                .eq("status", "accepted")
            : { data: [] };

        projectIds.forEach((pid) => {
          const proj = allProjects.find((p) => p.id === pid);
          if (proj?.team_leader_id) allMemberIds.add(proj.team_leader_id);
          (allApps ?? [])
            .filter((a: { project_id: string }) => a.project_id === pid)
            .forEach((a: { applicant_id: string }) => allMemberIds.add(a.applicant_id));
        });

        const { data: avatars } =
          allMemberIds.size > 0
            ? await (supabase as any)
                .from("profiles")
                .select("id, avatar_url")
                .in("id", Array.from(allMemberIds))
            : { data: [] };

        const avatarMap = new Map(
          ((avatars ?? []) as Array<{ id: string; avatar_url: string | null }>).map((a) => [a.id, a.avatar_url])
        );

        const projectsList: ProjectItem[] = allProjects.map((p) => {
          const memberIds: string[] = [];
          if (p.team_leader_id) memberIds.push(p.team_leader_id);
          (allApps ?? [])
            .filter((a: { project_id: string }) => a.project_id === p.id)
            .forEach((a: { applicant_id: string }) => memberIds.push(a.applicant_id));

          const contributorAvatars = memberIds
            .slice(0, 4)
            .map((id) => avatarMap.get(id))
            .filter(Boolean) as string[];

          const role =
            p.team_leader_id === uid
              ? ("LEAD" as const)
              : ("CONTRIBUTOR" as const);

          const category = p.category ?? null;
          return {
            id: p.id,
            title: p.title,
            description: p.description,
            gradient: p.gradient,
            category,
            iconKind: projectIconKind(p.title, category),
            role,
            contributorCount: memberIds.length,
            contributorAvatars,
          };
        });

        if (cancelled) return;
        setProjects(projectsList);
        console.log("[DEBUG] Projects list received", { count: projectsList.length });
      } catch (err) {
        console.error("[ProfilePage] fetchProjects error:", err);
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setProjectsLoading(false);
      }
    }

    void fetchProjects();

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        setProjectsLoading(false);
        console.warn("[DEBUG] Projects fetch safety timeout — stopping loading flag");
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      setProjectsLoading(false);
    };
  }, [authUserId, visibilityTick]);

  const hasRenderableProfile = profile != null;
  /** 캐시 히트 시 isSuccess로 유지되는 동안 대기로 보지 않음(리페치 중에도 스켈레톤 방지) */
  const waitingProfileRow =
    !!authUser &&
    !profileQuery.isSuccess &&
    !profileQuery.isError &&
    !profileLoadDeadlineExceeded;

  const isLoading =
    !authReady ||
    waitingProfileRow ||
    (!!authUserId && projectsLoading && !hasRenderableProfile);

  const showSkeleton = (isLoading || !hasRenderableProfile) && !profileLoadDeadlineExceeded;

  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <ProfileHeader />
        <ProfilePageSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <ProfileHeader />
        <main className="mx-auto max-w-lg px-6 py-16 text-center">
          <p className="text-lg font-semibold text-gray-900">데이터를 불러올 수 없습니다</p>
          <p className="mt-2 text-sm text-gray-600">잠시 후 다시 시도하거나 로그인 상태를 확인해 주세요.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
            홈으로
          </Link>
        </main>
        <Footer variant="stitch" />
      </div>
    );
  }

  const { display: mannerDisplay, percent: mannerPercent } = parseMannerTemp(
    profile?.mannerTemp ?? null
  );
  const positiveRate = profile?.successRate ?? "98%";
  const mannerHonor = profile
    ? getMannerHonorFromTemp(profile.mannerTempValue)
    : getMannerHonorFromTemp(36.5);
  const mannerPercentileHint = profile
    ? getMannerPercentileHint(profile.mannerTempValue)
    : null;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <ProfileHeader />

      <main className="px-6 pb-16 pt-8 md:px-12 lg:px-24">
        <div className="mx-auto max-w-5xl">
          {(profileQuery.isError || profileLoadDeadlineExceeded) && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              {profileQuery.isError
                ? "프로필 데이터를 불러오지 못했습니다. 아래는 계정 기본값으로 표시됩니다."
                : "프로필 조회가 지연되어 기본값으로 표시 중입니다. 네트워크를 확인한 뒤 새로고침해 보세요."}
            </div>
          )}
          {/* 상단 2열: 프로필 카드 + 매너 온도 */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
                <div className="relative shrink-0">
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt="Profile"
                      width={120}
                      height={120}
                      className="h-[120px] w-[120px] rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-gray-200 text-4xl font-bold text-gray-500">
                      {(profile?.fullName?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                  <span
                    className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-green-500"
                    aria-hidden
                  />
                </div>
                <div className="mt-6 md:ml-8 md:mt-0 md:flex-1">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center md:justify-start">
                    <h1 className="text-2xl font-bold text-gray-900">{profile?.fullName ?? "이름 없음"}</h1>
                    {profile?.occupation ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                        🚀 {profile.occupation}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-600 md:justify-start">
                    <span>
                      진행 중 <span className="font-semibold text-gray-900">{activityStats.active}</span>
                    </span>
                    <span className="text-gray-300" aria-hidden>
                      |
                    </span>
                    <span>
                      완료 <span className="font-semibold text-gray-900">{activityStats.completed}</span>
                    </span>
                    <span className="text-gray-300" aria-hidden>
                      |
                    </span>
                    <span>
                      리딩 <span className="font-semibold text-gray-900">{activityStats.leading}</span>
                    </span>
                  </div>
                  {profile?.badges && profile.badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
                      {profile.badges.map((badge) => (
                        <span
                          key={badge}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/profile/edit"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                    프로필 수정
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-6 border-b border-slate-100 pb-6 text-center">
                <p className="text-lg font-bold text-[#2563EB]">{mannerHonor.name}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{mannerHonor.tagline}</p>
                {mannerPercentileHint ? (
                  <p className="mt-2 text-xs font-semibold text-blue-700/90">{mannerPercentileHint}</p>
                ) : null}
                <p className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold tabular-nums text-[#2563EB]">{mannerDisplay}</span>
                  <span className="text-2xl font-semibold text-blue-600">°C</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{mannerHonor.encouragement}</p>
              </div>
              <MannerTemperatureGauge
                value={mannerDisplay}
                percent={mannerPercent}
                positiveRate={positiveRate}
                showArcOnly
              />
              <p className="mt-4 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  ✅ 총 {totalMilestones}회 마일스톤 완수
                </span>
              </p>
            </div>
          </div>

          {/* 내 참여 프로젝트 */}
          <div className="mt-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-600"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
                내 참여 프로젝트
              </h2>
              <Link
                href="/projects"
                className="text-sm font-medium text-[#2563EB] hover:underline"
              >
                전체 보기
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projects.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                        <line x1="12" y1="11" x2="12" y2="17" />
                        <line x1="9" y1="14" x2="15" y2="14" />
                      </svg>
                    }
                    title="나만의 멋진 아이디어를 프로젝트로 만들어보세요!"
                    description="첫 프로젝트를 만들고 팀원을 모집해보세요."
                    actions={[
                      { label: "첫 프로젝트 만들기", href: "/projects/create", primary: true },
                    ]}
                  />
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm"
                  >
                    <div className="relative h-24 bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200">
                      <div className="absolute inset-0 flex items-center justify-center opacity-40">
                        <ProjectHeroIcon kind={project.iconKind} />
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900">{project.title}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            ROLE_STYLES[project.role] ?? ROLE_STYLES.CONTRIBUTOR
                          }`}
                        >
                          {ROLE_LABEL_KO[project.role] ?? ROLE_LABEL_KO.CONTRIBUTOR}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                        {project.description ?? "설명 없음"}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {project.contributorAvatars.slice(0, 4).map((url, j) =>
                            url ? (
                              <img
                                key={j}
                                src={url}
                                alt=""
                                className="h-6 w-6 rounded-full border-2 border-white object-cover"
                              />
                            ) : (
                              <div
                                key={j}
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-gray-300 text-[10px] font-medium text-gray-600"
                              >
                                ?
                              </div>
                            )
                          )}
                        </div>
                        <span className="text-sm text-gray-500">참여 {project.contributorCount}명</span>
                      </div>
                      <Link
                        href={`/projects/${project.id}/workspace`}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-slate-200"
                      >
                        워크스페이스로 이동
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer variant="stitch" />
    </div>
  );
}
