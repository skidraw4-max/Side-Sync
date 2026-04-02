-- Phase 3: 업무 상세 설명 + 수정 시 updated_at 자동 갱신
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN public.tasks.description IS '칸반 업무 상세 설명 (선택)';

CREATE OR REPLACE FUNCTION public.tasks_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_set_updated_at ON public.tasks;
CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.tasks_set_updated_at();
