-- 일부 DB에서 projects.updated_at이 없을 때 스키마를 맞추기 위한 안전 마이그레이션
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMENT ON COLUMN public.projects.updated_at IS '마지막 수정 시각 (선택)';
