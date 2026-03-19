"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { RecruitmentStatusRow } from "@/types/database";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "planner", label: "기획자 (Planner)" },
  { value: "developer", label: "개발자 (Developer)" },
  { value: "designer", label: "디자이너 (Designer)" },
];

const STATUS_OPTIONS: { value: RecruitmentStatusRow["status"]; label: string }[] = [
  { value: "recruiting", label: "모집중" },
  { value: "urgent", label: "급구" },
];

interface RecruitmentEntry {
  id: string;
  roleKey: string;
  count: number;
  status: RecruitmentStatusRow["status"];
}

function createRecruitmentEntry(overrides?: Partial<RecruitmentEntry>): RecruitmentEntry {
  return {
    id: crypto.randomUUID(),
    roleKey: "planner",
    count: 1,
    status: "recruiting",
    ...overrides,
  };
}

export default function CreateProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [techStack, setTechStack] = useState<string[]>(["React", "TypeScript", "TailwindCSS"]);
  const [techInput, setTechInput] = useState("");
  const [recruitments, setRecruitments] = useState<RecruitmentEntry[]>([
    createRecruitmentEntry({ roleKey: "planner", count: 1 }),
    createRecruitmentEntry({ roleKey: "developer", count: 2, status: "urgent" }),
    createRecruitmentEntry({ roleKey: "designer", count: 1 }),
  ]);
  const [isLoading, setIsLoading] = useState(false);

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

    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      const recruitmentStatus: RecruitmentStatusRow[] = recruitments.map((r) => ({
        role: ROLE_OPTIONS.find((o) => o.value === r.roleKey)?.label ?? r.roleKey,
        roleKey: r.roleKey,
        count: r.count,
        status: r.status,
      }));

      // team_leader_id에 auth.uid()(= user.id) 저장 → RLS 및 '나의 프로젝트' 목록 조회에 사용
      const { data, error } = await (supabase as any)
        .from("projects")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          goal: goal.trim() || null,
          tech_stack: techStack,
          manner_temp_target: "36.5",
          team_leader_id: user.id,
          recruitment_status: recruitmentStatus,
        })
        .select("id")
        .single();

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        toast.success("프로젝트가 생성되었습니다!");
        // 캐시 무효화: '나의 프로젝트' 목록이 최신 데이터로 갱신되도록
        await queryClient.invalidateQueries({ queryKey: ["projects", "mine"] });
        router.push(`/projects/${data.id}`);
        router.refresh();
      }
    } catch {
      toast.error("저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />

      <main className="px-6 pb-16 pt-8 md:px-12 lg:px-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">새 프로젝트 개설</h1>
            <p className="mt-1 text-gray-500">
              함께할 팀원을 찾고 멋진 프로젝트를 시작해보세요.
            </p>
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
                    placeholder='예: 운동 기록 공유 서비스 "핏링크"'
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">한 줄 소개</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="프로젝트의 핵심 가치를 한 줄로 설명해주세요"
                    rows={2}
                    className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상세 목표 및 내용</label>
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="프로젝트를 시작하게 된 계기와 최종 목표에 대해 작성해주세요."
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
                            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
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

            {/* 직군별 모집 설정 */}
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
                    <select
                      value={r.roleKey}
                      onChange={(e) => updateRecruitment(r.id, "roleKey", e.target.value)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
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
                      onChange={(e) =>
                        updateRecruitment(r.id, "status", e.target.value as RecruitmentStatusRow["status"])
                      }
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
                href="/projects"
                className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-70"
              >
                {isLoading ? "생성 중..." : "프로젝트 생성"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer variant="compact" />
    </div>
  );
}
