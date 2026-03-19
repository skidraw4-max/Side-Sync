-- goal, recruitment_status 컬럼 추가 (projects 테이블)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS goal text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recruitment_status jsonb DEFAULT '[]'::jsonb;
