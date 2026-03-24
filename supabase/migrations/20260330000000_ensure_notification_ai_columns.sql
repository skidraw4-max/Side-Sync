-- 운영 DB에 AI 알림 컬럼이 없어 notifications select 시 400이 나는 경우 대비 (멱등)
-- 내용은 20260326000000_ai_recommendation_notifications.sql 과 동일·안전하게 IF NOT EXISTS

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_ai_recommendation boolean NOT NULL DEFAULT false;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS ai_comment text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS source_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_ai_user
  ON public.notifications (user_id, is_ai_recommendation, created_at DESC);
