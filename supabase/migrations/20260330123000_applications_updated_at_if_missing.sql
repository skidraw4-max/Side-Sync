-- 일부 초기 스키마/수동 생성 DB에 applications.updated_at 이 없을 수 있음
-- 앱은 수락·거절·재신청 시 updated_at 을 보내지 않지만, 감사/정렬용으로 컬럼을 맞춰 둡니다.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

COMMENT ON COLUMN public.applications.updated_at IS '지원서 마지막 수정 시각';
