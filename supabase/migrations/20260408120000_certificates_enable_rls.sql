-- public.certificates: RLS 미적용·verification_code 노출 린트(0013, 0023) 대응
-- 테이블이 없는 환경(로컬 초기화)에서는 스킵합니다.
-- user_id / participant_id / applicant_id 중 하나 + project_id 가 있어야 정책을 만듭니다.

DO $$
DECLARE
  pol record;
  uid_col text;
BEGIN
  IF to_regclass('public.certificates') IS NULL THEN
    RAISE NOTICE 'public.certificates 가 없어 RLS 마이그레이션을 건너뜁니다.';
    RETURN;
  END IF;

  ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

  FOR pol IN
    SELECT p.polname AS policyname
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'certificates'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.certificates', pol.policyname);
  END LOOP;

  SELECT c.column_name INTO uid_col
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'certificates'
    AND c.column_name IN ('user_id', 'profile_id', 'participant_id', 'applicant_id')
  ORDER BY
    CASE c.column_name
      WHEN 'user_id' THEN 1
      WHEN 'profile_id' THEN 2
      WHEN 'participant_id' THEN 3
      WHEN 'applicant_id' THEN 4
    END
  LIMIT 1;

  IF uid_col IS NULL THEN
    RAISE EXCEPTION
      'public.certificates RLS: user_id, profile_id, participant_id, applicant_id 중 하나가 필요합니다. 대시보드에서 컬럼명을 확인한 뒤 마이그레이션을 조정하세요.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'certificates'
      AND column_name = 'project_id'
  ) THEN
    RAISE EXCEPTION
      'public.certificates RLS: project_id 컬럼이 필요합니다.';
  END IF;

  EXECUTE format(
    $f$
    CREATE POLICY "certificates_select_participant_or_leader"
      ON public.certificates
      FOR SELECT
      TO authenticated
      USING (
        %I = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.projects p
          WHERE p.id = certificates.project_id
            AND p.team_leader_id = (SELECT auth.uid())
        )
      )
    $f$,
    uid_col
  );

  REVOKE ALL ON TABLE public.certificates FROM anon;
END $$;

COMMENT ON TABLE public.certificates IS
  '활동 확인서 관련 행. RLS: 해당 참여자( user_id 등 ) 또는 프로젝트 팀장만 SELECT. 비로그인(anon) 테이블 권한 없음.';
