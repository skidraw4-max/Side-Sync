import Link from "next/link";
import { Layers, Thermometer } from "lucide-react";
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
    className: "bg-blue-100 text-blue-800 ring-1 ring-blue-200/80",
  },
  urgent: {
    label: "모집중",
    className: "bg-orange-50 text-orange-800 ring-1 ring-orange-200/80",
  },
  full: {
    label: "모집완료",
    className: "bg-gray-100 text-gray-700 ring-1 ring-gray-200/90",
  },
  closed: {
    label: "종료",
    className: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/90",
  },
};

function cardShellClasses(recruitmentState: ProjectRecruitmentState) {
  return cn(
    "overflow-hidden rounded-xl border shadow-sm transition-all duration-300 ease-out hover:shadow-lg",
    recruitmentState === "recruiting" && [
      "border-blue-500 bg-blue-50/80",
      "hover:border-blue-600 hover:shadow-blue-100/50",
    ],
    recruitmentState === "urgent" && [
      "border-orange-500 bg-white",
      "ring-2 ring-orange-200/70",
      "hover:border-orange-600 hover:shadow-orange-100/60",
    ],
    (recruitmentState === "full" || recruitmentState === "closed") && [
      "border-gray-200 bg-white opacity-60 grayscale",
      "hover:opacity-70",
    ]
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
  const isDimmed = recruitmentState === "full" || recruitmentState === "closed";

  const gradientBlock = (
    <div className={cn("relative h-[4.9rem] bg-gradient-to-br px-3 pt-2 sm:h-20", gradient)}>
      <div className="flex items-start justify-between gap-1.5">
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight sm:text-[11px]",
            badge.className
          )}
        >
          {badge.label}
        </span>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isUrgent && (
            <span
              className="rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white shadow sm:text-[10px]"
              title="마감 임박"
            >
              마감임박
            </span>
          )}
          <div
            className={cn(
              "flex max-w-[min(100%,7.7rem)] items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-gray-800 shadow-sm backdrop-blur-sm sm:max-w-[9rem] sm:text-[11px]",
              isDimmed && "opacity-90"
            )}
            title="팀장 협업 온도"
          >
            <Thermometer
              className="h-3 w-3 shrink-0 text-gray-600 sm:h-3.5 sm:w-3.5"
              strokeWidth={2}
              aria-hidden
            />
            <span className="min-w-0 truncate">
              <span className="sr-only">협업 온도 </span>
              {mannerTemperature}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const techFooter = (
    <div
      className={cn(
        "border-t px-3.5 py-2",
        recruitmentState === "recruiting" && "border-blue-100/80 bg-blue-50/40",
        recruitmentState === "urgent" && "border-orange-100 bg-orange-50/30",
        (recruitmentState === "full" || recruitmentState === "closed") &&
          "border-gray-100 bg-gray-50/50"
      )}
    >
      <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-gray-500 sm:text-[11px]">
        <Layers className="h-3 w-3 shrink-0 text-gray-400 sm:h-3.5 sm:w-3.5" strokeWidth={2} aria-hidden />
        <span>기술 스택</span>
      </div>
      {techStack.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {techStack.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded border border-gray-200/90 bg-white px-1.5 py-px text-[9px] font-medium tracking-wide text-gray-700 shadow-sm sm:text-[10px]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-gray-400 sm:text-xs">등록된 기술 스택이 없습니다</p>
      )}
    </div>
  );

  const titleBlock = (
    <>
      <h3 className="text-sm font-bold leading-snug text-gray-900 sm:text-base">{title}</h3>
      {description && (
        <p className="mt-1.5 line-clamp-2 text-[11px] text-gray-500 sm:mt-2 sm:text-xs">
          {description}
        </p>
      )}
    </>
  );

  const shell = cardShellClasses(recruitmentState);

  /** 참여 중 프로젝트: 카드 전체 링크 대신 버튼 두 개 (상세 / 워크스페이스) */
  if (id && showWorkspaceLink) {
    return (
      <article className={shell}>
        {gradientBlock}
        <div
          className={cn(
            "p-3.5",
            recruitmentState === "recruiting" && "bg-blue-50/30",
            recruitmentState === "urgent" && "bg-white"
          )}
        >
          {titleBlock}
        </div>
        {techFooter}
        <div
          className={cn(
            "border-t px-3.5 pb-3.5 pt-3",
            recruitmentState === "recruiting" && "border-blue-100/80 bg-blue-50/20",
            recruitmentState === "urgent" && "border-orange-100 bg-white"
          )}
        >
          <Link
            href={`/projects/${id}`}
            className="block w-full rounded-md border border-gray-200 py-2 text-center text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:text-xs"
          >
            View Details
          </Link>
          <Link
            href={`/projects/${id}/workspace/tasks`}
            className="mt-1.5 block w-full rounded-md bg-[#2563EB] py-2 text-center text-[11px] font-semibold text-white transition-colors hover:bg-[#1d4ed8] sm:text-xs"
          >
            Go to workspace
          </Link>
        </div>
      </article>
    );
  }

  const content = (
    <>
      {gradientBlock}
      <div
        className={cn(
          "p-3.5 pb-3",
          recruitmentState === "recruiting" && "bg-blue-50/30",
          recruitmentState === "urgent" && "bg-white"
        )}
      >
        {titleBlock}
      </div>
      {techFooter}
      <div
        className={cn(
          "border-t px-3.5 py-3",
          recruitmentState === "recruiting" && "border-blue-100/80 bg-blue-50/20",
          recruitmentState === "urgent" && "border-orange-100 bg-white"
        )}
      >
        <span className="block w-full rounded-md border border-gray-200 py-2 text-center text-[11px] font-medium text-gray-700 transition-colors group-hover:bg-gray-50 sm:text-xs">
          View Details
        </span>
      </div>
    </>
  );

  const linkClass = cn("group block", shell);

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
