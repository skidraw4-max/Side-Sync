"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogoMark } from "@/components/BrandLogo";
import { useServerHydratedSession } from "@/contexts/AuthSessionContext";
import { useMyProjects } from "@/hooks/useMyProjects";
import { useProjectKanbanPreview, type KanbanPreviewTask } from "@/hooks/useProjectKanbanPreview";

function barClassForPriority(p: string): string {
  if (p === "high") return "bg-orange-500";
  if (p === "medium") return "bg-blue-500";
  return "bg-violet-500";
}

function MicroTaskCard({ task }: { task: KanbanPreviewTask }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-slate-200/90">
      <div className={`h-1 w-full ${barClassForPriority(task.priority)}`} />
      <div className="p-2">
        <p className="line-clamp-2 text-[9px] font-semibold leading-tight text-slate-800">{task.title}</p>
      </div>
    </div>
  );
}

function MicroPlaceholderCard({ barClass }: { barClass: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-slate-200/80">
      <div className={`h-1 w-full ${barClass}`} />
      <div className="space-y-1.5 p-2">
        <div className="h-1.5 w-[78%] rounded-sm bg-slate-200" />
        <div className="h-1 w-[55%] rounded-sm bg-slate-100" />
      </div>
    </div>
  );
}

function Column({
  label,
  tasks,
  placeholderBars,
  wikiSlot,
}: {
  label: string;
  tasks: KanbanPreviewTask[];
  placeholderBars: [string, string];
  wikiSlot?: ReactNode;
}) {
  const show = tasks.slice(0, 2);
  const fillers = Math.max(0, 2 - show.length);
  return (
    <div className="flex min-h-[180px] flex-col rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wide text-white/90">{label}</p>
      <div className="flex flex-1 flex-col gap-2">
        {show.map((t) => (
          <MicroTaskCard key={t.id} task={t} />
        ))}
        {fillers > 0
          ? Array.from({ length: fillers }).map((_, i) => (
              <MicroPlaceholderCard key={`ph-${i}`} barClass={placeholderBars[i] ?? placeholderBars[0]} />
            ))
          : null}
        {wikiSlot}
      </div>
    </div>
  );
}

/**
 * 벤토 우측: 로그인 시 내 프로젝트 선택 → 실제 칸반·위키 미리보기, 워크스페이스 이동
 * 비로그인: 안내 문구 + 로그인 링크
 */
export default function BentoWorkspaceKanban() {
  const session = useServerHydratedSession();
  const [userId, setUserId] = useState<string | null>(() => session?.user?.id ?? null);
  const { data: myProjects, isLoading: myLoading } = useMyProjects(userId ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
      return;
    }
    void createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, [session]);

  useEffect(() => {
    if (!myProjects?.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !myProjects.some((p) => p.id === selectedId)) {
      setSelectedId(myProjects[0].id);
    }
  }, [myProjects, selectedId]);

  const { data: preview, isFetching: previewLoading } = useProjectKanbanPreview(selectedId);

  const workspaceHref = selectedId ? `/projects/${selectedId}/workspace` : "/login";

  if (!userId) {
    return (
      <article
        className="flex h-full flex-col rounded-xl bg-[#141c2e] p-6 text-white shadow-[0_4px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/5"
        aria-labelledby="bento-kanban-heading"
      >
        <h2
          id="bento-kanban-heading"
          className="text-xs font-bold uppercase tracking-[0.18em] text-white md:text-sm"
        >
          Collaborate / Kanban
        </h2>
        <p className="mt-2 text-sm text-white/75">Micro-view of the Kanban board</p>
        <div className="mt-6 flex flex-1 flex-col justify-center rounded-xl border border-white/10 bg-white/5 p-4 text-center ring-1 ring-white/10">
          <p className="text-sm leading-relaxed text-white/85">
            Side-Sync 워크스페이스에서는 칸반, 공지, 채팅으로 팀과 함께 프로젝트를 진행할 수 있습니다. 로그인하면
            내 프로젝트를 선택해 보드를 미리 볼 수 있습니다.
          </p>
        </div>
        <Link
          href="/login"
          className="mt-4 inline-flex justify-center rounded-xl bg-white/10 py-2.5 text-center text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/[0.15]"
        >
          워크스페이스로 이동
        </Link>
      </article>
    );
  }

  return (
    <article
      className="flex h-full flex-col rounded-xl bg-[#141c2e] p-6 text-white shadow-[0_4px_24px_rgba(0,0,0,0.22)] ring-1 ring-white/5"
      aria-labelledby="bento-kanban-heading"
    >
      <h2
        id="bento-kanban-heading"
        className="text-xs font-bold uppercase tracking-[0.18em] text-white md:text-sm"
      >
        Collaborate / Kanban
      </h2>
      <p className="mt-2 text-sm text-white/75">Micro-view of the Kanban board</p>

      <div className="mt-3">
        <label htmlFor="bento-workspace-project" className="sr-only">
          워크스페이스 프로젝트 선택
        </label>
        {myLoading ? (
          <div className="h-10 animate-pulse rounded-xl bg-white/10" />
        ) : myProjects && myProjects.length > 0 ? (
          <select
            id="bento-workspace-project"
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="w-full rounded-xl border border-white/20 bg-[#0f1628] px-3 py-2 text-sm font-medium text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          >
            {myProjects.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.title}
              </option>
            ))}
          </select>
        ) : (
          <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/80">
            참여 중인 프로젝트가 없습니다. 프로젝트에 지원하거나 새로 만든 뒤 워크스페이스를 이용해 보세요.
          </p>
        )}
      </div>

      <div
        className={`mt-4 grid flex-1 grid-cols-3 gap-2 md:gap-3 ${previewLoading ? "opacity-70" : ""}`}
        aria-busy={previewLoading}
      >
        <Column
          label="To Do"
          tasks={preview?.todo ?? []}
          placeholderBars={["bg-violet-500", "bg-slate-300"]}
        />
        <Column
          label="Doing"
          tasks={preview?.doing ?? []}
          placeholderBars={["bg-orange-500", "bg-blue-500"]}
          wikiSlot={
            <div className="mt-auto rounded-xl border border-dashed border-white/70 bg-white/[0.07] px-2 py-2">
              <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/95">
                Wiki Links
              </p>
              <div className="mt-1 flex items-center justify-center gap-1">
                <BrandLogoMark size={24} className="opacity-95" />
                {preview && preview.wikiDoingCount > 0 ? (
                  <span className="text-[10px] font-bold text-sky-200">{preview.wikiDoingCount}</span>
                ) : null}
              </div>
            </div>
          }
        />
        <Column
          label="Done"
          tasks={preview?.done ?? []}
          placeholderBars={["bg-emerald-500", "bg-emerald-500"]}
        />
      </div>

      <Link
        href={myProjects && myProjects.length > 0 ? workspaceHref : "/projects/create"}
        className="mt-4 inline-flex justify-center rounded-xl bg-white/10 py-2.5 text-center text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/[0.15]"
      >
        워크스페이스로 이동
      </Link>
    </article>
  );
}
