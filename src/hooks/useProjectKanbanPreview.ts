"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { KanbanTaskStatus } from "@/lib/kanban/constants";

export type KanbanPreviewTask = {
  id: string;
  title: string;
  status: KanbanTaskStatus;
  priority: string;
};

/** 칸반 미리보기: 팀원 RLS 하에서 tasks·위키 개요 조회 */
export function useProjectKanbanPreview(projectId: string | null) {
  return useQuery({
    queryKey: ["kanban-preview", projectId],
    queryFn: async (): Promise<{
      todo: KanbanPreviewTask[];
      doing: KanbanPreviewTask[];
      done: KanbanPreviewTask[];
      wikiDoingCount: number;
    }> => {
      if (!projectId) {
        return { todo: [], doing: [], done: [], wikiDoingCount: 0 };
      }
      const supabase = createClient();
      const { data: tasks, error: taskErr } = await supabase
        .from("tasks")
        .select("id,title,status,priority")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      if (taskErr) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[useProjectKanbanPreview] tasks:", taskErr.message);
        }
        return { todo: [], doing: [], done: [], wikiDoingCount: 0 };
      }

      const rows = (tasks ?? []) as KanbanPreviewTask[];
      const todo = rows.filter((t) => t.status === "requested" || t.status === "on_hold");
      const doing = rows.filter((t) => t.status === "in_progress" || t.status === "feedback");
      const done = rows.filter((t) => t.status === "completed");

      const { data: wikis } = await supabase
        .from("task_wiki_pages")
        .select("associated_status")
        .eq("project_id", projectId);

      const wikiDoingCount = (wikis ?? []).filter(
        (w: { associated_status: string }) =>
          w.associated_status === "in_progress" || w.associated_status === "feedback"
      ).length;

      return { todo, doing, done, wikiDoingCount };
    },
    enabled: !!projectId,
    staleTime: 20_000,
  });
}
