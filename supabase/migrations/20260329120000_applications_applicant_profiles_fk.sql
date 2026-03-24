-- applications.applicant_id → public.profiles(id) 로 FK를 맞춰 PostgREST/Supabase에서
-- applications 조회 시 profiles 임베드(select('*, profiles(...)'))가 동작하도록 합니다.
-- (기존: REFERENCES auth.users(id) — profiles 테이블과 직접 FK가 없어 조인 힌트가 없음)

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_applicant_id_fkey;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_applicant_id_fkey
  FOREIGN KEY (applicant_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT applications_applicant_id_fkey ON public.applications IS
  '지원자 = profiles.id (일반적으로 auth.users.id 와 동일). 임베드 조회용.';
