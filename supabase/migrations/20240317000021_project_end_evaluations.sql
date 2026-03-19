-- 프로젝트 종료 및 상호 평가용 스키마
-- 1. projects.status 추가 ('active'|'completed')
-- 2. peer_evaluations 테이블 (중복 평가 방지)
-- 3. profiles.manner_temp, badges 컬럼 추가

ALTER TABLE projects ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'completed'));

CREATE TABLE IF NOT EXISTS peer_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluatee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score numeric(4,2) NOT NULL,
  quick_feedback text[] DEFAULT '{}',
  additional_feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, evaluator_id, evaluatee_id)
);

CREATE INDEX IF NOT EXISTS idx_peer_evaluations_project ON peer_evaluations(project_id);
CREATE INDEX IF NOT EXISTS idx_peer_evaluations_evaluatee ON peer_evaluations(evaluatee_id);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manner_temp numeric(4,2) DEFAULT 36.5;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}';
