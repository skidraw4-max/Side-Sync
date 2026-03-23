"use client";

import { useState, useEffect } from "react";
import { PROJECT } from "@/lib/constants/contents";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  /** 지원 가능한 직군만 전달 — 직군별 모집 설정(recruitment_status)과 동일 라벨·정원 (부모가 pending 반영) */
  roles: { role: string; total: number; filled: number }[];
  onSubmitSuccess?: () => void;
}

export default function ApplyModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  roles,
  onSubmitSuccess,
}: ApplyModalProps) {
  const [selectedPosition, setSelectedPosition] = useState("");
  const [motivation, setMotivation] = useState("");
  const [agreeShare, setAgreeShare] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openRoles = roles;
  const defaultPosition = openRoles[0]?.role ?? "";

  useEffect(() => {
    if (isOpen) {
      setSelectedPosition(defaultPosition);
      setMotivation("");
      setAgreeShare(false);
      setError(null);
    }
  }, [isOpen, defaultPosition]);

  const handleClose = () => {
    onClose();
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (openRoles.length === 0) {
      setError("현재 지원 가능한 모집 직군이 없습니다.");
      return;
    }

    const position = selectedPosition.trim() || defaultPosition;
    if (!position) {
      setError("모집 직군(포지션)을 하나 선택해주세요.");
      return;
    }
    if (!openRoles.some((r) => r.role === position)) {
      setError("선택한 직군은 현재 지원할 수 없습니다. 다시 선택해주세요.");
      return;
    }

    if (!motivation.trim()) {
      setError("지원 동기를 입력해주세요.");
      return;
    }
    if (!agreeShare) {
      setError("프로필 및 포트폴리오 공유에 동의해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          techStack: position,
          motivation: motivation.trim(),
          agreeShareProfile: agreeShare,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "지원 제출에 실패했습니다.");
      }
      handleClose();
      onSubmitSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "지원 제출에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
        role="button"
        tabIndex={0}
        aria-label="모달 닫기"
      />
      <div
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">참여 신청 · {projectTitle}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="apply-position" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              모집 직군 (필수)
            </label>
            <p className="mb-2 text-xs text-gray-500">
              프로젝트 개설 시 설정한 직군별 모집과 동일합니다. 지원할 직군을 선택해 주세요.
            </p>
            <select
              id="apply-position"
              required
              value={selectedPosition || defaultPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              {openRoles.length === 0 ? (
                <option value="">지원 가능한 모집 직군이 없습니다</option>
              ) : (
                openRoles.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.role} ({r.filled}/{r.total}명)
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="motivation" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
              지원 동기
            </label>
            <textarea
              id="motivation"
              rows={5}
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="프로젝트에 기여할 수 있는 경험과 각오를 적어주세요."
              className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreeShare}
              onChange={(e) => setAgreeShare(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
            />
            <span className="text-sm text-gray-600">
              공개 프로필 및 포트폴리오를 프로젝트 리더에게 공유하는 데 동의합니다.
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || openRoles.length === 0}
            className="w-full rounded-xl bg-[#2563EB] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-60"
          >
            {isSubmitting ? "제출 중..." : PROJECT.applyParticipate}
          </button>
        </form>
      </div>
    </>
  );
}
