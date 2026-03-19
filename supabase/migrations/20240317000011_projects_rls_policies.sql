-- projects 테이블 RLS 정책 보완
-- 1. INSERT: 로그인한 사용자가 team_leader_id에 본인 auth.uid()로 프로젝트 생성 가능
-- 2. SELECT: 기존 "Allow public read access" 유지

-- team_leader_id FK를 auth.users(id)로 변경 (profiles 없이도 auth.uid() 저장 가능)
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_team_leader_id_fkey;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_team_leader_id_fkey
  FOREIGN KEY (team_leader_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- INSERT 정책: 인증된 사용자는 team_leader_id = auth.uid() 또는 NULL인 프로젝트 생성 가능
DROP POLICY IF EXISTS "Allow authenticated users to create own projects" ON public.projects;
CREATE POLICY "Allow authenticated users to create own projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (team_leader_id = auth.uid() OR team_leader_id IS NULL);
