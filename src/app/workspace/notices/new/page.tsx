import type { Metadata } from "next";
import Link from "next/link";
import WorkspaceHeader from "@/components/WorkspaceHeader";

export const metadata: Metadata = {
  title: "공지 작성",
  description:
    "워크스페이스에 새 공지를 작성하는 UI 예시 페이지입니다. 프로젝트별 공지는 해당 프로젝트 워크스페이스에서 관리합니다.",
  robots: { index: false, follow: true },
};

const CATEGORIES = [
  { id: "general", label: "General", icon: "circle", active: false },
  { id: "update", label: "Update", icon: "circle", active: false },
  { id: "social", label: "Social", icon: "circle", active: false },
  { id: "urgent", label: "Urgent", icon: "circle", active: true },
];

export default function CreateNoticePage() {
  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <WorkspaceHeader activeNav="notices" />
      {/* 헤더와 카드 섹션 간격 동일 */}
      <main className="flex flex-col items-center px-6 py-16">
        <div className="w-full max-w-2xl rounded-2xl bg-white p-10 shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900">Create New Notice</h1>
          <p className="mt-2 text-sm text-gray-500">
            Share important updates and announcements with your workspace team.
          </p>

          {/* Notice Title */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-900">
              Notice Title
            </label>
            <input
              type="text"
              placeholder="e.g. Q4 Strategy Meeting Rescheduled"
              className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Category */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-900">
              Category
            </label>
            <div className="mt-3 flex flex-wrap gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    cat.active
                      ? "bg-red-500 text-white border border-red-500"
                      : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${cat.active ? "bg-white" : "bg-gray-500"}`} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content - Rich text editor */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-900">
              Content
            </label>
            {/* Toolbar */}
            <div className="mt-2 flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-gray-200 bg-gray-50 p-2">
              {["bold", "italic", "list", "numbered", "indent", "outdent", "link", "file", "image"].map((tool) => (
                <button
                  key={tool}
                  type="button"
                  className="rounded p-2 text-gray-600 hover:bg-gray-200"
                >
                  {tool === "bold" && <span className="text-sm font-bold">B</span>}
                  {tool === "italic" && <span className="text-sm italic">I</span>}
                  {tool === "list" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  )}
                  {tool === "numbered" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 8h11M10 12h11M10 16h11M4 8h1v4M4 16v-4h2l1 4" />
                    </svg>
                  )}
                  {tool === "indent" && <span className="text-xs">≡</span>}
                  {tool === "outdent" && <span className="text-xs">≡</span>}
                  {tool === "link" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  )}
                  {tool === "file" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                  {tool === "image" && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Write your notice details here... Use the toolbar above for formatting."
              rows={8}
              className="w-full resize-none rounded-b-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Checkbox */}
          <label className="mt-6 flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
            />
            <span className="text-sm text-gray-700">
              Send email notification to all workspace members
            </span>
          </label>

          {/* Actions */}
          <div className="mt-12 flex justify-end gap-4">
            <Link
              href="/workspace/files"
              className="rounded-lg px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
            >
              Post Notice
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </main>
      {/* Footer - 헤더와 동일한 간격 */}
      <footer className="flex items-center justify-between border-t border-gray-100 bg-white px-8 py-6">
        <p className="text-sm text-gray-500">Side-Sync © 2024 Workspace Management System</p>
        <nav className="flex gap-6">
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Documentation</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Support</a>
          <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacy Policy</a>
        </nav>
      </footer>
    </div>
  );
}
