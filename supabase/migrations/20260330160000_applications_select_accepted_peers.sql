-- 수락된 팀원이 같은 프로젝트의 다른 수락 지원서를 읽을 수 있게 함
-- (클라이언트에서 팀 목록·평가 대상 조회 시 리더가 아닌 멤버도 동료 applicant_id 를 볼 수 있음)
-- 기존: 본인 지원서만 SELECT → 상호 평가 페이지에서 팀원 목록이 비는 원인

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accepted members read accepted peer applications" ON public.applications;

CREATE POLICY "Accepted members read accepted peer applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    status = 'accepted'
    AND EXISTS (
      SELECT 1
      FROM public.applications a_self
      WHERE a_self.project_id = applications.project_id
        AND a_self.applicant_id = (SELECT auth.uid())
        AND a_self.status = 'accepted'
    )
  );

COMMENT ON POLICY "Accepted members read accepted peer applications" ON public.applications IS
  '같은 프로젝트에서 accepted 인 팀원은 동료의 accepted 지원 행 조회 가능 (리더 정책과 병행, OR)';
