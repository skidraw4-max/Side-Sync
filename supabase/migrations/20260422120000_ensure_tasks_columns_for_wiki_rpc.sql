-- 일부 DB에 tasks 마이그레이션이 누락된 경우 create_task_with_wiki INSERT 실패 방지
-- (예: column "due_date" of relation "tasks" does not exist)

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date date;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description text;
