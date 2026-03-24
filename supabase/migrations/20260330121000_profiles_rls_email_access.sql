-- profiles RLS: 이메일 등 행 단위로만 제어 가능(PostgreSQL은 컬럼 단위 RLS 없음).
-- - 본인: 전체 행(이메일 포함) 읽기/쓰기
-- - 프로젝트 리더: 본인 프로젝트에 지원한 사람(모든 지원 상태) 프로필 읽기 → 지원자 관리에서 이메일 허용
-- - 수락된 팀원: 같은 프로젝트의 다른 수락 팀원 + 해당 프로젝트 리더 프로필 읽기
--
-- 비로그인 공개 상세에서 팀 표시는 RLS를 통과하지 못하므로, 앱에서 SUPABASE_SERVICE_ROLE_KEY 로
-- 이메일을 제외한 컬럼만 조회하는 경로를 사용합니다( projects/[id]/page.tsx ).

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 리더 → 지원자(해당 프로젝트에 application 이 있는 사용자)
DROP POLICY IF EXISTS "profiles_select_leader_for_applicants" ON public.profiles;
CREATE POLICY "profiles_select_leader_for_applicants"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications app
      INNER JOIN public.projects p ON p.id = app.project_id
      WHERE app.applicant_id = profiles.id
        AND p.team_leader_id = auth.uid()
    )
  );

-- 수락 팀원 ↔ 수락 팀원, 수락 팀원 → 리더
DROP POLICY IF EXISTS "profiles_select_teammates_and_leader" ON public.profiles;
CREATE POLICY "profiles_select_teammates_and_leader"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a_self
      INNER JOIN public.applications a_peer
        ON a_peer.project_id = a_self.project_id
       AND a_peer.status = 'accepted'
       AND a_self.status = 'accepted'
      WHERE a_self.applicant_id = auth.uid()
        AND a_peer.applicant_id = profiles.id
    )
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      INNER JOIN public.applications a
        ON a.project_id = p.id
       AND a.applicant_id = auth.uid()
       AND a.status = 'accepted'
      WHERE p.team_leader_id = profiles.id
    )
  );

-- anon: 정책 없음 → SELECT 불가 (공개 페이지는 서비스 롤 + 비이메일 컬럼 select 권장)
