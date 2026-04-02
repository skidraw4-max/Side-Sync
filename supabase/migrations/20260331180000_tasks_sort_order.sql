-- 칸반 컬럼 내 순서 (Phase 2)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tasks_project_status_sort
  ON public.tasks (project_id, status, sort_order);

-- 기존 행: 프로젝트·상태별 created_at 순으로 0,1,2,… 부여
WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (PARTITION BY project_id, status ORDER BY created_at ASC) - 1)::integer AS ord
  FROM public.tasks
)
UPDATE public.tasks AS t
SET sort_order = ranked.ord
FROM ranked
WHERE t.id = ranked.id;
