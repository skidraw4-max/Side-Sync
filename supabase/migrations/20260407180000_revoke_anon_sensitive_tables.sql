-- Supabase 보안 알림: sensitive_columns_exposed
--
-- public.profiles 에는 email 등 PII가 있고, applications 에는 지원 동기 등 민감 텍스트가 있을 수 있습니다.
-- RLS(authenticated 전용 정책)로 행 접근은 이미 제한되어 있으나, Postgres 기본 GRANT 로 anon 에
-- 테이블 권한이 남아 있으면 대시보드 휴리스틱이 "API를 통한 공개 노출"로 분류할 수 있습니다.
--
-- anon 역할에서 해당 테이블 권한을 제거합니다. (비로그인 클라이언트는 원칙적으로 이 테이블을
-- 조회하지 않으며, 공개 프로젝트 상세의 프로필 요약은 서비스 롤 등 별도 경로를 사용합니다.)

REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.applications FROM anon;
