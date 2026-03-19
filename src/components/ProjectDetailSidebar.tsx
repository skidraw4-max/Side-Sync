"use client";

export interface TeamLeaderInfo {
  name: string;
  role: string;
  avatarUrl?: string;
  successRate: string;
  mannerTemp: string;
}

export interface RecentProject {
  name: string;
}

export interface ProjectDetailSidebarProps {
  /** 팀장 정보 */
  teamLeader: TeamLeaderInfo;
  /** 최근 프로젝트 목록 */
  recentProjects: RecentProject[];
  /** 모달 열림 상태 setter - Apply Now 클릭 시 호출 */
  onApplyClick: () => void;
}

export default function ProjectDetailSidebar({
  teamLeader,
  recentProjects,
  onApplyClick,
}: ProjectDetailSidebarProps) {
  return (
    <aside className="w-full space-y-6 lg:w-96">
      {/* 팀장 정보 섹션 - sticky */}
      <div className="sticky top-6 rounded-xl bg-white p-6 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Team Leader
        </h3>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 rounded-full bg-gray-200" />
          <div>
            <p className="font-semibold text-gray-900">{teamLeader.name}</p>
            <p className="text-sm text-gray-500">{teamLeader.role}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Success Rate {teamLeader.successRate}
          </span>
          <span className="flex items-center gap-1.5 text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            </svg>
            Manner Temp {teamLeader.mannerTemp}
          </span>
        </div>
        <button
          type="button"
          onClick={onApplyClick}
          className="mt-6 w-full rounded-xl bg-[#2563EB] py-3 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
        >
          ➤ Apply Now (지원하기)
        </button>
      </div>

      {/* Recent Projects */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Recent Projects
          </h3>
          <span className="text-xs text-gray-400">{recentProjects.length} TOTAL</span>
        </div>
        <ul className="mt-4 space-y-3">
          {recentProjects.map((project) => (
            <li
              key={project.name}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
              {project.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Recruitment Info */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-500"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Recruitment Info</h3>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          팀 인터뷰는 지원서 접수 후 1주일 이내 진행됩니다. 합격자에게는
          이메일로 통보됩니다.
        </p>
      </div>
    </aside>
  );
}
