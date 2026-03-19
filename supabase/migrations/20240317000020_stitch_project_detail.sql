-- Stitch 프로젝트 상세 페이지용 컬럼 추가
-- applications: 지원 포지션(role)
-- projects: visibility, duration_months, est_launch

ALTER TABLE applications ADD COLUMN IF NOT EXISTS role text;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'Public',
  ADD COLUMN IF NOT EXISTS duration_months integer DEFAULT 6,
  ADD COLUMN IF NOT EXISTS est_launch text;
