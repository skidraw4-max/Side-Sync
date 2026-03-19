-- avatars Storage 버킷 생성 (공개 읽기 허용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 본인 폴더에만 업로드 허용
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 업로드한 파일 수정/삭제 허용
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING ((storage.foldername(name))[1] = auth.uid()::text);

-- 공개 읽기 (이미지 URL 접근)
CREATE POLICY "Avatar images are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
