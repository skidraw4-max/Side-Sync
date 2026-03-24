"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/relative-time";
import { toast } from "sonner";

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  created_at: string;
};

export default function AnnouncementsPage() {
  const ADMIN_EMAIL = "skidraw4@gmail.com";
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [editing, setEditing] = useState<AnnouncementRow | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    async function fetchAnnouncements() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCanManage((user?.email ?? "").toLowerCase() === ADMIN_EMAIL);

      const response = await fetch("/api/announcements", { cache: "no-store" });
      const payload = await response.json();
      const data = (payload?.data ?? []) as AnnouncementRow[];
      const queryError = !response.ok ? { message: payload?.error || "조회 실패" } : null;

      if (queryError) {
        setError(queryError.message);
        setRows([]);
      } else {
        setRows((data ?? []) as AnnouncementRow[]);
      }
      setIsLoading(false);
    }

    void fetchAnnouncements();
  }, []);

  const refresh = async () => {
    setIsLoading(true);
    const response = await fetch("/api/announcements", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error || "조회 실패");
      setRows([]);
    } else {
      setRows((payload?.data ?? []) as AnnouncementRow[]);
      setError(null);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setContent("");
    setCategory("general");
    setPinned(false);
  };

  const onSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("제목과 내용을 입력해주세요.");
      return;
    }

    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/announcements/${editing.id}` : "/api/announcements";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category, pinned }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload?.error || "저장에 실패했습니다.");
      return;
    }
    toast.success(editing ? "수정되었습니다." : "등록되었습니다.");
    resetForm();
    await refresh();
  };

  const onDelete = async (id: string) => {
    if (!confirm("공지사항을 삭제하시겠습니까?")) return;
    const response = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(payload?.error || "삭제에 실패했습니다.");
      return;
    }
    toast.success("삭제되었습니다.");
    await refresh();
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-160px)] w-full max-w-4xl px-4 py-10 md:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-blue-600">Side-Sync 공지</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">전체 공지사항</h1>
        <p className="mt-2 text-sm text-slate-600">
          서비스 전반에 대한 업데이트와 안내를 확인할 수 있습니다.
        </p>
        {canManage ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => resetForm()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              공지 작성
            </button>
          </div>
        ) : null}
      </header>

      {canManage ? (
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            {editing ? "공지 수정" : "공지 작성"}
          </h2>
          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="카테고리"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="내용"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
            />
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
              상단 고정
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void onSubmit()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                {editing ? "수정 저장" : "등록"}
              </button>
              {editing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700"
                >
                  취소
                </button>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          공지사항을 불러오지 못했습니다: {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          등록된 공지사항이 없습니다.
        </div>
      ) : (
        <section className="space-y-4">
          {rows.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                {item.pinned ? (
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    고정
                  </span>
                ) : null}
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {(item.category || "general").toUpperCase()}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  {formatRelativeTime(item.created_at)}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {item.content}
              </p>
              {canManage ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(item);
                      setTitle(item.title);
                      setContent(item.content);
                      setCategory(item.category || "general");
                      setPinned(!!item.pinned);
                    }}
                    className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-700"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(item.id)}
                    className="rounded-md border border-red-200 px-2.5 py-1 text-xs text-red-600"
                  >
                    삭제
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      )}

      <div className="mt-10">
        <Link
          href="/"
          className="inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
