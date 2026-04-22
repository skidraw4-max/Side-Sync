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
  youtube_video_id: string | null;
  ingest_source: "mit" | "deepmind" | null;
};

function YouTubeGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
      fill="currentColor"
    >
      <path d="M23.5 6.2c-.3-1.1-1.1-1.9-2.2-2.2C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.3.5C1.6 4.3.8 5.1.5 6.2 0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1.1 1.1 1.9 2.2 2.2 1.8.5 9.3.5 9.3.5s7.5 0 9.3-.5c1.1-.3 1.9-1.1 2.2-2.2.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}

function AnnouncementArticle({
  item,
  canManage,
  onEdit,
  onDelete,
  variant,
}: {
  item: AnnouncementRow;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  variant: "guide" | "default" | "aiLab" | "aiTrend";
}) {
  const isGuide = variant === "guide";
  const isAiLab = variant === "aiLab";
  const isAiTrend = variant === "aiTrend";
  const cat = (item.category || "general").trim();
  const vid = item.youtube_video_id?.trim() || null;
  const embedSrc = vid ? `https://www.youtube.com/embed/${encodeURIComponent(vid)}` : null;

  const shellClass =
    isGuide
      ? "border border-emerald-200 ring-1 ring-emerald-100/70"
      : isAiLab
        ? "border border-violet-200 ring-1 ring-violet-100/60"
        : isAiTrend
          ? "border border-sky-200 ring-1 ring-sky-100/70"
          : "border border-slate-200";

  const catClass = isGuide
    ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
    : isAiLab
      ? "border border-violet-200 bg-violet-50 text-violet-800"
      : isAiTrend
        ? "border border-sky-200 bg-sky-50 text-sky-900"
        : "border border-slate-200 bg-slate-50 text-slate-600";

  const sourceBadge =
    item.ingest_source === "mit" ? (
      <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800">
        [MIT 연구]
      </span>
    ) : item.ingest_source === "deepmind" ? (
      <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-900">
        [DeepMind 공식]
      </span>
    ) : null;

  return (
    <article className={`rounded-2xl bg-white p-6 shadow-sm ${shellClass}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {item.pinned ? (
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
            고정
          </span>
        ) : null}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${catClass}`}
        >
          {cat || "general"}
        </span>
        <span className="ml-auto text-xs text-slate-500">{formatRelativeTime(item.created_at)}</span>
      </div>
      <h3 className="flex flex-wrap items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
        {vid ? (
          <span className="inline-flex shrink-0 text-red-600" title="YouTube">
            <YouTubeGlyph />
          </span>
        ) : null}
        {sourceBadge}
        <span className="min-w-0 flex-1 basis-[12rem]">{item.title}</span>
      </h3>
      <div
        className={`prose prose-slate mt-4 max-w-none text-slate-700 prose-p:leading-relaxed prose-p:text-[15px] prose-headings:font-semibold prose-a:text-blue-600 ${
          isGuide ? "prose-headings:text-slate-900" : ""
        }`}
      >
        {embedSrc ? (
          <div className="not-prose mb-5 aspect-video w-full overflow-hidden rounded-xl bg-slate-900 shadow-md ring-1 ring-slate-200/80">
            <iframe
              title={`YouTube: ${item.title}`}
              src={embedSrc}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : null}
        <p className="whitespace-pre-wrap">{item.content}</p>
        {item.ingest_source === "mit" ? (
          <p className="not-prose mt-6 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
            콘텐츠 출처: MIT OpenCourseWare (CC BY-NC-SA 적용)
          </p>
        ) : null}
      </div>
      {canManage ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            수정
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      ) : null}
    </article>
  );
}

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
      const data = (payload?.data ?? []) as Partial<AnnouncementRow>[];
      const queryError = !response.ok ? { message: payload?.error || "조회 실패" } : null;

      if (queryError) {
        setError(queryError.message);
        setRows([]);
      } else {
        setRows(
          (data ?? []).map((r) => ({
            ...r,
            youtube_video_id: r.youtube_video_id ?? null,
            ingest_source:
              r.ingest_source === "mit" || r.ingest_source === "deepmind" ? r.ingest_source : null,
          })) as AnnouncementRow[]
        );
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
      const raw = (payload?.data ?? []) as Partial<AnnouncementRow>[];
      setRows(
        raw.map((r) => ({
          ...r,
          youtube_video_id: r.youtube_video_id ?? null,
          ingest_source:
            r.ingest_source === "mit" || r.ingest_source === "deepmind" ? r.ingest_source : null,
        })) as AnnouncementRow[]
      );
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

  const sortedRows = [...rows].sort((a, b) => {
    const pin = Number(!!b.pinned) - Number(!!a.pinned);
    if (pin !== 0) return pin;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const catKey = (r: AnnouncementRow) => (r.category || "").toLowerCase().trim();

  const guideRows = sortedRows.filter((r) => catKey(r) === "guide");
  const aiLabRows = sortedRows.filter((r) => catKey(r) === "lab");
  const aiTrendRows = sortedRows.filter((r) => catKey(r) === "trend");
  const otherRows = sortedRows.filter((r) => {
    const c = catKey(r);
    return c !== "guide" && c !== "lab" && c !== "trend";
  });

  return (
    <main className="mx-auto min-h-[calc(100vh-160px)] w-full max-w-3xl px-4 py-10 md:max-w-4xl md:px-10">
      <header className="mb-10 border-b border-slate-200 pb-8">
        <p className="text-sm font-medium text-blue-600">Side-Sync 공지</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
          공지사항 · 가이드
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          서비스 업데이트와 정책 안내, 처음 오신 분을 위한 <strong className="font-semibold text-slate-800">이용 가이드</strong>를
          모았습니다. 관리자는 카테고리에 <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">guide</code>를
          넣으면 아래 &quot;가이드&quot; 묶음에 먼저 노출됩니다.
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
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-10 text-center">
          <p className="text-sm font-medium text-slate-700">등록된 공지사항이 없습니다.</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            샘플 가이드를 올릴 때는 제목에 &quot;시작하기&quot; 등을 쓰고, 카테고리를{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs ring-1 ring-slate-200">guide</code>로
            지정하면 방문자에게 먼저 보이기 좋습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {guideRows.length > 0 ? (
            <section aria-labelledby="announcements-guide-heading">
              <h2
                id="announcements-guide-heading"
                className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900"
              >
                <span
                  className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80"
                  aria-hidden
                >
                  Guide
                </span>
                이용 가이드
              </h2>
              <ul className="space-y-5 list-none p-0">
                {guideRows.map((item) => (
                  <li key={item.id}>
                    <AnnouncementArticle
                      item={item}
                      canManage={canManage}
                      onEdit={() => {
                        setEditing(item);
                        setTitle(item.title);
                        setContent(item.content);
                        setCategory(item.category || "general");
                        setPinned(!!item.pinned);
                      }}
                      onDelete={() => void onDelete(item.id)}
                      variant="guide"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {aiLabRows.length > 0 || aiTrendRows.length > 0 ? (
            <section aria-labelledby="announcements-ai-trend-heading" className="space-y-8">
              <h2
                id="announcements-ai-trend-heading"
                className="flex flex-wrap items-center gap-2 text-lg font-bold text-slate-900"
              >
                <span
                  className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white"
                  aria-hidden
                >
                  AI TREND
                </span>
                자동 요약 · 유튜브
              </h2>
              {aiLabRows.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-violet-900">
                    LAB — MIT OpenCourseWare
                  </h3>
                  <ul className="space-y-5 list-none p-0">
                    {aiLabRows.map((item) => (
                      <li key={item.id}>
                        <AnnouncementArticle
                          item={item}
                          canManage={canManage}
                          onEdit={() => {
                            setEditing(item);
                            setTitle(item.title);
                            setContent(item.content);
                            setCategory(item.category || "general");
                            setPinned(!!item.pinned);
                          }}
                          onDelete={() => void onDelete(item.id)}
                          variant="aiLab"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {aiTrendRows.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-sky-900">
                    TREND — Google DeepMind
                  </h3>
                  <ul className="space-y-5 list-none p-0">
                    {aiTrendRows.map((item) => (
                      <li key={item.id}>
                        <AnnouncementArticle
                          item={item}
                          canManage={canManage}
                          onEdit={() => {
                            setEditing(item);
                            setTitle(item.title);
                            setContent(item.content);
                            setCategory(item.category || "general");
                            setPinned(!!item.pinned);
                          }}
                          onDelete={() => void onDelete(item.id)}
                          variant="aiTrend"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {otherRows.length > 0 ? (
            <section aria-labelledby="announcements-rest-heading">
              <h2
                id="announcements-rest-heading"
                className="mb-4 text-lg font-bold text-slate-900"
              >
                전체 공지
              </h2>
              <ul className="space-y-5 list-none p-0">
                {otherRows.map((item) => (
                  <li key={item.id}>
                    <AnnouncementArticle
                      item={item}
                      canManage={canManage}
                      onEdit={() => {
                        setEditing(item);
                        setTitle(item.title);
                        setContent(item.content);
                        setCategory(item.category || "general");
                        setPinned(!!item.pinned);
                      }}
                      onDelete={() => void onDelete(item.id)}
                      variant="default"
                    />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
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
