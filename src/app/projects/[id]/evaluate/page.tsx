"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import { EvaluatePageSkeleton } from "@/components/Skeleton";

const QUICK_FEEDBACK_OPTIONS = [
  { label: "시간을 잘 지켜요", score: 0.3 },
  { label: "답장이 빨라요", score: 0.2 },
  { label: "연락이 안 돼요", score: -0.3 },
  { label: "중도 하차했어요", score: -0.5 },
];

interface TeamMember {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  manner_temp: string | number | null;
}

interface EvaluationState {
  [memberId: string]: {
    quick_feedback: string[];
    additional_feedback: string;
  };
}

export default function EvaluatePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<{ title: string; status: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [evaluatedIds, setEvaluatedIds] = useState<Set<string>>(new Set());
  const [evaluationState, setEvaluationState] = useState<EvaluationState>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: projectData } = await supabase
      .from("projects")
      .select("id, title, team_leader_id, status")
      .eq("id", projectId)
      .single();

    if (!projectData) {
      setError("프로젝트를 찾을 수 없습니다.");
      setLoading(false);
      return;
    }

    if (projectData.status !== "completed") {
      setError("종료된 프로젝트만 평가할 수 있습니다.");
      setLoading(false);
      return;
    }

    setProject({ title: projectData.title, status: projectData.status });

    const memberIds = new Set<string>();
    if (projectData.team_leader_id) memberIds.add(projectData.team_leader_id);
    const { data: acceptedApps } = await supabase
      .from("applications")
      .select("applicant_id, role")
      .eq("project_id", projectId)
      .eq("status", "accepted");
    (acceptedApps ?? []).forEach((a) => memberIds.add(a.applicant_id));

    memberIds.delete(user.id);

    if (memberIds.size === 0) {
      setTeamMembers([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, manner_temp, manner_temp_target")
      .in("id", Array.from(memberIds));

    const roleMap = new Map<string, string>();
    if (projectData.team_leader_id) {
      roleMap.set(projectData.team_leader_id, "LEAD");
    }
    (acceptedApps ?? []).forEach((a) => {
      roleMap.set(a.applicant_id, (a as { role?: string }).role ?? "MEMBER");
    });

    const members: TeamMember[] = (profiles ?? []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      role: roleMap.get(p.id) ?? "MEMBER",
      manner_temp: (p as { manner_temp?: number }).manner_temp ?? (p as { manner_temp_target?: string }).manner_temp_target ?? "36.5",
    }));
    setTeamMembers(members);

    const { data: existingEvals } = await supabase
      .from("peer_evaluations")
      .select("evaluatee_id")
      .eq("project_id", projectId)
      .eq("evaluator_id", user.id);
    setEvaluatedIds(new Set((existingEvals ?? []).map((e) => e.evaluatee_id)));
    setLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleQuickFeedbackToggle = (memberId: string, label: string) => {
    setEvaluationState((prev) => {
      const current = prev[memberId]?.quick_feedback ?? [];
      const next = current.includes(label)
        ? current.filter((l) => l !== label)
        : [...current, label];
      return { ...prev, [memberId]: { ...prev[memberId], quick_feedback: next, additional_feedback: prev[memberId]?.additional_feedback ?? "" } };
    });
  };

  const handleSubmitOne = async (evaluateeId: string) => {
    const state = evaluationState[evaluateeId];
    const quickFeedback = state?.quick_feedback ?? [];
    if (quickFeedback.length === 0) {
      setError("최소 하나의 피드백을 선택해주세요.");
      return;
    }

    setSubmittingId(evaluateeId);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/evaluations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evaluatee_id: evaluateeId,
        quick_feedback: quickFeedback,
        additional_feedback: state?.additional_feedback?.trim() || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "제출에 실패했습니다.");
      setSubmittingId(null);
      return;
    }

    setEvaluatedIds((prev) => new Set([...prev, evaluateeId]));
    setEvaluationState((prev) => {
      const next = { ...prev };
      delete next[evaluateeId];
      return next;
    });
    setSubmittingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="px-6 py-12 md:px-12 lg:px-24">
          <EvaluatePageSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <main className="px-6 py-12 md:px-12 lg:px-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            INTERNAL EVALUATION PHASE
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Team Evaluation</h1>
          <p className="mt-1 text-gray-600">
            {project?.title} • 상호 평가
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Due in 2 days
          </span>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {teamMembers.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                title="평가할 팀원이 없습니다"
                description="종료된 프로젝트에서 함께한 팀원이 없어 평가할 수 없어요."
                actions={[
                  { label: "프로젝트 목록", href: "/projects", primary: true },
                ]}
              />
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {teamMembers.map((member) => {
                const isEvaluated = evaluatedIds.has(member.id);
                const state = evaluationState[member.id] ?? { quick_feedback: [], additional_feedback: "" };
                const canSubmit = state.quick_feedback.length > 0;

                return (
                  <div
                    key={member.id}
                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                      <div className="flex shrink-0 items-center gap-4">
                        {member.avatar_url ? (
                          <img
                            src={member.avatar_url}
                            alt=""
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg font-semibold text-gray-600">
                            {(member.full_name ?? "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{member.full_name ?? "Unknown"}</p>
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{member.role}</p>
                          <p className="mt-1 text-sm text-[#2563EB] font-medium">
                            {typeof member.manner_temp === "number" ? `${member.manner_temp}°C` : member.manner_temp ?? "36.5°C"}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        {isEvaluated ? (
                          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            ✓ 평가 완료
                          </p>
                        ) : (
                          <>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              QUICK FEEDBACK
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {QUICK_FEEDBACK_OPTIONS.map((opt) => (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => handleQuickFeedbackToggle(member.id, opt.label)}
                                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                    state.quick_feedback.includes(opt.label)
                                      ? "bg-[#2563EB] text-white"
                                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                              ADDITIONAL FEEDBACK
                            </p>
                            <textarea
                              value={state.additional_feedback}
                              onChange={(e) =>
                                setEvaluationState((prev) => ({
                                  ...prev,
                                  [member.id]: {
                                    ...prev[member.id],
                                    additional_feedback: e.target.value,
                                  },
                                }))
                              }
                              placeholder={`${member.full_name ?? "이 팀원"}과 함께한 경험을 공유해주세요...`}
                              rows={3}
                              className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitOne(member.id)}
                              disabled={!canSubmit || submittingId === member.id}
                              className="mt-4 flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
                            >
                              {submittingId === member.id ? "제출 중..." : "이 팀원 평가 제출"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Link
              href={`/projects/${projectId}/workspace`}
              className="rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              워크스페이스로 돌아가기
            </Link>
          </div>
        </div>
      </main>
      <Footer variant="stitch" />
    </div>
  );
}
