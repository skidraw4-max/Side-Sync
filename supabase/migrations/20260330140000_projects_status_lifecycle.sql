-- projects.status: hiring(모집중) | ongoing(진행중) | completed(완료)
-- 기존 active|completed 및 임의 값 정리 후 CHECK·기본값 통일

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- 레거시 active → 진행중
UPDATE public.projects SET status = 'ongoing' WHERE status = 'active';

-- 알 수 없는 값은 진행중으로 (데이터 보존)
UPDATE public.projects
SET status = 'ongoing'
WHERE status IS NULL OR status NOT IN ('hiring', 'ongoing', 'completed');

ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'hiring';

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('hiring', 'ongoing', 'completed'));

COMMENT ON COLUMN public.projects.status IS '프로젝트 진행 단계: hiring=모집중, ongoing=진행중, completed=완료';
