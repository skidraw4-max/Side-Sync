-- public.profiles 에 로그인 이메일 저장 (표시·지원자 관리용). 민감 정보이므로 RLS는 별도 마이그레이션에서 제한합니다.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.profiles.email IS 'auth.users.email 과 동기화 (트리거·온보딩 upsert). 클라이언트 노출 시 RLS 준수.';

-- 기존 행: auth.users 에서 복사
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email IS DISTINCT FROM u.email);

-- 이후 auth 이메일 변경 시 profiles 동기화 (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.sync_profile_email_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email,
      updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;
CREATE TRIGGER on_auth_user_email_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email_from_auth();

COMMENT ON FUNCTION public.sync_profile_email_from_auth() IS 'auth.users 이메일 변경 시 profiles.email 갱신';
