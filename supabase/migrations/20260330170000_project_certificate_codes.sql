-- 링크드인 자격증 식별번호(80자 제한)용 짧은 공개 코드 (예: ss-a1b2c3d4e5f6)
-- 긴 서명 토큰(t=)은 증명서 비밀 링크용으로 유지

CREATE TABLE IF NOT EXISTS public.project_certificate_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_certificate_codes_project_user UNIQUE (project_id, user_id),
  CONSTRAINT project_certificate_codes_code_key UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_project_certificate_codes_code_lower
  ON public.project_certificate_codes (lower(code));

COMMENT ON TABLE public.project_certificate_codes IS
  '프로젝트·참여자별 공개 검증 코드 (LinkedIn certId /verify 경로)';

ALTER TABLE public.project_certificate_codes ENABLE ROW LEVEL SECURITY;

-- 본인 행만 조회 (대시보드 등 클라이언트 확장용)
CREATE POLICY "certificate_codes_select_own"
  ON public.project_certificate_codes
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- 본인 user_id로만 생성
CREATE POLICY "certificate_codes_insert_own"
  ON public.project_certificate_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
