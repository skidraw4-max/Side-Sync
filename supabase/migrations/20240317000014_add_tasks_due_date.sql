-- tasks 테이블에 due_date 컬럼 추가 (없을 경우)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date date;
