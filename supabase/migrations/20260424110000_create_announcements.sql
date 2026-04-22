-- 사이트 전역 공지사항 (수동 작성 + YouTube 자동 수집)
-- 반드시 20260424120000_announcements_youtube_ingest.sql 보다 먼저 적용됩니다.

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  author_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements (created_at DESC);

COMMENT ON TABLE public.announcements IS '사이트 공지 (guide / lab / trend / general 등)';

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select_public" ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_authenticated" ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_authenticated" ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete_authenticated" ON public.announcements;

-- 비로그인·로그인 모두 목록 조회 (헤더 티커, /announcements)
CREATE POLICY "announcements_select_public"
  ON public.announcements
  FOR SELECT
  TO public
  USING (true);

-- 작성·수정·삭제는 로그인 사용자만 (관리자 여부는 애플리케이션/API에서 검증)
CREATE POLICY "announcements_insert_authenticated"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "announcements_update_authenticated"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "announcements_delete_authenticated"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

GRANT SELECT ON TABLE public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.announcements TO authenticated;
GRANT ALL ON TABLE public.announcements TO service_role;
