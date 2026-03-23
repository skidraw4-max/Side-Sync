-- 지원 시 선택한 모집 포지션(기술 스택 라벨)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS tech_stack text;

COMMENT ON COLUMN public.applications.tech_stack IS '모집 공고(recruitment_status.role) 중 선택한 포지션명';

UPDATE public.applications
SET tech_stack = role
WHERE tech_stack IS NULL
  AND role IS NOT NULL
  AND trim(role) <> '';
