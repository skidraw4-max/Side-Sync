-- 지원 취소: status 에 'canceled' 추가 + 본인 pending 만 취소 가능한 UPDATE 정책

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'canceled'));

COMMENT ON CONSTRAINT applications_status_check ON public.applications IS
  'pending | accepted | rejected | canceled (지원자 본인 취소)';

DROP POLICY IF EXISTS "Applicants can cancel own pending application" ON public.applications;
CREATE POLICY "Applicants can cancel own pending application"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    applicant_id = (SELECT auth.uid())
    AND status = 'pending'
  )
  WITH CHECK (
    applicant_id = (SELECT auth.uid())
    AND status = 'canceled'
  );

-- 거절/취소 후 재지원: rejected 또는 canceled → pending (기존 정책은 rejected 만 허용)
DROP POLICY IF EXISTS "Applicants can update own rejected to reapply" ON public.applications;
CREATE POLICY "Applicants can update own rejected to reapply"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    applicant_id = (SELECT auth.uid())
    AND status IN ('rejected', 'canceled')
  )
  WITH CHECK (
    applicant_id = (SELECT auth.uid())
    AND status = 'pending'
  );
