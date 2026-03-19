import Link from "next/link";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";

const FILES = [
  {
    name: "Project_Proposal_v2.pdf",
    type: "PDF DOCUMENT",
    size: "2.4 MB",
    date: "Oct 25, 2023",
    uploader: "Alex Kim",
    iconColor: "text-red-500",
  },
  {
    name: "Design_Mockup_Final.png",
    type: "IMAGE PNG",
    size: "1.2 MB",
    date: "Oct 24, 2023",
    uploader: "Sarah Lee",
    iconColor: "text-blue-500",
  },
  {
    name: "Budget_Spreadsheet.xlsx",
    type: "SPREADSHEET",
    size: "856 KB",
    date: "Oct 23, 2023",
    uploader: "Alex Kim",
    iconColor: "text-green-600",
  },
  {
    name: "Meeting_Notes_Oct22.docx",
    type: "DOCUMENT",
    size: "124 KB",
    date: "Oct 22, 2023",
    uploader: "Mike Park",
    iconColor: "text-blue-500",
  },
];

function FileIcon({ type, className }: { type: string; className: string }) {
  if (type.includes("PDF")) {
    return (
      <svg className={`h-8 w-8 shrink-0 ${className}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM9 13h2v2H9v-2zm0-3h2v2H9v-2zm0-3h2v2H9V7zm4 9H9v-2h4v2zm2-3h-2v2h2v-2zm0-3h-2v2h2v-2zm0-3h-2v2h2V7z" />
      </svg>
    );
  }
  if (type.includes("IMAGE") || type.includes("PNG")) {
    return (
      <svg className={`h-8 w-8 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    );
  }
  if (type.includes("SPREADSHEET")) {
    return (
      <svg className={`h-8 w-8 shrink-0 ${className}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4zM8 13h8v2H8v-2zm0 4h8v2H8v-2zm0-8h2v2H8V9z" />
      </svg>
    );
  }
  return (
    <svg className={`h-8 w-8 shrink-0 ${className}`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2 5 5h-5V4z" />
    </svg>
  );
}

export default function WorkspaceFilesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <WorkspaceSidebar activeItem="files" />
      <div className="flex flex-1 flex-col">
        {/* 상단 breadcrumb & search */}
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/workspace/files" className="flex items-center gap-2 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Files
            </Link>
            <span>›</span>
            <span>Workspace</span>
            <span>›</span>
            <span className="text-gray-900">Project Documentation</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search files..." className="w-48 bg-transparent text-sm placeholder:text-gray-400 focus:outline-none" />
            </div>
            <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </button>
          </div>
        </header>

        {/* 메인 콘텐츠 - 헤더와 카드 섹션 간격 동일 */}
        <main className="flex-1 p-8">
          {/* Workspace Files 헤더 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Workspace Files</h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload, manage, and share documents with your team members in real-time.
            </p>
            <button
              type="button"
              className="mt-4 flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload File
            </button>
          </div>

          {/* 파일 테이블 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">File Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Size</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Uploaded Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Uploader</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {FILES.map((file) => (
                  <tr key={file.name} className="border-b border-gray-50 transition-colors hover:bg-gray-50/50 last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileIcon type={file.type} className={file.iconColor} />
                        <span className="text-sm font-medium text-gray-900">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {file.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{file.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{file.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gray-200" />
                        <span className="text-sm text-gray-600">{file.uploader}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="6" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="18" r="1.5" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">Showing 4 files</p>
              <div className="flex gap-2">
                <button disabled className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-400">
                  Previous
                </button>
                <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* 정보 카드 - 테이블과 카드 섹션 간 넓은 간격 */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2563EB]/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Storage Usage</h3>
              </div>
              <p className="mt-4 text-sm text-gray-600">4.2 GB of 10 GB used</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-[42%] rounded-full bg-[#2563EB]" />
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Shared Links</h3>
              </div>
              <p className="mt-4 text-sm text-gray-600">12 Active public links</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
                    <path d="m7 17 5-5-5-5" />
                    <path d="m17 7-5 5 5 5" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <p className="mt-4 text-sm text-gray-600">3 files updated today</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
