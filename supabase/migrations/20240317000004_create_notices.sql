-- notices 테이블 생성
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('urgent', 'update', 'general', 'event')),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned boolean NOT NULL DEFAULT false,
  send_email boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notices_project_id ON notices(project_id);
