-- applications INSERT/재신청 UPDATE 시 RLS 위반 완화
-- (일부 환경에서 auth.uid() 평가 순서로 WITH CHECK 실패 보고 대응)
-- 운영 DB에도 `supabase db push` 등으로 반영하세요.

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants can insert own application" ON public.applications;
CREATE POLICY "Applicants can insert own application"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    applicant_id = (SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL
  );

DROP POLICY IF EXISTS "Applicants can update own rejected to reapply" ON public.applications;
CREATE POLICY "Applicants can update own rejected to reapply"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    applicant_id = (SELECT auth.uid())
    AND status = 'rejected'
  )
  WITH CHECK (
    applicant_id = (SELECT auth.uid())
    AND status = 'pending'
  );
