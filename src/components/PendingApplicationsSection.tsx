"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useServerHydratedSession } from "@/contexts/AuthSessionContext";
import { APPLICATION_STATUS } from "@/lib/application-status";
import { fetchProjectsByIds } from "@/lib/supabase-project-queries";
import type { Database, RecruitmentStatusRow } from "@/types/database";
import { inferProjectRecruitmentState } from "@/lib/project-recruitment-state";
import EmptyState from "@/components/EmptyState";
import { ProjectCardSkeleton } from "@/components/Skeleton";
import ProjectCard from "@/components/ProjectCard";
import { shouldEnableSupabaseRealtimeSubscriptions } from "@/lib/supabase/realtime-flags";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

const DEFAULT_GRADIENT = "from-blue-200 via-indigo-200 to-purple-200";

type PendingRow = {
  applicationId: string;
  projectId: string;
  project: ProjectRow;
};

async function fetchPendingApplicationsWithProjects(userId: string): Promise<PendingRow[]> {
  if (!userId) return [];
  const supabase = createClient();
  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "placeholder-key";
  if (!isConfigured) return [];

  const { data: apps, error } = await supabase
    .from("applications")
    .select("id, project_id")
    .eq("applicant_id", userId)
    .eq("status", APPLICATION_STATUS.PENDING);

  if (error || !apps?.length) return [];

  const ids = [...new Set(apps.map((a) => (a as { project_id: string }).project_id))];
  const projects = await fetchProjectsByIds(supabase, ids);
  const map = new Map(projects.map((p) => [p.id, p]));

  return (apps as { id: string; project_id: string }[])
    .map((a) => ({
      applicationId: a.id,
      projectId: a.project_id,
      project: map.get(a.project_id),
    }))
    .filter((x): x is PendingRow => x.project != null);
}

function toCardProps(row: ProjectRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
    mannerTemperature:
      (row as { manner_temp_target?: string | null }).manner_temp_target ?? "36.5°C",
    gradient: (row as { gradient?: string | null }).gradient ?? DEFAULT_GRADIENT,
    recruitmentState: inferProjectRecruitmentState(
      row.status,
      row.recruitment_status as RecruitmentStatusRow[] | null
    ),
  };
}

export default function PendingApplicationsSection() {
  const session = useServerHydratedSession();
  const [userId, setUserId] = useState<string | null>(() => session?.user?.id ?? null);
  const [confirmRow, setConfirmRow] = useState<PendingRow | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
      return;
    }
    void createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, [session]);

  const query = useQuery({
    queryKey: ["applications", "pending", userId ?? ""],
    queryFn: () => fetchPendingApplicationsWithProjects(userId ?? ""),
    enabled: !!userId,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (!userId || !shouldEnableSupabaseRealtimeSubscriptions()) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`pending-apps-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          filter: `applicant_id=eq.${userId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["applications", "pending", userId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [queryClient, userId]);

  if (!userId) return null;

  const items = query.data ?? [];

  const handleConfirmCancel = async () => {
    if (!confirmRow || !userId) return;
    const { applicationId, projectId } = confirmRow;
    setCancelingId(applicationId);
    setConfirmRow(null);

    const prev = queryClient.getQueryData<PendingRow[]>(["applications", "pending", userId]);

    queryClient.setQueryData<PendingRow[]>(
      ["applications", "pending", userId],
      (old) => (old ?? []).filter((r) => r.applicationId !== applicationId)
    );

    try {
      const res = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/applications/${encodeURIComponent(applicationId)}/cancel`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "지원 취소에 실패했습니다.");
      }
      void queryClient.invalidateQueries({ queryKey: ["projects", "mine"] });
      void queryClient.invalidateQueries({ queryKey: ["applications", "pending", userId] });
    } catch (e) {
      if (prev) {
        queryClient.setQueryData(["applications", "pending", userId], prev);
      }
      console.error(e);
      alert(e instanceof Error ? e.message : "지원 취소에 실패했습니다.");
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <>
      <section className="mt-14 px-6 md:px-12 lg:px-24">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">지원 대기 중인 프로젝트</h2>
          <p className="mt-1 text-sm text-gray-500">
            리더 승인을 기다리는 지원입니다. 승인·거절된 지원은 여기에서 취소할 수 없습니다.
          </p>
        </div>

        {query.isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!query.isLoading && items.length === 0 && (
          <EmptyState
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
            title="지원 대기 중인 프로젝트가 없어요"
            description="프로젝트에 지원하면 여기에 표시됩니다."
            actions={[{ label: "프로젝트 탐색하기", href: "/projects", primary: true }]}
          />
        )}

        {!query.isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((row) => (
              <div key={row.applicationId} className="flex flex-col gap-2">
                <ProjectCard {...toCardProps(row.project)} />
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2">
                  <span className="text-xs font-medium text-amber-900">지원 대기 중</span>
                  <button
                    type="button"
                    disabled={cancelingId === row.applicationId}
                    onClick={() => setConfirmRow(row)}
                    className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancelingId === row.applicationId ? "처리 중…" : "지원 취소"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {confirmRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-confirm-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmRow(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="cancel-confirm-title" className="text-lg font-semibold text-gray-900">
              지원 취소
            </h2>
            <p className="mt-2 text-sm text-gray-600">정말 지원을 취소하시겠습니까?</p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setConfirmRow(null)}
              >
                닫기
              </button>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={() => void handleConfirmCancel()}
              >
                지원 취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
