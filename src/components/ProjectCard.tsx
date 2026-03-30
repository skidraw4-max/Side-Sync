import Link from "next/link";
import { Thermometer } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ProjectRecruitmentState } from "@/lib/project-recruitment-state";

/** 프로젝트 카드 필수 Props */
export interface ProjectCardProps {
  /** 프로젝트 제목 */
  title: string;
  /** 기술 스택 태그 목록 */
  techStack: string[];
  /** 매너 온도 (예: "36.5°C") — 카드에서 '협업 온도'로 표시 */
  mannerTemperature: string;
  /** 상세 페이지 링크용 ID (있으면 Link로 렌더) */
  id?: string;
  /** 프로젝트 설명 (선택) */
  description?: string;
  /** 카드 상단 그라데이션 Tailwind 클래스 (선택) */
  gradient?: string;
  /** 참여 중인 내 프로젝트: View Details 아래 워크스페이스 이동 버튼 표시 */
  showWorkspaceLink?: boolean;
  /** 모집 상태 배지 (미지정 시 모집 중 스타일) */
  recruitmentState?: ProjectRecruitmentState;
  /** 모집 인원 진행 (filled/total) — 없으면 숫자 없이 문구만 */
  recruitmentProgress?: { filled: number; total: number } | null;
}

const RECRUITMENT_BADGE: Record<
  ProjectRecruitmentState,
  { label: string; className: string }
> = {
  recruiting: {
    label: "모집중",
    className: "bg-white/90 text-blue-800 ring-1 ring-blue-200/90 shadow-sm backdrop-blur-sm",
  },
  urgent: {
    label: "모집중",
    className: "bg-white/90 text-orange-900 ring-1 ring-orange-200/90 shadow-sm backdrop-blur-sm",
  },
  full: {
    label: "모집완료",
    className: "bg-white/90 text-slate-700 ring-1 ring-slate-200/90 shadow-sm backdrop-blur-sm",
  },
  closed: {
    label: "프로젝트 완료",
    className: "bg-white/90 text-emerald-900 ring-1 ring-emerald-200/90 shadow-sm backdrop-blur-sm",
  },
};

function cardShellClasses(recruitmentState: ProjectRecruitmentState) {
  return cn(
    "flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ease-out will-change-transform",
    "hover:-translate-y-1 hover:shadow-xl",
    recruitmentState === "recruiting" && "border-slate-200/90 hover:border-blue-300/80",
    recruitmentState === "urgent" &&
      "border-orange-200/90 ring-1 ring-orange-100/80 hover:border-orange-300",
    recruitmentState === "full" && "border-slate-200 opacity-[0.82] grayscale-[0.9] hover:opacity-90",
    recruitmentState === "closed" && "border-emerald-100/90 hover:border-emerald-200"
  );
}

function progressBarClass(recruitmentState: ProjectRecruitmentState) {
  if (recruitmentState === "urgent") return "bg-gradient-to-r from-orange-500 to-amber-500";
  if (recruitmentState === "full" || recruitmentState === "closed") {
    return "bg-gradient-to-r from-emerald-500 to-teal-600";
  }
  return "bg-gradient-to-r from-blue-500 to-indigo-600";
}

function RecruitmentGauge({
  recruitmentState,
  recruitmentProgress,
}: {
  recruitmentState: ProjectRecruitmentState;
  recruitmentProgress?: { filled: number; total: number } | null;
}) {
  const pct = (() => {
    if (recruitmentProgress) {
      const { filled, total } = recruitmentProgress;
      if (total <= 0) return 0;
      return Math.min(100, Math.round((filled / total) * 100));
    }
    if (recruitmentState === "full" || recruitmentState === "closed") return 100;
    return 28;
  })();

  const label = (() => {
    if (recruitmentProgress) {
      const { filled, total } = recruitmentProgress;
      return `${filled}/${total}명 모집 중`;
    }
    if (recruitmentState === "closed") return "프로젝트 완료";
    if (recruitmentState === "full") return "모집 마감";
    if (recruitmentState === "urgent") return "마감 임박 · 모집 중";
    return "모집 중";
  })();

  const barClass = progressBarClass(recruitmentState);
  const indeterminate =
    !recruitmentProgress && recruitmentState !== "full" && recruitmentState !== "closed";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-700 sm:text-xs">
        <span>{label}</span>
        {recruitmentProgress ? (
          <span className="shrink-0 tabular-nums text-slate-500">{pct}%</span>
        ) : null}
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-200/90"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            barClass,
            indeterminate && "animate-pulse"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ProjectCard({
  title,
  techStack,
  mannerTemperature,
  id,
  description = "",
  gradient = "from-blue-200 via-indigo-200 to-purple-200",
  showWorkspaceLink = false,
  recruitmentState = "recruiting",
  recruitmentProgress = null,
}: ProjectCardProps) {
  const badge = RECRUITMENT_BADGE[recruitmentState] ?? RECRUITMENT_BADGE.recruiting;
  const isUrgent = recruitmentState === "urgent";

  const heroVisual = (
    <div className={cn("relative h-28 shrink-0 overflow-hidden sm:h-32 md:h-36", `bg-gradient-to-br ${gradient}`)}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] bg-[radial-gradient(circle_at_1.5px_1.5px,rgb(255_255_255/0.55)_1px,transparent_0)] [background-size:14px_14px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10"
        aria-hidden
      />
      <div className="relative flex h-full flex-col justify-between p-3 sm:p-3.5">
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "inline-flex max-w-[65%] items-center rounded-full px-2.5 py-1 text-[10px] font-bold leading-tight sm:text-[11px]",
              badge.className
            )}
          >
            {badge.label}
          </span>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {isUrgent ? (
              <span className="rounded-md bg-orange-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-md sm:text-[10px]">
                마감임박
              </span>
            ) : null}
            <div
              className="flex max-w-[10rem] items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-800 shadow-md backdrop-blur-sm sm:text-[11px]"
              title="팀장 협업 온도"
            >
              <Thermometer className="h-3 w-3 shrink-0 text-slate-600 sm:h-3.5 sm:w-3.5" strokeWidth={2} aria-hidden />
              <span className="min-w-0 truncate">
                <span className="sr-only">협업 온도 </span>
                {mannerTemperature}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const body = (
    <div className="flex flex-1 flex-col px-4 pb-3 pt-3.5 sm:px-5 sm:pt-4">
      <h3 className="text-xl font-bold leading-snug tracking-tight text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{description}</p>
      ) : null}
      <div className="mt-4">
        <RecruitmentGauge recruitmentState={recruitmentState} recruitmentProgress={recruitmentProgress} />
      </div>
    </div>
  );

  const techFooter = (
    <div className="mt-auto border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">스택</p>
      {techStack.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {techStack.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md border border-slate-200/90 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm sm:text-[11px]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-400">등록된 기술 스택이 없습니다</p>
      )}
    </div>
  );

  const shell = cardShellClasses(recruitmentState);

  const ctaSingle = (
    <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
      <span className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 text-center text-xs font-semibold text-slate-800 transition-colors group-hover:border-blue-200 group-hover:bg-blue-50/50 sm:text-sm">
        상세 보기
      </span>
    </div>
  );

  const ctaWorkspace = (
    <div className="space-y-2 border-t border-slate-100 px-4 py-3 sm:px-5">
      <Link
        href={`/projects/${id}`}
        className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 sm:text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        상세 보기
      </Link>
      <Link
        href={`/projects/${id}/workspace`}
        className="block w-full rounded-xl bg-[#2563EB] py-2.5 text-center text-xs font-bold text-white shadow-md transition-colors hover:bg-[#1d4ed8] sm:text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        워크스페이스 이동
      </Link>
    </div>
  );

  if (id && showWorkspaceLink) {
    return (
      <article className={cn(shell, "h-full")}>
        {heroVisual}
        {body}
        {techFooter}
        {ctaWorkspace}
      </article>
    );
  }

  const inner = (
    <>
      {heroVisual}
      {body}
      {techFooter}
      {ctaSingle}
    </>
  );

  if (id) {
    return (
      <Link href={`/projects/${id}`} className={cn("group block h-full", shell)}>
        {inner}
      </Link>
    );
  }

  return <article className={shell}>{inner}</article>;
}

export type { ProjectRecruitmentState } from "@/lib/project-recruitment-state";
