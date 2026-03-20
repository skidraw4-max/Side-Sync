"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProfileHeader from "@/components/ProfileHeader";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import MannerTemperatureGauge from "@/components/MannerTemperatureGauge";
import { ProfilePageSkeleton } from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { getMergedAvatarUrl, getMergedDisplayName } from "@/lib/auth-user-display";
import { fetchLedProjectsForUser, fetchProjectsByIds } from "@/lib/supabase-project-queries";

interface ProfileData {
  /** DB + OAuth 메타데이터 병합 결과 (표시용) */
  fullName: string;
  avatarUrl: string | null;
  role: string | null;
  mannerTemp: string;
  successRate: string | null;
  badges: string[];
  location?: string | null;
}

interface ProjectItem {
  id: string;
  title: string;
  description: string | null;
  gradient: string | null;
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

const PROJECT_ICONS = [
  { slug: "global", icon: "globe" },
  { slug: "ai", icon: "brain" },
  { slug: "design", icon: "palette" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const supabase = createClient();
        // getSession: 캐시에서 먼저 확인 (getUser는 서버 검증으로 느릴 수 있음)
        const {
          data: { session },
          error: sessionError,
        } = await (supabase as any).auth.getSession();

        if (cancelled) return;
        if (sessionError) {
          console.error("[ProfilePage] session error:", sessionError);
          router.push("/login");
          return;
        }
        const sessionUser = session?.user;
        if (!sessionUser) {
          router.push("/login");
          return;
        }

        const {
          data: { user: jwtUser },
        } = await supabase.auth.getUser();
        const user = jwtUser ?? sessionUser;

        // maybeSingle: 프로필 row 없을 때도 에러 없이 null 반환
        const { data: profileRow, error: profileFetchError } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, role, manner_temp, manner_temp_target, success_rate, badges")
          .eq("id", user.id)
          .maybeSingle();

        if (profileFetchError) {
          console.warn("[ProfilePage] profiles 조회:", profileFetchError.message);
        }

        if (cancelled) return;
        const profile = profileRow as {
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          manner_temp: number | null;
          manner_temp_target: string | null;
          success_rate: string | null;
          badges: string[];
        } | null;

        setProfile({
          fullName: getMergedDisplayName(user, profile?.full_name),
          avatarUrl: getMergedAvatarUrl(user, profile?.avatar_url),
          role: profile?.role ?? null,
          mannerTemp: profile?.manner_temp != null ? `${profile.manner_temp}` : (profile?.manner_temp_target ?? "36.5"),
          successRate: profile?.success_rate ?? "98%",
          badges: Array.isArray(profile?.badges) ? profile.badges : [],
          location: "San Francisco, CA",
        });

        const led = await fetchLedProjectsForUser(supabase as any, user.id);

        const { data: acceptedApps } = await (supabase as any)
          .from("applications")
          .select("project_id")
          .eq("applicant_id", user.id)
          .eq("status", "accepted");

        const memberProjectIds = new Set(((acceptedApps ?? []) as Array<{ project_id: string }>).map((a) => a.project_id));

        const ledIds = new Set(led.map((p) => p.id));
        const memberIdsOnly = Array.from(memberProjectIds).filter((id) => !ledIds.has(id));
        const member = await fetchProjectsByIds(supabase as any, memberIdsOnly);

        type ProjectRow = { id: string; title: string; description: string | null; gradient: string | null; team_leader_id: string | null };
        const allProjects = [
          ...led,
          ...member.filter((p) => !led.some((l) => l.id === p.id)),
        ].slice(0, 3);

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
            p.team_leader_id === user.id
              ? ("LEAD" as const)
              : ("CONTRIBUTOR" as const);

          return {
            id: p.id,
            title: p.title,
            description: p.description,
            gradient: p.gradient,
            role,
            contributorCount: memberIds.length,
            contributorAvatars,
          };
        });

        if (cancelled) return;
        setProjects(projectsList);
      } catch (err) {
        console.error("[ProfilePage] fetchData error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchData();

    // 8초 후에도 완료되지 않으면 로딩 해제 (getUser 등 무한 대기 방지)
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProfileHeader />
        <ProfilePageSkeleton />
      </div>
    );
  }

  const { display: mannerDisplay, percent: mannerPercent } = parseMannerTemp(
    profile?.mannerTemp ?? null
  );
  const positiveRate = profile?.successRate ?? "98%";

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileHeader />

      <main className="px-6 pb-16 pt-8 md:px-12 lg:px-24">
        <div className="mx-auto max-w-5xl">
          {/* 상단 2열: 프로필 카드 + 매너 온도 */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 shadow-lg">
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
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile?.fullName ?? "이름 없음"}
                  </h1>
                  {profile?.badges && profile.badges.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
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
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 text-gray-400"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {profile?.location ?? "San Francisco, CA"}
                  </p>
                  <Link
                    href="/profile/edit"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
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
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-lg">
              <MannerTemperatureGauge
                value={mannerDisplay}
                percent={mannerPercent}
                positiveRate={positiveRate}
              />
            </div>
          </div>

          {/* My Active Projects */}
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
                My Active Projects
              </h2>
              <Link
                href="/projects"
                className="text-sm font-medium text-[#2563EB] hover:underline"
              >
                View All Projects
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
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
                projects.map((project, i) => (
                  <div
                    key={project.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-lg"
                  >
                    <div className="relative h-24 bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200">
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        {PROJECT_ICONS[i % 3]?.icon === "globe" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        )}
                        {PROJECT_ICONS[i % 3]?.icon === "brain" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
                          </svg>
                        )}
                        {PROJECT_ICONS[i % 3]?.icon === "palette" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="64"
                            height="64"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <circle cx="13.5" cy="6.5" r=".5" />
                            <circle cx="17.5" cy="10.5" r=".5" />
                            <circle cx="8.5" cy="7.5" r=".5" />
                            <circle cx="6.5" cy="12.5" r=".5" />
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.648 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900">{project.title}</h3>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
                            ROLE_STYLES[project.role] ?? ROLE_STYLES.CONTRIBUTOR
                          }`}
                        >
                          {project.role === "LEAD" ? "LEAD STRATEGIST" : project.role === "PROJECT MGR" ? "PROJECT MGR" : "CONTRIBUTOR"}
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
                        <span className="text-sm text-gray-500">
                          {project.contributorCount} Contributors
                        </span>
                      </div>
                      <Link
                        href={`/projects/${project.id}/workspace/tasks`}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2.5 text-sm font-medium text-gray-700 hover:bg-slate-200 transition-colors"
                      >
                        Go to Workspace
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
