-- 팀 리더가 본인 프로젝트를 수정할 수 있도록 UPDATE 정책 추가
-- (기존에는 SELECT/INSERT만 있어 프로젝트 수정 API가 RLS에 막힐 수 있음)

CREATE POLICY "Allow team leaders to update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (team_leader_id = auth.uid())
  WITH CHECK (team_leader_id = auth.uid());
