"use client";
// 브라우저(Client)에서만 실행됩니다. F12 → Console 에서 🔍 쿼리 결과 data 로그를 확인하세요.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import ManageApplicantsSidebar from "@/components/ManageApplicantsSidebar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import { ManageApplicantsSkeleton } from "@/components/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { fetchAcceptedApplicationsForProject } from "@/lib/supabase-project-queries";
import { getEffectiveRecruitmentSlots } from "@/lib/project-application-positions";
import { PROJECT } from "@/lib/constants/contents";

interface ApplicantProfile {
  full_name: string | null;
  avatar_url: string | null;
  tech_stack: string[];
  manner_temp_target: string | null;
  /** profiles.role (계정 직무 등, applications.role 과 별개) */
  profile_role?: string | null;
  /** profiles 테이블 email */
  email?: string | null;
}

interface ApplicationWithProfile {
  id: string;
  project_id: string;
  applicant_id: string;
  message: string | null;
  role: string | null;
  /** 지원 시 선택한 모집 포지션(기술 스택 라벨) */
  tech_stack: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  /** 병합된 프로필(UI에서 profiles?.full_name 체이닝용, applicant 와 동일 객체 참조) */
  profiles: ApplicantProfile | null;
  applicant: ApplicantProfile | null;
}

function applicationPosition(a: ApplicationWithProfile): string {
  return a.tech_stack?.trim() || a.role?.trim() || "General";
}

/** Supabase 임베드 `profiles(...)` 결과 (객체 또는 배열 1건) */
function normalizeProfileEmbed(raw: unknown): ApplicantProfile | null {
  if (raw == null) return null;
  const node = Array.isArray(raw) ? raw[0] : raw;
  if (!node || typeof node !== "object") return null;
  const o = node as Record<string, unknown>;
  const ts = o.tech_stack;
  return {
    full_name: typeof o.full_name === "string" ? o.full_name : null,
    avatar_url: typeof o.avatar_url === "string" ? o.avatar_url : null,
    tech_stack: Array.isArray(ts) ? (ts as string[]) : [],
    manner_temp_target: typeof o.manner_temp_target === "string" ? o.manner_temp_target : null,
    email: typeof o.email === "string" ? o.email : null,
    profile_role: typeof o.role === "string" ? o.role : null,
  };
}

/** UI에서 profiles / applicant 둘 다 옵셔널 체이닝 지원 */
function applicantProfile(app: ApplicationWithProfile): ApplicantProfile | null {
  return app.profiles ?? app.applicant ?? null;
}

/** 동일 applicant_id 중복 행이 있으면 최신 지원 1건만 표시 (pending 탭 정리용) */
function dedupeApplicationsByApplicantLatest(
  list: ApplicationWithProfile[]
): ApplicationWithProfile[] {
  const byApplicant = new Map<string, ApplicationWithProfile>();
  for (const a of list) {
    const prev = byApplicant.get(a.applicant_id);
    if (!prev || new Date(a.created_at).getTime() > new Date(prev.created_at).getTime()) {
      byApplicant.set(a.applicant_id, a);
    }
  }
  return [...byApplicant.values()].sort(
    (x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime()
  );
}

function mergeApplicantProfiles(
  batch: ApplicantProfile | null,
  embed: ApplicantProfile | null
): ApplicantProfile | null {
  if (!batch && !embed) return null;
  if (!batch) return embed;
  if (!embed) return batch;
  return {
    full_name: embed.full_name ?? batch.full_name,
    avatar_url: embed.avatar_url ?? batch.avatar_url,
    email: embed.email ?? batch.email,
    profile_role: embed.profile_role ?? batch.profile_role,
    tech_stack: embed.tech_stack.length > 0 ? embed.tech_stack : batch.tech_stack,
    manner_temp_target: embed.manner_temp_target ?? batch.manner_temp_target,
  };
}

export default function ManageApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = String(params?.id ?? "").trim();

  const [projectTitle, setProjectTitle] = useState("");
  const [teamLeaderName, setTeamLeaderName] = useState("");
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [roleFilledMap, setRoleFilledMap] = useState<Record<string, { total: number; filled: number }>>({});
  const [isLeader, setIsLeader] = useState<boolean | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ show: boolean; name: string } | null>(null);
  const [viewArchived, setViewArchived] = useState(false);
  const [rejectModalAppId, setRejectModalAppId] = useState<string | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [manageActionError, setManageActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchApplicantsInEffect() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      if (!projectId) {
        console.warn("[manage] missing project id in route params");
        router.push("/projects");
        return;
      }

      const { data: projectRaw } = await supabase
        .from("projects")
        .select("id, title, team_leader_id, recruitment_status, tech_stack")
        .eq("id", projectId)
        .single();
      const project = projectRaw as {
        id: string;
        title: string;
        team_leader_id: string | null;
        tech_stack?: string[];
        recruitment_status?: Array<{ role: string; count?: number; total?: number }>;
      } | null;

      if (!project) {
        router.push("/projects");
        return;
      }

      if (project.team_leader_id !== user.id) {
        if (!cancelled) setIsLeader(false);
        return;
      }

      if (!cancelled) {
        setIsLeader(true);
        setProjectTitle(project.title);
      }

      if (project.team_leader_id) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", project.team_leader_id)
          .single();
        const leaderProfile = data as { full_name: string | null } | null;
        if (!cancelled) setTeamLeaderName(leaderProfile?.full_name ?? "Unknown");
      }

      // 역할별 모집 현황 (filled/total) 계산 — role 컬럼 없는 DB는 select("*") 기반 헬퍼 사용
      const rawStatus = (project as { recruitment_status?: Array<{ role: string; count?: number; total?: number }> }).recruitment_status;
      const acceptedApps = await fetchAcceptedApplicationsForProject(supabase, projectId);

      const filledByRole: Record<string, number> = {};
      acceptedApps.forEach((a) => {
        const r = a.role?.trim() || PROJECT.roleGeneral;
        filledByRole[r] = (filledByRole[r] ?? 0) + 1;
      });

      const map: Record<string, { total: number; filled: number }> = {};
      const effectiveSlots = getEffectiveRecruitmentSlots(rawStatus);
      effectiveSlots.forEach((s) => {
        map[s.role] = { total: s.total, filled: filledByRole[s.role] ?? 0 };
      });
      if (!cancelled) setRoleFilledMap(map);

      const statusFilter = viewArchived
        ? ["accepted", "rejected"]
        : ["pending"];

      // 진단: 클라이언트 세션으로 전체 지원 건수(탭과 무관)
      const { count: totalCount, error: countErr } = await supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId);
      if (!countErr && typeof totalCount === "number") {
        console.log("[manage] applications total count (all statuses):", totalCount, "| current tab filter:", statusFilter);
      }

      console.log("🔍 현재 프로젝트 ID:", projectId);

      /** 서버 API(팀장 검증 + 선택적 service role) 우선 — 브라우저 RLS로 목록만 비는 문제 완화 */
      const tabParam = viewArchived ? "archived" : "pending";
      let merged: ApplicationWithProfile[] | null = null;
      try {
        const apiRes = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/applications?tab=${tabParam}`,
          { credentials: "include", cache: "no-store" }
        );
        if (apiRes.ok) {
          const body = (await apiRes.json()) as {
            items?: Array<{
              id: string;
              project_id: string;
              applicant_id: string;
              message: string | null;
              role: string | null;
              tech_stack: string | null;
              status: "pending" | "accepted" | "rejected";
              created_at: string;
              profile: ApplicantProfile | null;
            }>;
            usedServiceRole?: boolean;
          };
          const items = body.items ?? [];
          console.log(
            "🔍 쿼리 결과 data (API):",
            items,
            "| usedServiceRole:",
            Boolean(body.usedServiceRole)
          );
          merged = items.map((item) => {
            const prof = item.profile;
            return {
              id: item.id,
              project_id: item.project_id,
              applicant_id: item.applicant_id,
              message: item.message,
              role: item.role,
              tech_stack: item.tech_stack,
              status: item.status,
              created_at: item.created_at,
              applicant: prof,
              profiles: prof,
            };
          });
        } else {
          const errText = await apiRes.text().catch(() => "");
          console.warn("[manage] GET /applications API failed:", apiRes.status, errText);
        }
      } catch (e) {
        console.warn("[manage] GET /applications API network error:", e);
      }

      if (merged === null) {
        // 폴백: 클라이언트 Supabase 직접 조회
        const { data, error } = await supabase
          .from("applications")
          .select("*")
          .eq("project_id", projectId)
          .in("status", statusFilter)
          .order("created_at", { ascending: false });

        console.log("🔍 쿼리 결과 data (클라이언트):", data);
        console.log("🔍 쿼리 에러 error:", error);

        if (error) {
          console.error("[manage] applications select('*') only:", error);
          if (!cancelled) setApplications([]);
          return;
        }

        const appRows = data ?? [];
        const appRowsTyped = appRows.map((row) => {
          const r = row as Record<string, unknown>;
          return {
            id: String(r.id),
            project_id: String(r.project_id),
            applicant_id: String(r.applicant_id),
            message: (typeof r.message === "string" ? r.message : null) as string | null,
            role: typeof r.role === "string" ? r.role : null,
            tech_stack: typeof r.tech_stack === "string" ? r.tech_stack : null,
            status: r.status as "pending" | "accepted" | "rejected",
            created_at: String(r.created_at),
          };
        });

        /** 지원자 프로필: profiles.id = applications.applicant_id (user_id 컬럼 없음) */
        const applicantIds = [...new Set(appRowsTyped.map((a) => a.applicant_id).filter(Boolean))];
        let profileMap = new Map<string, ApplicantProfile>();

        if (applicantIds.length > 0) {
          let profileRows = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, email, role, tech_stack, manner_temp_target")
            .in("id", applicantIds);

          if (profileRows.error?.message?.toLowerCase().includes("column")) {
            profileRows = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url, role, tech_stack, manner_temp_target")
              .in("id", applicantIds);
          }

          if (profileRows.error) {
            console.warn("[manage] profiles batch select:", profileRows.error.message);
          } else {
            const rows = (profileRows.data ?? []) as Array<{
              id: string;
              full_name: string | null;
              avatar_url: string | null;
              email?: string | null;
              role: string | null;
              tech_stack: unknown;
              manner_temp_target: string | null;
            }>;
            profileMap = new Map(
              rows.map((p) => [
                p.id,
                {
                  full_name: p.full_name,
                  avatar_url: p.avatar_url,
                  email: p.email ?? null,
                  profile_role: p.role,
                  tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
                  manner_temp_target: p.manner_temp_target,
                },
              ])
            );
          }
        }

        const embeddedSelect = `
      id,
      profiles (
        full_name,
        avatar_url,
        email,
        role,
        tech_stack,
        manner_temp_target
      )
    `;
        const embedRes = await supabase
          .from("applications")
          .select(embeddedSelect)
          .eq("project_id", projectId)
          .in("status", statusFilter);

        const embedByAppId = new Map<string, unknown>();
        if (!embedRes.error && embedRes.data) {
          for (const row of embedRes.data as Array<{ id: string; profiles: unknown }>) {
            if (row?.id) embedByAppId.set(String(row.id), row.profiles);
          }
        } else if (embedRes.error) {
          console.warn("[manage] optional embed join skipped:", embedRes.error.message);
        }

        merged = appRowsTyped.map((a) => {
          const fromMap = profileMap.get(a.applicant_id) ?? null;
          const fromEmbed = normalizeProfileEmbed(embedByAppId.get(a.id));
          const applicant = mergeApplicantProfiles(fromMap, fromEmbed);
          return { ...a, applicant, profiles: applicant };
        });
      }

      if (cancelled) return;

      const forUi = viewArchived ? merged : dedupeApplicationsByApplicantLatest(merged);
      setApplications(forUi);
    }

    void fetchApplicantsInEffect();

    return () => {
      cancelled = true;
    };
  }, [projectId, viewArchived, router]);

  const filteredApplications = searchQuery.trim()
    ? applications.filter((a) => {
        const pf = applicantProfile(a);
        const name = pf?.full_name?.toLowerCase() ?? "";
        const email = pf?.email?.toLowerCase() ?? "";
        const stack = (pf?.tech_stack ?? []).join(" ").toLowerCase();
        const pos = applicationPosition(a).toLowerCase();
        const q = searchQuery.toLowerCase();
        return name.includes(q) || email.includes(q) || stack.includes(q) || pos.includes(q);
      })
    : applications;

  const handleAccept = async (applicationId: string) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    setManageActionError(null);
    setUpdatingId(applicationId);
    const applicantName = applicantProfile(app)?.full_name ?? "Unknown";

    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId ? { ...a, status: "accepted" as const } : a
      )
    );

    const res = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/applications/${encodeURIComponent(applicationId)}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      }
    );

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      const msg =
        data.error ??
        (res.status === 404
          ? "지원서를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요."
          : "수락 처리에 실패했습니다.");
      setManageActionError(msg);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId ? { ...a, status: "pending" as const } : a
        )
      );
      setUpdatingId(null);
      return;
    }

    setToast({ show: true, name: applicantName });
    setTimeout(() => setToast(null), 5000);
    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    setUpdatingId(null);
  };

  const submitReject = async (applicationId: string, reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed) return;

    setManageActionError(null);
    setUpdatingId(applicationId);

    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId ? { ...a, status: "rejected" as const } : a
      )
    );

    const res = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/applications/${encodeURIComponent(applicationId)}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejectReason: trimmed }),
      }
    );

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      const msg =
        data.error ??
        (res.status === 404
          ? "지원서를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요."
          : "거절 처리에 실패했습니다.");
      setManageActionError(msg);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId ? { ...a, status: "pending" as const } : a
        )
      );
      setUpdatingId(null);
      return;
    }

    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    setUpdatingId(null);
    setRejectModalAppId(null);
    setRejectReasonInput("");
  };

  const handleExportCsv = () => {
    const headers = [
      "Name",
      "Role",
      "Tech Stack",
      "Status",
      "Applied At",
      "Message",
    ];
    const rows = applications.map((a) => [
      applicantProfile(a)?.full_name ?? "-",
      applicationPosition(a),
      (applicantProfile(a)?.tech_stack ?? []).filter((t) => t && t !== "__skipped__").join(", "),
      a.status,
      new Date(a.created_at).toLocaleString(),
      (a.message ?? "").replace(/"/g, '""'),
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applicants-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const trimMotivation = (msg: string | null, maxLen = 80) => {
    if (!msg) return "";
    return msg.length > maxLen ? msg.slice(0, maxLen) + "…" : msg;
  };

  if (isLeader === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-600">이 페이지에 접근할 권한이 없습니다.</p>
        <Link
          href={`/projects/${projectId}`}
          className="mt-4 text-[#2563EB] hover:underline"
        >
          프로젝트로 돌아가기
        </Link>
      </div>
    );
  }

  if (isLeader === null) {
    return <ManageApplicantsSkeleton />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ManageApplicantsSidebar
        projectId={projectId}
        projectTitle={projectTitle}
        teamLeaderName={teamLeaderName}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-slate-200 bg-white px-6 py-3 md:px-10">
          <div className="mx-auto flex max-w-4xl items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-slate-400"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="지원자 검색..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              aria-label="지원자 검색"
            />
          </div>
        </div>

        <main className="flex-1 px-6 py-8 md:px-10">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              RECRUITMENT MODULE
            </p>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-bold text-slate-900">
                Manage Applicants for {projectTitle || "Side-Sync"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {filteredApplications.length} Active Applications
              </div>
            </div>

            {manageActionError && (
              <div
                className="mt-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
                role="alert"
              >
                <p>{manageActionError}</p>
                <button
                  type="button"
                  onClick={() => setManageActionError(null)}
                  className="shrink-0 rounded-lg p-1 text-red-600 hover:bg-red-100"
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>
            )}

            {toast?.show && (
              <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2563EB]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Applicant Accepted
                    </p>
                    <p className="text-sm text-slate-600">
                      {toast.name} has been added to the team roster.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-100 hover:text-slate-600"
                  aria-label="닫기"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="mt-8 space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="col-span-full">
                  {viewArchived ? (
                    <EmptyState
                      title="아카이브된 지원자가 없습니다"
                      description="거절한 지원자는 여기에 표시됩니다."
                      actions={[
                        { label: "대기 중으로 돌아가기", onClick: () => setViewArchived(false), primary: true },
                      ]}
                    />
                  ) : (
                    <EmptyState
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      }
                      title="아직 지원자가 없습니다"
                      description="대기(pending) 지원이 없을 수 있습니다. 이미 수락·거절한 지원은 아래 「View Archived」에서 확인하세요. 홍보를 늘리거나 조금 더 기다려 주세요."
                      actions={[
                        { label: "공고 확인하기", href: `/projects/${projectId}`, primary: true },
                      ]}
                    />
                  )}
                </div>
              ) : (
                filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className={`flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-opacity sm:flex-row sm:items-start sm:gap-6 ${
                      app.status === "rejected" ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex shrink-0 items-start gap-4">
                      <div className="relative">
                        {app.profiles?.avatar_url ? (
                          <img
                            src={app.profiles.avatar_url}
                            alt=""
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600">
                            {(app.profiles?.full_name?.[0] ?? "?").toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {app.profiles?.manner_temp_target ?? "36.5"}°C
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {app.profiles?.full_name ?? "Unknown"}
                          </p>
                          {app.profiles?.email ? (
                            <span className="text-xs text-slate-500">{app.profiles.email}</span>
                          ) : null}
                          {(app.tech_stack?.trim() || app.role?.trim()) && (
                            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-900 ring-1 ring-indigo-200/80">
                              {app.tech_stack?.trim() || app.role}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(app.profiles?.tech_stack ?? [])
                            .filter((t: string) => t && t !== "__skipped__")
                            .slice(0, 5)
                            .map((tech: string) => (
                              <span
                                key={tech}
                                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                              >
                                {tech}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        MOTIVATION
                      </p>
                      <p className="mt-1.5 text-sm text-slate-700">
                        {trimMotivation(app.message)}
                      </p>
                      {app.message && app.message.length > 80 && (
                        <button
                          type="button"
                          onClick={() => {
                            const full = app.message ?? "";
                            if (full) alert(full);
                          }}
                          className="mt-1 text-xs font-medium text-[#2563EB] hover:underline"
                        >
                          전체 보기
                        </button>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {viewArchived ? (
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            app.status === "accepted"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {app.status === "accepted" ? "Accepted" : "Rejected"}
                        </span>
                      ) : (() => {
                        const appRole = applicationPosition(app);
                        const roleInfo = roleFilledMap[appRole];
                        const isRoleFull = roleInfo && roleInfo.filled >= roleInfo.total;
                        return (
                        <>
                          {isRoleFull ? (
                            <span className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500">
                              모집 완료
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAccept(app.id)}
                              disabled={updatingId === app.id}
                              className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
                            >
                              {updatingId === app.id ? "처리 중..." : "수락"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModalAppId(app.id);
                              setRejectReasonInput("");
                            }}
                            disabled={updatingId === app.id}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
                          >
                            거절
                          </button>
                        </>
                        );
                      })()}
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredApplications.length > 0 && (
              <div className="mt-10 flex flex-col items-center gap-4 border-t border-slate-200 pt-8">
                <p className="text-sm text-slate-500">
                  {viewArchived ? "END OF ARCHIVED" : "END OF PENDING QUEUE"}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setViewArchived(!viewArchived)}
                    className="font-medium text-[#2563EB] hover:underline"
                  >
                    {viewArchived ? "Back to Pending" : "View Archived"}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="font-medium text-[#2563EB] hover:underline"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer variant="compact" />
      </div>

      {rejectModalAppId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-modal-title"
          >
            <h2 id="reject-modal-title" className="text-lg font-semibold text-slate-900">
              거절 사유 입력
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              신청자에게 알림으로 전달됩니다. (형식: 사유: 입력 내용)
            </p>
            <textarea
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              placeholder="예: 현재 포지션이 마감되었습니다."
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalAppId(null);
                  setRejectReasonInput("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!rejectReasonInput.trim() || updatingId === rejectModalAppId}
                onClick={() => void submitReject(rejectModalAppId, rejectReasonInput)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                거절 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
