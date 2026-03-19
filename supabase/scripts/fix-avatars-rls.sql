-- avatars Storage RLS 정책 수정
-- "new row violates row-level security policy" 오류 해결
-- Supabase Dashboard > SQL Editor에서 실행하세요.

-- 기존 정책 제거 (있을 경우)
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;

-- avatars 버킷 확인 (없으면 생성)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 본인 폴더(uuid)에만 업로드 허용
-- 경로: {user_id}/avatar.jpg → 첫 번째 폴더명 = user_id
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  (bucket_id = 'avatars' OR bucket_id IN (SELECT id::text FROM storage.buckets WHERE name = 'avatars'))
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

-- 업로드한 파일 수정 허용
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING ((storage.foldername(name))[1] = (auth.jwt()->>'sub'))
WITH CHECK ((storage.foldername(name))[1] = (auth.jwt()->>'sub'));

-- 업로드한 파일 삭제 허용
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING ((storage.foldername(name))[1] = (auth.jwt()->>'sub'));

-- 공개 읽기 (프로필 이미지 URL 접근)
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars' OR bucket_id IN (SELECT id::text FROM storage.buckets WHERE name = 'avatars'));
