-- tasks 테이블 RLS 정책
-- Supabase Dashboard > SQL Editor에서 실행하세요.
-- 업무 등록 실패(RLS violation) 시 이 스크립트를 실행하면 해결됩니다.

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 기존 정책 모두 제거 (정책명이 다를 수 있음)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tasks', pol.policyname);
  END LOOP;
END $$;

-- SELECT: 모든 사용자 읽기 허용
CREATE POLICY "tasks_select_policy"
  ON public.tasks FOR SELECT
  USING (true);

-- INSERT: 인증된 사용자만 생성 가능
CREATE POLICY "tasks_insert_policy"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: 인증된 사용자 수정 가능
CREATE POLICY "tasks_update_policy"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- DELETE: 인증된 사용자 삭제 가능
CREATE POLICY "tasks_delete_policy"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
