"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/Skeleton";

interface ApplicantProfile {
  full_name: string | null;
  avatar_url: string | null;
  tech_stack: string[];
}

interface ApplicationWithProfile {
  id: string;
  project_id: string;
  project_title: string;
  applicant_id: string;
  message: string | null;
  role: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  applicant: ApplicantProfile | null;
}

export default function ApplicantsDashboardPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError(null);

    const { data: myProjectsData } = await supabase
      .from("projects")
      .select("id, title")
      .eq("team_leader_id", user.id);
    const myProjects = (myProjectsData ?? []) as Array<{ id: string; title: string }>;

    if (!myProjects.length) {
      setApplications([]);
      setLoading(false);
      return;
    }

    const projectIds = myProjects.map((p) => p.id);
    const projectMap = new Map(myProjects.map((p) => [p.id, p.title]));

    const { data: appRowsData, error: appError } = await supabase
      .from("applications")
      .select("id, project_id, applicant_id, message, role, status, created_at")
      .in("project_id", projectIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (appError) {
      setError(appError.message);
      setApplications([]);
      setLoading(false);
      return;
    }

    type AppRow = { id: string; project_id: string; applicant_id: string; message: string | null; role: string | null; status: string; created_at: string };
    const appRows = (appRowsData ?? []) as AppRow[];
    const applicantIds = [...new Set(appRows.map((a) => a.applicant_id))];
    let profileMap = new Map<string, ApplicantProfile>();

    if (applicantIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, tech_stack")
        .in("id", applicantIds);

      const profiles = (profilesData ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null; tech_stack: string[] }>;
      profileMap = new Map(
        profiles.map((p) => [
          p.id,
          {
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
          },
        ])
      );
    }

    setApplications(
      appRows.map((a) => ({
        ...a,
        project_title: projectMap.get(a.project_id) ?? "Unknown",
        applicant: profileMap.get(a.applicant_id) ?? null,
      }))
    );
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusUpdate = async (
    applicationId: string,
    projectId: string,
    status: "accepted" | "rejected"
  ) => {
    setUpdatingId(applicationId);

    const res = await fetch(
      `/api/projects/${projectId}/applications/${applicationId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "처리에 실패했습니다.");
      setUpdatingId(null);
      return;
    }

    setApplications((prev) => prev.filter((a) => a.id !== applicationId));
    setUpdatingId(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <main className="px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                지원자 관리 대시보드
              </h1>
              <p className="mt-1 text-gray-500">
                내 프로젝트에 지원한 대기 중인 지원자를 한눈에 확인하고 수락/거절할 수 있습니다.
              </p>
            </div>
            <Link
              href="/projects"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              프로젝트 목록
            </Link>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:gap-6"
                >
                  <Skeleton className="h-12 w-12 shrink-0" rounded="full" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-20" rounded="lg" />
                    <Skeleton className="h-10 w-16" rounded="lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <EmptyState
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
              title="대기 중인 지원자가 없습니다"
              description="내 프로젝트에 지원한 대기 중인 지원자가 없어요. 프로젝트를 홍보하거나 조금 더 기다려보세요."
              actions={[
                { label: "프로젝트 둘러보기", href: "/projects", primary: true },
                { label: "새 프로젝트 만들기", href: "/projects/create", primary: false },
              ]}
            />
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                      {app.applicant?.avatar_url ? (
                        <img
                          src={app.applicant.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-gray-600">
                          {(app.applicant?.full_name ?? "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">
                        {app.applicant?.full_name ?? "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {app.role ?? "General"} · {app.project_title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                        {app.message?.slice(0, 120)}
                        {app.message && app.message.length > 120 ? "…" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusUpdate(app.id, app.project_id, "accepted")
                      }
                      disabled={updatingId === app.id}
                      className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
                    >
                      {updatingId === app.id ? "처리 중" : "수락"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusUpdate(app.id, app.project_id, "rejected")
                      }
                      disabled={updatingId === app.id}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
                    >
                      거절
                    </button>
                    <Link
                      href={`/projects/${app.project_id}/manage`}
                      className="text-center text-sm font-medium text-[#2563EB] hover:underline"
                    >
                      상세 관리
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer variant="stitch" />
    </div>
  );
}
