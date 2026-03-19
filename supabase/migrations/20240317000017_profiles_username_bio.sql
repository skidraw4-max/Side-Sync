-- profiles에 username, bio 컬럼 추가 (온보딩 프로필 등록용)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;
