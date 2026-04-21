"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { WORKSPACE } from "@/lib/constants/contents";
import type { KanbanTaskWithAssignee } from "@/types/kanban";

export interface TaskWikiRow {
  id: string;
  task_id: string;
  project_id: string;
  title: string;
  body: string;
  associated_status?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskWikiLinkProps {
  projectId: string;
  /** 저장된 업무 기준(위키 생성·AI 맥락). 편집 중인 초안과 다를 수 있음 */
  task: Pick<KanbanTaskWithAssignee, "id" | "title" | "description">;
}

function previewTextFromBody(body: string, maxLen = 220): string {
  const flat = body
    .replace(/^#+\s+.*/gm, "")
    .replace(/[*_`#]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  if (!flat) return "";
  return flat.length > maxLen ? `${flat.slice(0, maxLen)}…` : flat;
}

export default function TaskWikiLink({ projectId, task }: TaskWikiLinkProps) {
  const [wiki, setWiki] = useState<TaskWikiRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}/wiki`, {
        credentials: "same-origin",
      });
      const json = (await res.json().catch(() => ({}))) as {
        wiki?: TaskWikiRow | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "load failed");
      }
      setWiki(json.wiki ?? null);
    } catch {
      toast.error(WORKSPACE.taskWikiLoadFailed);
      setWiki(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, task.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const preview = useMemo(() => (wiki?.body ? previewTextFromBody(wiki.body) : ""), [wiki?.body]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const useAi = Boolean(task.description?.trim());
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}/wiki`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ generate_ai: useAi }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        wiki?: TaskWikiRow;
        wiki_ai_applied?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(json.error ?? "create failed");
      }
      if (json.wiki) {
        setWiki(json.wiki);
        if (json.wiki_ai_applied) {
          toast.success(WORKSPACE.taskWikiCreatedWithAi);
        } else {
          toast.success(WORKSPACE.taskWikiCreated);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : WORKSPACE.taskWikiCreateFailed);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = () => {
    if (!wiki) return;
    setDraftTitle(wiki.title);
    setDraftBody(wiki.body);
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!wiki) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task.id}/wiki`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ title: draftTitle, body: draftBody }),
      });
      const json = (await res.json().catch(() => ({}))) as { wiki?: TaskWikiRow; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "save failed");
      }
      if (json.wiki) {
        setWiki(json.wiki);
        setEditing(false);
        toast.success(WORKSPACE.taskWikiSaved);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : WORKSPACE.taskWikiSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4">
      <h4 className="text-sm font-semibold text-gray-900">{WORKSPACE.taskWikiSectionTitle}</h4>
      <p className="mt-1 text-xs text-gray-500">{WORKSPACE.taskWikiSectionHint}</p>

      {loading ? (
        <div className="mt-3 h-16 animate-pulse rounded-xl bg-gray-200/80" aria-hidden />
      ) : !wiki ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
            className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {creating ? WORKSPACE.taskWikiCreating : WORKSPACE.taskWikiCreateButton}
          </button>
          {task.description?.trim() ? (
            <p className="mt-2 text-xs text-gray-600">{WORKSPACE.taskWikiAiHint}</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {!editing ? (
            <>
              <p className="text-sm font-medium text-gray-900">{wiki.title}</p>
              {preview ? (
                <p className="line-clamp-3 text-xs leading-relaxed text-gray-600">{preview}</p>
              ) : (
                <p className="text-xs text-gray-400">{WORKSPACE.taskWikiEmptyPreview}</p>
              )}
              <button
                type="button"
                onClick={openEdit}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                {WORKSPACE.taskWikiEdit}
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">
                {WORKSPACE.taskWikiTitleLabel}
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <label className="mt-2 block text-xs font-medium text-gray-700">
                {WORKSPACE.taskWikiBodyLabel}
              </label>
              <textarea
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={12}
                maxLength={64000}
                className="w-full resize-y rounded-xl border border-gray-300 px-3 py-2 font-mono text-xs leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {WORKSPACE.taskWikiEditCancel}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveEdit()}
                  disabled={saving || !draftTitle.trim()}
                  className="rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  {saving ? WORKSPACE.taskWikiSaving : WORKSPACE.taskWikiEditSave}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
