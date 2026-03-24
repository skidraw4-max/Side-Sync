"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/relative-time";

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  created_at: string;
};

export default function AnnouncementsPage() {
  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncements() {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("announcements")
        .select("id, title, content, category, pinned, created_at")
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });

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

  return (
    <main className="mx-auto min-h-[calc(100vh-160px)] w-full max-w-4xl px-4 py-10 md:px-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-blue-600">Side-Sync 공지</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">전체 공지사항</h1>
        <p className="mt-2 text-sm text-slate-600">
          서비스 전반에 대한 업데이트와 안내를 확인할 수 있습니다.
        </p>
      </header>

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
