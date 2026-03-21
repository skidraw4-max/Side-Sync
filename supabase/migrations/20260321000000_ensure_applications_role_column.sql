-- applications.role: 지원 포지션 (Stitch/상세/지원 API에서 사용)
-- 프로덕션에 20240317000020 마이그레이션이 적용되지 않은 경우를 대비한 idempotent 보강
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS role text;

COMMENT ON COLUMN public.applications.role IS '지원 시 선택한 포지션 (예: Frontend Developer)';
