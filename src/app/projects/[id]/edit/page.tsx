"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import type { RecruitmentStatusRow } from "@/types/database";
import {
  RECRUITMENT_ROLE_PRESETS,
  createRecruitmentEntry,
  entriesToRecruitmentStatusRows,
  recruitmentEntriesValidationMessage,
  recruitmentRowsToEntries,
  type RecruitmentEntry,
} from "@/lib/project-recruitment-form";

const STATUS_OPTIONS: { value: RecruitmentStatusRow["status"]; label: string }[] = [
  { value: "recruiting", label: "모집중" },
  { value: "urgent", label: "급구" },
];

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const queryClient = useQueryClient();

  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  const [recruitments, setRecruitments] = useState<RecruitmentEntry[]>([createRecruitmentEntry()]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (cancelled) return;
      if (error || !data) {
        toast.error("프로젝트를 불러올 수 없습니다.");
        router.push("/projects");
        return;
      }

      const row = data as {
        title: string;
        description: string | null;
        goal: string | null;
        tech_stack: string[] | null;
        recruitment_status: unknown;
        team_leader_id: string | null;
      };

      if (row.team_leader_id !== user.id) {
        toast.error("수정 권한이 없습니다.");
        router.push(`/projects/${projectId}`);
        return;
      }

      setTitle(row.title);
      setDescription(row.description ?? "");
      setGoal(row.goal ?? "");
      setTechStack(Array.isArray(row.tech_stack) && row.tech_stack.length > 0 ? row.tech_stack : []);
      setRecruitments(recruitmentRowsToEntries(row.recruitment_status));
      setReady(true);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId, router]);

  const addTech = () => {
    const t = techInput.trim();
    if (t && !techStack.includes(t)) {
      setTechStack((prev) => [...prev, t]);
      setTechInput("");
    }
  };

  const removeTech = (tech: string) => {
    setTechStack((prev) => prev.filter((x) => x !== tech));
  };

  const addRecruitment = useCallback(() => {
    setRecruitments((prev) => [...prev, createRecruitmentEntry()]);
  }, []);

  const removeRecruitment = useCallback((id: string) => {
    setRecruitments((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRecruitment = useCallback(
    (id: string, field: keyof RecruitmentEntry, value: string | number) => {
      setRecruitments((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("프로젝트 제목을 입력해주세요.");
      return;
    }

    const recruitErr = recruitmentEntriesValidationMessage(recruitments);
    if (recruitErr) {
      toast.error(recruitErr);
      return;
    }

    setIsLoading(true);
    try {
      const recruitmentStatus: RecruitmentStatusRow[] = entriesToRecruitmentStatusRows(recruitments);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        goal: goal.trim() || null,
        tech_stack: techStack,
        recruitment_status: recruitmentStatus,
      };

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        toast.error(json.error ?? `저장 실패 (${res.status})`);
        if (res.status === 401) router.push("/login");
        return;
      }

      toast.success("프로젝트가 저장되었습니다.");
      void queryClient.invalidateQueries({ queryKey: ["projects", "mine"] });
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      console.error("[edit project]", err);
      toast.error(err instanceof Error ? err.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <main className="px-6 pb-16 pt-8 md:px-12 lg:px-24">
          <div className="mx-auto max-w-2xl animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-gray-200" />
            <div className="h-64 rounded-2xl bg-gray-200" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <main className="px-6 pb-16 pt-8 md:px-12 lg:px-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">프로젝트 수정</h1>
            <p className="mt-1 text-gray-500">프로젝트 정보를 수정하고 저장합니다.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">프로젝트 정보</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">프로젝트 제목</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">한 줄 소개</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상세 목표 및 내용</label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={5}
                    className="mt-1.5 w-full resize-y rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">기술 스택</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {techStack.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center gap-1 rounded-full bg-[#2563EB]/10 px-3 py-1 text-sm font-medium text-[#2563EB]"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTech(tech)}
                          className="rounded p-0.5 hover:bg-[#2563EB]/20"
                          aria-label={`${tech} 제거`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={techInput}
                      onChange={(e) => setTechInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
                      placeholder="Figma, Node.js 등 추가"
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <button
                      type="button"
                      onClick={addTech}
                      className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2"
                  className="shrink-0"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">직군별 모집 설정</h2>
              </div>

              <div className="space-y-4">
                <datalist id="recruitment-role-suggestions">
                  {RECRUITMENT_ROLE_PRESETS.map((opt) => (
                    <option key={opt.value} value={opt.label} />
                  ))}
                </datalist>
                <div className="grid grid-cols-[1fr_80px_100px_40px] gap-4 text-sm font-medium text-gray-500 md:grid-cols-[1fr_100px_120px_48px]">
                  <span>모집 분야</span>
                  <span>모집 인원</span>
                  <span>모집 상태</span>
                  <span />
                </div>

                {recruitments.map((r) => (
                  <div
                    key={r.id}
                    className="grid grid-cols-[1fr_80px_100px_40px] items-center gap-4 md:grid-cols-[1fr_100px_120px_48px]"
                  >
                    <input
                      type="text"
                      list="recruitment-role-suggestions"
                      value={r.role}
                      onChange={(e) => updateRecruitment(r.id, "role", e.target.value)}
                      placeholder="직군명 입력 (예: 마케터, PM)"
                      autoComplete="off"
                      className="min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={r.count}
                        onChange={(e) =>
                          updateRecruitment(r.id, "count", Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                      />
                      <span className="text-sm text-gray-500">명</span>
                    </div>
                    <select
                      value={r.status}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateRecruitment(r.id, "status", v === "urgent" ? "urgent" : "recruiting");
                      }}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeRecruitment(r.id)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="삭제"
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
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                ))}

                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={addRecruitment}
                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]"
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
                      <path d="M5 12h14" />
                      <path d="M12 5v14" />
                    </svg>
                    분야 추가
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link
                href={`/projects/${projectId}`}
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-70"
              >
                {isLoading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer variant="compact" />
    </div>
  );
}
