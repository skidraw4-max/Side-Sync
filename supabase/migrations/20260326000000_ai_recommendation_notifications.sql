-- AI 매칭 추천 알림용 메타데이터
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS is_ai_recommendation boolean NOT NULL DEFAULT false;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS ai_comment text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS source_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_ai_user
  ON public.notifications (user_id, is_ai_recommendation, created_at DESC);

COMMENT ON COLUMN public.notifications.is_ai_recommendation IS 'Stitch/LLM 기반 프로젝트 매칭 추천 여부';
COMMENT ON COLUMN public.notifications.ai_comment IS 'LLM이 생성한 설득형 추천 코멘트';
COMMENT ON COLUMN public.notifications.source_project_id IS '추천 대상 프로젝트 (중복 방지·필터용)';

-- 프로필 대표 스택 (모집 포지션 role 문자열과 매칭)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_stack text;

COMMENT ON COLUMN public.profiles.primary_stack IS 'AI 매칭용 대표 기술/포지션 라벨 (예: React, Backend)';
