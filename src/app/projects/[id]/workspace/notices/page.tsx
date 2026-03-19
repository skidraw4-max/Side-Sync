"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import EmptyState from "@/components/EmptyState";

interface NoticeWithAuthor {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id: string;
  pinned: boolean;
  created_at: string;
  author: { full_name: string | null; avatar_url: string | null } | null;
}

const CATEGORIES = [
  { value: "urgent", label: "Urgent" },
  { value: "update", label: "Update" },
  { value: "general", label: "General" },
  { value: "event", label: "Event" },
];

const CATEGORY_STYLES: Record<string, string> = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  update: "bg-blue-100 text-blue-800 border-blue-200",
  general: "bg-gray-100 text-gray-800 border-gray-200",
  event: "bg-green-100 text-green-800 border-green-200",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NoticesPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [notices, setNotices] = useState<NoticeWithAuthor[]>([]);
  const [projectTitle, setProjectTitle] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "pinned" | "archive">("all");
  const [isLoading, setIsLoading] = useState(true);

  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formPinned, setFormPinned] = useState(false);
  const [formSendEmail, setFormSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotices = useCallback(async () => {
    const supabase = createClient();
    const { data: noticesData } = await supabase
      .from("notices")
      .select("id, title, content, category, author_id, pinned, created_at")
      .eq("project_id", projectId)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    const { data: project } = await supabase
      .from("projects")
      .select("title")
      .eq("id", projectId)
      .single();

    if (project) setProjectTitle(project.title);

    const authorIds = [...new Set((noticesData ?? []).map((n) => n.author_id))];
    const { data: profiles } = authorIds.length
      ? await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds)
      : { data: [] };

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
    );

    setNotices(
      (noticesData ?? []).map((n) => ({
        ...n,
        author: profileMap.get(n.author_id) ?? null,
      }))
    );
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const filteredNotices = notices.filter((n) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false;
    }
    if (activeTab === "pinned") return n.pinned;
    return true;
  });

  const handlePublish = async () => {
    if (!formTitle.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("로그인이 필요합니다.");
      setIsSubmitting(false);
      return;
    }

    const { data: notice, error: noticeError } = await supabase
      .from("notices")
      .insert({
        project_id: projectId,
        title: formTitle.trim(),
        content: formContent.trim() || " ",
        category: formCategory,
        author_id: user.id,
        pinned: formPinned,
        send_email: formSendEmail,
      })
      .select("id")
      .single();

    if (noticeError) {
      toast.error(noticeError.message);
      setIsSubmitting(false);
      return;
    }

    const { data: project } = await supabase
      .from("projects")
      .select("team_leader_id, title")
      .eq("id", projectId)
      .single();

    const memberIds = new Set<string>();
    if (project?.team_leader_id) memberIds.add(project.team_leader_id);
    const { data: acceptedApps } = await supabase
      .from("applications")
      .select("applicant_id")
      .eq("project_id", projectId)
      .eq("status", "accepted");
    (acceptedApps ?? []).forEach((a) => memberIds.add(a.applicant_id));

    const notificationsToInsert = [...memberIds]
      .filter((id) => id !== user.id)
      .map((userId) => ({
        user_id: userId,
        title: "새 공지사항 📢",
        message: `[${project?.title || "프로젝트"}] 새로운 공지사항이 게시되었습니다: ${formTitle.trim()}`,
        link: `/projects/${projectId}/workspace/notices`,
      }));

    if (notificationsToInsert.length > 0) {
      await supabase.from("notifications").insert(notificationsToInsert);
    }

    toast.success("공지사항이 게시되었습니다.");
    setFormTitle("");
    setFormContent("");
    setFormCategory("general");
    setFormPinned(false);
    setShowForm(false);
    fetchNotices();
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setFormTitle("");
    setFormContent("");
    setFormCategory("general");
    setFormPinned(false);
    setFormSendEmail(true);
    setShowForm(false);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-10 flex shrink-0 flex-col gap-4 border-b border-gray-100 bg-white px-8 py-4">
        <nav className="text-sm text-gray-500">
          <a href={`/projects/${projectId}/workspace`} className="hover:text-gray-700">
            Workspace
          </a>
          <span className="mx-2">›</span>
          <span className="text-gray-900">Notices</span>
          {showForm && (
            <>
              <span className="mx-2">›</span>
              <span className="text-gray-900">Create New</span>
            </>
          )}
        </nav>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {showForm ? "Create Notice" : "Notices"}
            </h1>
            <p className="mt-1 text-gray-500">
              {showForm
                ? "Publish a new update to keep your team informed and aligned."
                : "Stay updated with the latest project announcements and updates."}
            </p>
          </div>
          <div className="flex gap-2">
            {!showForm ? (
              <>
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Mark all as read
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  글쓰기
                </button>
              </>
            ) : null}
          </div>
        </div>

        {!showForm && (
          <>
            <div className="flex max-w-md items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
            </div>
            <div className="flex gap-4 border-b border-gray-100">
              {(["all", "unread", "pinned", "archive"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? "border-b-2 border-[#2563EB] text-[#2563EB]"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-8">
        {showForm ? (
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notice Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Q4 Strategy Update or Server Maintenance"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setFormCategory(c.value)}
                        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                          formCategory === c.value
                            ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {formCategory === c.value && (
                          <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
                        )}
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    placeholder="Write your notice here..."
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={8}
                    className="mt-2 w-full resize-y rounded-lg border border-gray-200 px-4 py-3 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  <div>
                    <p className="font-medium text-gray-900">Pin this notice</p>
                    <p className="text-sm text-gray-500">Pinned notices appear at the top of the feed</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormPinned((p) => !p)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      formPinned ? "bg-[#2563EB]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        formPinned ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                  <div>
                    <p className="font-medium text-gray-900">Send email notification</p>
                    <p className="text-sm text-gray-500">Notify all team members via email immediately</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormSendEmail((e) => !e)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      formSendEmail ? "bg-[#2563EB]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        formSendEmail ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    Discard Draft
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={isSubmitting}
                      className="rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-70"
                    >
                      {isSubmitting ? "게시 중..." : "Publish Notice"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-4 rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/5 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
                i
              </div>
              <div>
                <p className="font-medium text-gray-900">Notice Visibility</p>
                <p className="mt-1 text-sm text-gray-600">
                  By publishing, this notice will be visible to all members of the{" "}
                  <strong>{projectTitle || "project"}</strong> workspace. You can edit or delete
                  this notice at any time after publication.
                </p>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="py-16">
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-gray-100 bg-gray-100"
                />
              ))}
            </div>
          </div>
        ) : filteredNotices.length === 0 ? (
          <EmptyState
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            }
            title="공지사항이 없습니다"
            description="팀원들에게 첫 공지를 올려보세요!"
            actions={[
              { label: "첫 공지 작성하기", onClick: () => setShowForm(true), primary: true },
            ]}
          />
        ) : (
          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className="relative rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                {notice.pinned && (
                  <span className="absolute right-4 top-4 flex items-center gap-1 rounded-md bg-[#2563EB]/10 px-2 py-1 text-xs font-medium text-[#2563EB]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                    </svg>
                    PINNED
                  </span>
                )}
                <div className="flex gap-4">
                  {notice.author?.avatar_url ? (
                    <img
                      src={notice.author.avatar_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                      {(notice.author?.full_name?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{notice.title}</h2>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CATEGORY_STYLES[notice.category] ?? CATEGORY_STYLES.general}`}
                      >
                        {notice.category.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {notice.author?.full_name ?? "Unknown"} • {formatDate(notice.created_at)}
                    </p>
                    <p className="mt-3 line-clamp-3 text-gray-600">
                      {notice.content.replace(/\n/g, " ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-center pt-4">
              <button
                type="button"
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Load older notices
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
