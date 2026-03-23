"use client";

import { useEffect, useState, useCallback } from "react";
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
  applicant: ApplicantProfile | null;
}

function applicationPosition(a: ApplicationWithProfile): string {
  return a.tech_stack?.trim() || a.role?.trim() || "General";
}

export default function ManageApplicantsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

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

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
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
      setIsLeader(false);
      return;
    }

    setIsLeader(true);
    setProjectTitle(project.title);

    if (project.team_leader_id) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", project.team_leader_id)
        .single();
      const leaderProfile = data as { full_name: string | null } | null;
      setTeamLeaderName(leaderProfile?.full_name ?? "Unknown");
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
    setRoleFilledMap(map);

    const statusFilter = viewArchived
      ? ["accepted", "rejected"]
      : ["pending"];
    const { data: appRows, error } = await supabase
      .from("applications")
      .select("*")
      .eq("project_id", projectId)
      .in("status", statusFilter)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setApplications([]);
      return;
    }

    const appRowsTyped = (appRows ?? []).map((row) => {
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

    const applicantIds = [...new Set(appRowsTyped.map((a) => a.applicant_id))];
    if (applicantIds.length === 0) {
      setApplications(appRowsTyped.map((a) => ({ ...a, applicant: null })));
      return;
    }

    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, tech_stack, manner_temp_target")
      .in("id", applicantIds);

    const profileRowsTyped = (profileRows ?? []) as Array<{
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      tech_stack: unknown;
      manner_temp_target: string | null;
    }>;

    const profileMap = new Map(
      profileRowsTyped.map((p) => [
        p.id,
        {
          full_name: p.full_name,
          avatar_url: p.avatar_url,
          tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
          manner_temp_target: p.manner_temp_target,
        },
      ])
    );

    setApplications(
      appRowsTyped.map((a) => ({
        ...a,
        applicant: profileMap.get(a.applicant_id) ?? null,
      }))
    );
  }, [projectId, router, viewArchived]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredApplications = searchQuery.trim()
    ? applications.filter((a) => {
        const name = a.applicant?.full_name?.toLowerCase() ?? "";
        const stack = (a.applicant?.tech_stack ?? []).join(" ").toLowerCase();
        const pos = applicationPosition(a).toLowerCase();
        const q = searchQuery.toLowerCase();
        return name.includes(q) || stack.includes(q) || pos.includes(q);
      })
    : applications;

  const handleAccept = async (applicationId: string) => {
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    setUpdatingId(applicationId);
    const applicantName = app.applicant?.full_name ?? "Unknown";

    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId ? { ...a, status: "accepted" as const } : a
      )
    );

    const res = await fetch(
      `/api/projects/${projectId}/applications/${applicationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
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

    setUpdatingId(applicationId);

    setApplications((prev) =>
      prev.map((a) =>
        a.id === applicationId ? { ...a, status: "rejected" as const } : a
      )
    );

    const res = await fetch(
      `/api/projects/${projectId}/applications/${applicationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected", rejectReason: trimmed }),
      }
    );

    if (!res.ok) {
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
      a.applicant?.full_name ?? "-",
      applicationPosition(a),
      (a.applicant?.tech_stack ?? []).filter((t) => t && t !== "__skipped__").join(", "),
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
                      description="홍보를 시작해보거나 조금 더 기다려주세요!"
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
                        {app.applicant?.avatar_url ? (
                          <img
                            src={app.applicant.avatar_url}
                            alt=""
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600">
                            {(app.applicant?.full_name?.[0] ?? "?").toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {app.applicant?.manner_temp_target ?? "36.5"}°C
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {app.applicant?.full_name ?? "Unknown"}
                          </p>
                          {(app.tech_stack?.trim() || app.role?.trim()) && (
                            <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-900 ring-1 ring-indigo-200/80">
                              {app.tech_stack?.trim() || app.role}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(app.applicant?.tech_stack ?? [])
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
