-- avatars 버킷 수동 생성 (Supabase Dashboard > SQL Editor에서 실행)
-- API로 버킷 생성이 안 될 때 사용하세요.

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 정책이 없을 때만 생성 (이미 있으면 에러 가능 - 무시)
DO $$
BEGIN
  -- 업로드 허용
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
  -- 수정 허용
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE TO authenticated
    USING ((storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  -- 삭제 허용
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own avatar' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE TO authenticated
    USING ((storage.foldername(name))[1] = auth.uid()::text);
  END IF;
  -- 공개 읽기
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Avatar images are publicly readable' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Avatar images are publicly readable"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'avatars');
  END IF;
END $$;
