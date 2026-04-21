-- 업무(task)당 1개의 위키 페이지를 연결하고, 생성 시 트랜잭션으로 함께 만듭니다.

CREATE TABLE IF NOT EXISTS public.task_wiki_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL UNIQUE REFERENCES public.tasks (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_wiki_pages_project_id ON public.task_wiki_pages (project_id);

COMMENT ON TABLE public.task_wiki_pages IS '업무와 1:1로 연결되는 프로젝트 위키 페이지(마크다운 본문)';

ALTER TABLE public.task_wiki_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_wiki_pages_select_policy" ON public.task_wiki_pages;
DROP POLICY IF EXISTS "task_wiki_pages_insert_policy" ON public.task_wiki_pages;
DROP POLICY IF EXISTS "task_wiki_pages_update_policy" ON public.task_wiki_pages;
DROP POLICY IF EXISTS "task_wiki_pages_delete_policy" ON public.task_wiki_pages;

CREATE POLICY "task_wiki_pages_select_policy"
  ON public.task_wiki_pages FOR SELECT
  USING (true);

CREATE POLICY "task_wiki_pages_insert_policy"
  ON public.task_wiki_pages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "task_wiki_pages_update_policy"
  ON public.task_wiki_pages FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "task_wiki_pages_delete_policy"
  ON public.task_wiki_pages FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Next.js 등에서 업무+위키를 단일 트랜잭션으로 생성 (Python 서비스와 동일 동작)
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

  INSERT INTO public.task_wiki_pages (task_id, project_id, title, body)
  VALUES (task_rec.id, p_project_id, v_wiki_title, v_wiki_body)
  RETURNING * INTO wiki_rec;

  RETURN jsonb_build_object(
    'task', to_jsonb(task_rec),
    'wiki', to_jsonb(wiki_rec)
  );
END;
$$;

COMMENT ON FUNCTION public.create_task_with_wiki IS
  '업무 행과 연결된 task_wiki_pages 행을 한 트랜잭션으로 생성합니다.';

GRANT EXECUTE ON FUNCTION public.create_task_with_wiki (
  uuid,
  text,
  text,
  text,
  uuid,
  uuid,
  integer,
  date,
  text
) TO authenticated;
