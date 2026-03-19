"use client";

import { useState } from "react";
import ProjectDetailSidebar from "./ProjectDetailSidebar";
import ApplyModal from "./ApplyModal";

import type { TeamLeaderInfo } from "./ProjectDetailSidebar";

export interface ProjectDetailContentProps {
  projectId: string;
  projectTitle: string;
  category: string;
  subtitle: string;
  introduction: string;
  techStack: string[];
  /** profiles와 Join한 팀장 정보 (Success Rate, Manner Temp 포함) */
  teamLeader: TeamLeaderInfo | null;
}

const RECENT_PROJECTS = [
  { name: "Smart Waste Manager" },
  { name: "Eco-Route Finder" },
];

const RECRUITMENT_STATUS = [
  { role: "Frontend", count: "1/2", status: "HIRING", statusColor: "bg-[#2563EB]/10 text-[#2563EB]", barColor: "bg-[#2563EB]", barWidth: "50%" },
  { role: "UI Designer", count: "0/1", status: "URGENT", statusColor: "bg-orange-100 text-orange-600", barColor: "bg-orange-500", barWidth: "0%" },
  { role: "Backend", count: "1/1", status: "FILLED", statusColor: "bg-gray-100 text-gray-600", barColor: "bg-green-500", barWidth: "100%" },
];

export default function ProjectDetailContent({
  projectId,
  projectTitle,
  category,
  subtitle,
  introduction,
  techStack,
  teamLeader,
}: ProjectDetailContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Left: Project info */}
        <div className="flex-1">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <span className="inline-block rounded-xl bg-gray-100 px-3 py-1 text-xs font-medium text-[#2563EB]">
              {category}
            </span>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {projectTitle}
            </h1>
            <p className="mt-2 text-gray-500">{subtitle}</p>

            <div className="mt-8">
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">
                  Project Introduction
                </h2>
              </div>
              <p className="mt-4 text-gray-600 leading-relaxed">{introduction}</p>
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-[#2563EB]" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Technical Stack
                </h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sticky sidebar */}
        <ProjectDetailSidebar
          teamLeader={
            teamLeader ?? {
              name: "Unknown",
              role: "-",
              successRate: "-",
              mannerTemp: "-",
            }
          }
          recentProjects={RECENT_PROJECTS}
          onApplyClick={() => setIsModalOpen(true)}
        />
      </div>

      {/* Recruitment Status */}
      <div className="mt-10 rounded-xl bg-white p-8 shadow-sm">
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
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900">Recruitment Status</h2>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {RECRUITMENT_STATUS.map((item) => (
            <div key={item.role} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{item.role}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.statusColor}`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{item.count}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${item.barColor}`}
                  style={{ width: item.barWidth }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Apply Modal - Apply Now 클릭 시 지원 동기 입력 모달 */}
      {isModalOpen && (
        <ApplyModal
          projectTitle={projectTitle}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
