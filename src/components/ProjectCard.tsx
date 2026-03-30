import Link from "next/link";
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
    recruitmentState === "full" && "border-slate-200 opacity-[0.82] grayscale-[0.85] hover:opacity-90",
    recruitmentState === "closed" && "border-emerald-100/90 hover:border-emerald-200"
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
}: ProjectCardProps) {
  const badge = RECRUITMENT_BADGE[recruitmentState] ?? RECRUITMENT_BADGE.recruiting;
  const isUrgent = recruitmentState === "urgent";
  const isDimmed = recruitmentState === "full";

  const heroVisual = (
    <div
      className={cn(
        "relative h-28 shrink-0 overflow-hidden bg-gradient-to-br sm:h-32 md:h-36",
        gradient
      )}
    >
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
            <span
              className={cn(
                "inline-flex max-w-[10rem] items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 shadow-sm ring-1 ring-blue-100/80 sm:text-[11px]",
                isDimmed && "opacity-90"
              )}
              title="팀장 매너 온도"
            >
              <span aria-hidden>🌡️</span>
              <span className="min-w-0 truncate tabular-nums">
                <span className="sr-only">매너 온도 </span>
                {mannerTemperature}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const titleBlock = (
    <>
      <h3 className="text-xl font-bold leading-snug tracking-tight text-gray-900">{title}</h3>
      {description ? (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">{description}</p>
      ) : null}
    </>
  );

  const techFooter = (
    <div className="mt-auto border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">스택</p>
      {techStack.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {techStack.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-md border border-slate-200/90 bg-slate-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700 sm:text-[11px]"
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

  const bodyPadding = "px-4 pb-3 pt-3.5 sm:px-5 sm:pt-4";

  if (id && showWorkspaceLink) {
    return (
      <article className={cn(shell, "h-full")}>
        {heroVisual}
        <div className={bodyPadding}>{titleBlock}</div>
        {techFooter}
        <div className="space-y-2 border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
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
      </article>
    );
  }

  const content = (
    <>
      {heroVisual}
      <div className={bodyPadding}>{titleBlock}</div>
      {techFooter}
      <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-5">
        <span className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-center text-xs font-semibold text-slate-800 transition-colors group-hover:border-blue-200 group-hover:bg-blue-50/50 sm:text-sm">
          상세 보기
        </span>
      </div>
    </>
  );

  const linkClass = cn("group block h-full", shell);

  if (id) {
    return (
      <Link href={`/projects/${id}`} className={linkClass}>
        {content}
      </Link>
    );
  }

  return <article className={linkClass}>{content}</article>;
}

export type { ProjectRecruitmentState } from "@/lib/project-recruitment-state";
