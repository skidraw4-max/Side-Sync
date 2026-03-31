-- 마이페이지 프로필 직업/역할 태그용 (선택 필드)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS occupation text;

COMMENT ON COLUMN public.profiles.occupation IS '표시용 직업·역할 (예: 프론트엔드 개발자)';
