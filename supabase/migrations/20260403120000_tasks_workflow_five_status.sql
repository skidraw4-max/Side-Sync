-- 업무 5단계: 요청·진행·피드백·완료·보류 + 요청자(requested_by) + 상태 전환 코멘트(task_comments)

-- 1) 기존 status CHECK 제거 후 값 매핑
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

UPDATE public.tasks
SET status = CASE status
  WHEN 'todo' THEN 'requested'
  WHEN 'doing' THEN 'in_progress'
  WHEN 'done' THEN 'completed'
  ELSE status
END
WHERE status IN ('todo', 'doing', 'done');

-- 2) 요청자(완료 승인 기준)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.tasks t
SET requested_by = p.team_leader_id
FROM public.projects p
WHERE p.id = t.project_id
  AND t.requested_by IS NULL
  AND p.team_leader_id IS NOT NULL;

COMMENT ON COLUMN public.tasks.requested_by IS '업무 요청자(완료 처리 권한). 신규 행은 API가 등록자로 설정';

-- 3) 새 status 제약
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check CHECK (
    status IN (
      'requested',
      'in_progress',
      'feedback',
      'completed',
      'on_hold'
    )
  );

ALTER TABLE public.tasks ALTER COLUMN status SET DEFAULT 'requested';

-- 4) 전환 코멘트
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  transition text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_project_id ON public.task_comments(project_id);

COMMENT ON TABLE public.task_comments IS '피드백·보류 등 상태 전환 시 필수 코멘트 저장';

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_comments_select_policy" ON public.task_comments;
DROP POLICY IF EXISTS "task_comments_insert_policy" ON public.task_comments;

CREATE POLICY "task_comments_select_policy"
  ON public.task_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "task_comments_insert_policy"
  ON public.task_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);
