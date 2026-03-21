import Link from "next/link";

/** 프로젝트 카드 필수 Props */
export interface ProjectCardProps {
  /** 프로젝트 제목 */
  title: string;
  /** 기술 스택 태그 목록 */
  techStack: string[];
  /** 매너 온도 (예: "36.5°C") */
  mannerTemperature: string;
  /** 상세 페이지 링크용 ID (있으면 Link로 렌더) */
  id?: string;
  /** 프로젝트 설명 (선택) */
  description?: string;
  /** 카드 상단 그라데이션 Tailwind 클래스 (선택) */
  gradient?: string;
  /** 참여 중인 내 프로젝트: View Details 아래 워크스페이스 이동 버튼 표시 */
  showWorkspaceLink?: boolean;
}

export default function ProjectCard({
  title,
  techStack,
  mannerTemperature,
  id,
  description = "",
  gradient = "from-blue-200 via-indigo-200 to-purple-200",
  showWorkspaceLink = false,
}: ProjectCardProps) {
  const gradientBlock = (
    <div className={`relative h-24 bg-gradient-to-br ${gradient} px-4 pt-3`}>
      <div className="absolute right-4 top-3 flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-gray-600 shadow-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
        </svg>
        <span className="text-xs font-medium text-gray-700">{mannerTemperature}</span>
      </div>
    </div>
  );

  const titleAndTags = (
    <>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 line-clamp-2 text-sm text-gray-500">
          {description}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {techStack.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700"
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );

  const cardShell =
    "overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl";

  /** 참여 중 프로젝트: 카드 전체 링크 대신 버튼 두 개 (상세 / 워크스페이스) */
  if (id && showWorkspaceLink) {
    return (
      <article className={cardShell}>
        {gradientBlock}
        <div className="p-5">{titleAndTags}</div>
        <div className="border-t border-gray-100 px-5 pb-5">
          <Link
            href={`/projects/${id}`}
            className="block w-full rounded-lg border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            View Details
          </Link>
          <Link
            href={`/projects/${id}/workspace/tasks`}
            className="mt-2 block w-full rounded-lg bg-[#2563EB] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
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
      <div className="p-5">
        {titleAndTags}
        <span className="mt-4 block w-full rounded-lg border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors group-hover:bg-gray-50">
          View Details
        </span>
      </div>
    </>
  );

  const className = `group block ${cardShell}`;

  if (id) {
    return (
      <Link href={`/projects/${id}`} className={className}>
        {content}
      </Link>
    );
  }

  return <article className={className}>{content}</article>;
}
