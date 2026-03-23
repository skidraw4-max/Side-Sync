-- 지원 거절 사유 저장 (선택)
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS rejection_reason text;

COMMENT ON COLUMN public.applications.rejection_reason IS '거절 시 리더가 입력한 사유 (알림 문구에 포함)';

-- applications RLS: 본인 지원서·본인이 리더인 프로젝트의 지원서만 조회 등
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants can insert own application" ON public.applications;
CREATE POLICY "Applicants can insert own application"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Applicants can read own applications" ON public.applications;
CREATE POLICY "Applicants can read own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Leaders can read project applications" ON public.applications;
CREATE POLICY "Leaders can read project applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = applications.project_id
        AND p.team_leader_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Applicants can update own rejected to reapply" ON public.applications;
CREATE POLICY "Applicants can update own rejected to reapply"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (applicant_id = auth.uid() AND status = 'rejected')
  WITH CHECK (applicant_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Leaders can update project applications" ON public.applications;
CREATE POLICY "Leaders can update project applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = applications.project_id
        AND p.team_leader_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = applications.project_id
        AND p.team_leader_id = auth.uid()
    )
  );
