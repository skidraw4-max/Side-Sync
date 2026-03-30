-- 매너 온도 보너스 중복 방지: 프로젝트·유저·사유 단위로 1회만 적용
CREATE TABLE IF NOT EXISTS public.manner_temp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('accept_bonus', 'completed_bonus')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id, reason)
);

CREATE INDEX IF NOT EXISTS manner_temp_logs_user_id_idx ON public.manner_temp_logs (user_id);
CREATE INDEX IF NOT EXISTS manner_temp_logs_project_id_idx ON public.manner_temp_logs (project_id);

ALTER TABLE public.manner_temp_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.manner_temp_logs IS '프로젝트별 매너 온도 보너스(승인/완료) 1회 적용 기록 — 서비스 롤 API에서만 쓰기';
