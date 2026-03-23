-- applications: 팀 리더 SELECT 정책 재적용 (auth.uid()를 서브쿼리로 평가)
-- 운영에서 리더인데 지원 목록만 비는 경우(정책 누락·평가 순서)와
-- GET /api/projects/[id]/applications 의 세션-only 폴백을 함께 보강합니다.

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaders can read project applications" ON public.applications;

CREATE POLICY "Leaders can read project applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = applications.project_id
        AND p.team_leader_id = (SELECT auth.uid())
    )
  );
