-- 칸반 컬럼(업무 단계)별 위키 조회를 위해 task_wiki_pages에 단계 키를 둡니다.
-- 업무(tasks.status) 변경 시 트리거로 동기화합니다.

ALTER TABLE public.task_wiki_pages
  ADD COLUMN IF NOT EXISTS associated_status text;

UPDATE public.task_wiki_pages AS w
SET associated_status = CASE
  WHEN t.status IN (
    'requested',
    'in_progress',
    'feedback',
    'completed',
    'on_hold'
  ) THEN t.status
  ELSE 'requested'
END
FROM public.tasks AS t
WHERE t.id = w.task_id
  AND (w.associated_status IS NULL OR w.associated_status = '');

UPDATE public.task_wiki_pages
SET associated_status = 'requested'
WHERE associated_status IS NULL OR trim(associated_status) = '';

ALTER TABLE public.task_wiki_pages
  ALTER COLUMN associated_status SET DEFAULT 'requested';

ALTER TABLE public.task_wiki_pages
  ALTER COLUMN associated_status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'task_wiki_pages_associated_status_check'
      AND conrelid = 'public.task_wiki_pages'::regclass
  ) THEN
    ALTER TABLE public.task_wiki_pages
      ADD CONSTRAINT task_wiki_pages_associated_status_check
      CHECK (
        associated_status IN (
          'requested',
          'in_progress',
          'feedback',
          'completed',
          'on_hold'
        )
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_task_wiki_pages_project_associated_status
  ON public.task_wiki_pages (project_id, associated_status);

COMMENT ON COLUMN public.task_wiki_pages.associated_status IS
  '칸반 컬럼(업무 단계) 키. tasks.status와 동기화되어 컬럼별 위키 목록에 사용됩니다.';

CREATE OR REPLACE FUNCTION public.sync_task_wiki_associated_status ()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    UPDATE public.task_wiki_pages
    SET
      associated_status = NEW.status,
      updated_at = now()
    WHERE task_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_sync_wiki_associated_status ON public.tasks;

CREATE TRIGGER tasks_sync_wiki_associated_status
  AFTER UPDATE OF status ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_task_wiki_associated_status ();

COMMENT ON FUNCTION public.sync_task_wiki_associated_status IS
  '업무 상태가 바뀌면 연결된 task_wiki_pages.associated_status를 맞춥니다.';

-- RPC: 위키 INSERT 시 신규 업무는 requested
CREATE OR REPLACE FUNCTION public.create_task_with_wiki (
  p_project_id uuid,
  p_title text,
  p_category text,
  p_priority text,
  p_assignee_id uuid,
  p_requested_by uuid,
  p_sort_order integer DEFAULT NULL,
  p_due_date date DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  task_rec public.tasks%ROWTYPE;
  wiki_rec public.task_wiki_pages%ROWTYPE;
  v_desc text;
  v_wiki_title text;
  v_wiki_body text;
BEGIN
  IF trim(p_title) = '' THEN
    RAISE EXCEPTION 'title_empty' USING ERRCODE = 'P0001';
  END IF;

  v_desc := CASE
    WHEN p_description IS NULL THEN NULL
    WHEN trim(p_description) = '' THEN NULL
    ELSE left(trim(p_description), 8000)
  END;

  INSERT INTO public.tasks (
    project_id,
    title,
    category,
    priority,
    status,
    assignee_id,
    requested_by,
    sort_order,
    due_date,
    description
  )
  VALUES (
    p_project_id,
    trim(p_title),
    coalesce(nullif(trim(p_category), ''), 'GENERAL'),
    p_priority,
    'requested',
    p_assignee_id,
    p_requested_by,
    coalesce(p_sort_order, 0),
    p_due_date,
    v_desc
  )
  RETURNING * INTO task_rec;

  v_wiki_title := trim(p_title) || ' — 위키';
  v_wiki_body :=
    E'# ' || trim(p_title)
    || E'\n\n## 개요\n'
    || coalesce(nullif(trim(coalesce(p_description, '')), ''), '(설명 없음)');

  INSERT INTO public.task_wiki_pages (task_id, project_id, title, body, associated_status)
  VALUES (task_rec.id, p_project_id, v_wiki_title, v_wiki_body, 'requested')
  RETURNING * INTO wiki_rec;

  RETURN jsonb_build_object(
    'task', to_jsonb(task_rec),
    'wiki', to_jsonb(wiki_rec)
  );
END;
$$;
